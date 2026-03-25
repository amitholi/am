from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, text, cast
from sqlalchemy.dialects.postgresql import TSVECTOR
from typing import Optional, List
import json

from app.database import get_db
from app.models.case import Case
from app.models.court import Court
from app.models.party import Party
from app.schemas.case import PaginatedCases, CaseListOut
from app.cache import cache_get, cache_set, make_cache_key

router = APIRouter()


@router.get("/search", response_model=PaginatedCases)
async def search_cases(
    request: Request,
    q: Optional[str] = Query(None, description="חיפוש חופשי"),
    case_type: Optional[str] = Query(None),
    court_id: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    judge_name: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sort: Optional[str] = Query("relevance", enum=["relevance", "date_desc", "date_asc", "case_number"]),
    db: AsyncSession = Depends(get_db),
):
    cache_key = make_cache_key(
        "search", q=q, case_type=case_type, court_id=court_id,
        date_from=date_from, date_to=date_to, status=status,
        judge_name=judge_name, page=page, per_page=per_page, sort=sort
    )
    cached = await cache_get(cache_key)
    if cached:
        return cached

    offset = (page - 1) * per_page

    # Build query
    query = (
        select(Case, Court.name.label("court_name"))
        .outerjoin(Court, Case.court_id == Court.id)
    )
    count_query = select(func.count(Case.id)).outerjoin(Court, Case.court_id == Court.id)

    filters = []

    if q:
        ts_query = func.plainto_tsquery("simple", q)
        fts_filter = Case.search_vector.op("@@")(ts_query)
        # Also search in case_number and judge_name
        text_filter = or_(
            Case.case_number.ilike(f"%{q}%"),
            Case.judge_name.ilike(f"%{q}%"),
            Case.description.ilike(f"%{q}%"),
        )
        filters.append(or_(fts_filter, text_filter))

    if case_type:
        filters.append(Case.case_type == case_type)
    if court_id:
        filters.append(Case.court_id == court_id)
    if date_from:
        filters.append(Case.filing_date >= date_from)
    if date_to:
        filters.append(Case.filing_date <= date_to)
    if status:
        filters.append(Case.status == status)
    if judge_name:
        filters.append(Case.judge_name.ilike(f"%{judge_name}%"))

    if filters:
        from sqlalchemy import and_
        query = query.where(and_(*filters))
        count_query = count_query.where(and_(*filters))

    # Sorting
    if sort == "date_desc":
        query = query.order_by(Case.filing_date.desc().nullslast())
    elif sort == "date_asc":
        query = query.order_by(Case.filing_date.asc().nullsfirst())
    elif sort == "case_number":
        query = query.order_by(Case.case_number)
    else:
        if q:
            ts_query = func.plainto_tsquery("simple", q)
            query = query.order_by(
                func.ts_rank(Case.search_vector, ts_query).desc()
            )
        else:
            query = query.order_by(Case.filing_date.desc().nullslast())

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    result = await db.execute(query.offset(offset).limit(per_page))
    rows = result.all()

    # Facets
    facets = await _get_facets(db, filters if filters else [])

    items = []
    for row in rows:
        case = row[0]
        court_name = row[1]
        items.append(CaseListOut(
            id=case.id,
            case_number=case.case_number,
            case_type=case.case_type,
            case_type_description=case.case_type_description,
            court_id=case.court_id,
            court_name=court_name,
            filing_date=case.filing_date,
            status=case.status,
            judge_name=case.judge_name,
            description=case.description,
        ))

    pages = (total + per_page - 1) // per_page if per_page > 0 else 0
    response = PaginatedCases(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
        facets=facets,
    )
    response_dict = response.model_dump()
    await cache_set(cache_key, response_dict)
    return response


async def _get_facets(db: AsyncSession, filters: list) -> dict:
    from sqlalchemy import and_

    base_filter = and_(*filters) if filters else True

    # Case types facet
    ct_query = (
        select(Case.case_type, func.count(Case.id).label("count"))
        .where(base_filter)
        .group_by(Case.case_type)
        .order_by(func.count(Case.id).desc())
        .limit(20)
    )
    ct_result = await db.execute(ct_query)
    case_types = [{"value": r[0], "count": r[1]} for r in ct_result.all() if r[0]]

    # Courts facet
    court_query = (
        select(Court.id, Court.name, func.count(Case.id).label("count"))
        .outerjoin(Case, Case.court_id == Court.id)
        .where(base_filter)
        .group_by(Court.id, Court.name)
        .order_by(func.count(Case.id).desc())
        .limit(20)
    )
    court_result = await db.execute(court_query)
    courts = [{"id": r[0], "name": r[1], "count": r[2]} for r in court_result.all() if r[0]]

    # Status facet
    status_query = (
        select(Case.status, func.count(Case.id).label("count"))
        .where(base_filter)
        .group_by(Case.status)
        .order_by(func.count(Case.id).desc())
    )
    status_result = await db.execute(status_query)
    statuses = [{"value": r[0], "count": r[1]} for r in status_result.all() if r[0]]

    # Years facet
    year_query = (
        select(
            func.extract("year", Case.filing_date).label("year"),
            func.count(Case.id).label("count")
        )
        .where(base_filter)
        .where(Case.filing_date.isnot(None))
        .group_by(text("year"))
        .order_by(text("year desc"))
        .limit(20)
    )
    year_result = await db.execute(year_query)
    years = [{"year": int(r[0]), "count": r[1]} for r in year_result.all() if r[0]]

    return {
        "case_types": case_types,
        "courts": courts,
        "statuses": statuses,
        "years": years,
    }
