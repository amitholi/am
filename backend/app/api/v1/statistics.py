from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text

from app.database import get_db
from app.models.case import Case
from app.models.court import Court
from app.models.judge import Judge
from app.models.attorney import Attorney
from app.cache import cache_get, cache_set

router = APIRouter()


@router.get("/statistics/overview")
async def get_overview(db: AsyncSession = Depends(get_db)):
    cached = await cache_get("stats:overview")
    if cached:
        return cached

    total_cases = (await db.execute(select(func.count(Case.id)))).scalar() or 0
    open_cases = (await db.execute(select(func.count(Case.id)).where(Case.status == "פתוח"))).scalar() or 0
    closed_cases = (await db.execute(select(func.count(Case.id)).where(Case.status == "סגור"))).scalar() or 0
    total_courts = (await db.execute(select(func.count(Court.id)))).scalar() or 0
    total_judges = (await db.execute(select(func.count(Judge.id)))).scalar() or 0
    total_attorneys = (await db.execute(select(func.count(Attorney.id)))).scalar() or 0

    class_actions = (await db.execute(
        select(func.count(Case.id)).where(Case.case_type == 'ת"צ')
    )).scalar() or 0

    result = {
        "total_cases": total_cases,
        "open_cases": open_cases,
        "closed_cases": closed_cases,
        "total_courts": total_courts,
        "total_judges": total_judges,
        "total_attorneys": total_attorneys,
        "class_actions": class_actions,
    }
    await cache_set("stats:overview", result, ttl=600)
    return result


@router.get("/statistics/by-court")
async def get_by_court(db: AsyncSession = Depends(get_db)):
    cached = await cache_get("stats:by_court")
    if cached:
        return cached

    result = await db.execute(
        select(Court.id, Court.name, Court.court_type, func.count(Case.id).label("count"))
        .outerjoin(Case, Case.court_id == Court.id)
        .group_by(Court.id, Court.name, Court.court_type)
        .order_by(func.count(Case.id).desc())
    )
    data = [{"id": r[0], "name": r[1], "court_type": r[2], "count": r[3]} for r in result.all()]
    await cache_set("stats:by_court", data, ttl=600)
    return data


@router.get("/statistics/by-type")
async def get_by_type(db: AsyncSession = Depends(get_db)):
    cached = await cache_get("stats:by_type")
    if cached:
        return cached

    result = await db.execute(
        select(Case.case_type, Case.case_type_description, func.count(Case.id).label("count"))
        .group_by(Case.case_type, Case.case_type_description)
        .order_by(func.count(Case.id).desc())
    )
    data = [{"type": r[0], "description": r[1], "count": r[2]} for r in result.all() if r[0]]
    await cache_set("stats:by_type", data, ttl=600)
    return data


@router.get("/statistics/by-year")
async def get_by_year(db: AsyncSession = Depends(get_db)):
    cached = await cache_get("stats:by_year")
    if cached:
        return cached

    result = await db.execute(
        select(
            func.extract("year", Case.filing_date).label("year"),
            func.count(Case.id).label("count")
        )
        .where(Case.filing_date.isnot(None))
        .group_by(text("year"))
        .order_by(text("year"))
    )
    data = [{"year": int(r[0]), "count": r[1]} for r in result.all() if r[0]]
    await cache_set("stats:by_year", data, ttl=600)
    return data


@router.get("/statistics/trends")
async def get_trends(
    months: int = Query(24, ge=1, le=120),
    db: AsyncSession = Depends(get_db),
):
    cache_key = f"stats:trends:{months}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    result = await db.execute(
        select(
            func.to_char(Case.filing_date, "YYYY-MM").label("month"),
            func.count(Case.id).label("count")
        )
        .where(Case.filing_date.isnot(None))
        .where(
            Case.filing_date >= text(f"CURRENT_DATE - INTERVAL '{months} months'")
        )
        .group_by(text("month"))
        .order_by(text("month"))
    )
    data = [{"month": r[0], "count": r[1]} for r in result.all() if r[0]]
    await cache_set(cache_key, data, ttl=600)
    return data


@router.get("/statistics/top-judges")
async def get_top_judges(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Judge.id, Judge.name, Judge.title, func.count(Case.id).label("count"))
        .outerjoin(Case, Case.judge_id == Judge.id)
        .group_by(Judge.id, Judge.name, Judge.title)
        .order_by(func.count(Case.id).desc())
        .limit(limit)
    )
    return [{"id": r[0], "name": r[1], "title": r[2], "count": r[3]} for r in result.all()]


@router.get("/statistics/top-attorneys")
async def get_top_attorneys(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    from app.models.attorney import CaseAttorney
    result = await db.execute(
        select(Attorney.id, Attorney.name, Attorney.firm_name, func.count(CaseAttorney.case_id).label("count"))
        .outerjoin(CaseAttorney, CaseAttorney.attorney_id == Attorney.id)
        .group_by(Attorney.id, Attorney.name, Attorney.firm_name)
        .order_by(func.count(CaseAttorney.case_id).desc())
        .limit(limit)
    )
    return [{"id": r[0], "name": r[1], "firm": r[2], "count": r[3]} for r in result.all()]
