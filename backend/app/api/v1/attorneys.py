from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.attorney import Attorney, CaseAttorney
from app.models.case import Case
from app.models.court import Court
from app.schemas.attorney import AttorneyOut
from app.schemas.case import CaseListOut

router = APIRouter()


@router.get("/attorneys/search")
async def search_attorneys(
    name: str = Query(..., min_length=2),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Attorney).where(Attorney.name.ilike(f"%{name}%"))
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar() or 0

    result = await db.execute(query.offset((page - 1) * per_page).limit(per_page))
    attorneys = result.scalars().all()

    return {
        "items": [AttorneyOut.model_validate(a) for a in attorneys],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.get("/attorneys/{attorney_id}")
async def get_attorney(attorney_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Attorney).where(Attorney.id == attorney_id))
    attorney = result.scalar_one_or_none()
    if not attorney:
        raise HTTPException(status_code=404, detail="עורך דין לא נמצא")
    return AttorneyOut.model_validate(attorney)


@router.get("/attorneys/{attorney_id}/cases")
async def get_attorney_cases(
    attorney_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    attorney_result = await db.execute(select(Attorney).where(Attorney.id == attorney_id))
    attorney = attorney_result.scalar_one_or_none()
    if not attorney:
        raise HTTPException(status_code=404, detail="עורך דין לא נמצא")

    case_ids_query = (
        select(CaseAttorney.case_id)
        .where(CaseAttorney.attorney_id == attorney_id)
        .distinct()
    )
    case_ids_result = await db.execute(case_ids_query)
    case_ids = [r[0] for r in case_ids_result.all()]

    query = (
        select(Case, Court.name.label("court_name"))
        .outerjoin(Court, Case.court_id == Court.id)
        .where(Case.id.in_(case_ids))
        .order_by(Case.filing_date.desc().nullslast())
    )
    total = len(case_ids)
    result = await db.execute(query.offset((page - 1) * per_page).limit(per_page))
    rows = result.all()

    items = [
        CaseListOut(
            id=row[0].id,
            case_number=row[0].case_number,
            case_type=row[0].case_type,
            case_type_description=row[0].case_type_description,
            court_id=row[0].court_id,
            court_name=row[1],
            filing_date=row[0].filing_date,
            status=row[0].status,
            judge_name=row[0].judge_name,
        )
        for row in rows
    ]

    return {"attorney": AttorneyOut.model_validate(attorney), "cases": items, "total": total}
