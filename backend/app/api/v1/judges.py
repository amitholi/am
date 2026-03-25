from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text

from app.database import get_db
from app.models.judge import Judge
from app.models.case import Case
from app.models.court import Court
from app.schemas.judge import JudgeOut, JudgeStats
from app.schemas.case import CaseListOut

router = APIRouter()


@router.get("/judges")
async def list_judges(
    court_id: int = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Judge, Court.name.label("court_name"))
        .outerjoin(Court, Judge.court_id == Court.id)
    )
    if court_id:
        query = query.where(Judge.court_id == court_id)

    count_result = await db.execute(select(func.count(Judge.id)))
    total = count_result.scalar() or 0

    result = await db.execute(query.order_by(Judge.name).offset((page - 1) * per_page).limit(per_page))
    rows = result.all()

    items = []
    for row in rows:
        judge = row[0]
        j = JudgeOut.model_validate(judge)
        j.court_name = row[1]
        items.append(j)

    return {"items": items, "total": total, "page": page, "per_page": per_page}


@router.get("/judges/{judge_id}", response_model=JudgeOut)
async def get_judge(judge_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Judge, Court.name.label("court_name"))
        .outerjoin(Court, Judge.court_id == Court.id)
        .where(Judge.id == judge_id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="שופט לא נמצא")
    judge = row[0]
    out = JudgeOut.model_validate(judge)
    out.court_name = row[1]
    return out


@router.get("/judges/{judge_id}/cases")
async def get_judge_cases(
    judge_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Case, Court.name.label("court_name"))
        .outerjoin(Court, Case.court_id == Court.id)
        .where(Case.judge_id == judge_id)
        .order_by(Case.filing_date.desc().nullslast())
    )
    count_result = await db.execute(
        select(func.count(Case.id)).where(Case.judge_id == judge_id)
    )
    total = count_result.scalar() or 0

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

    return {"cases": items, "total": total, "page": page, "per_page": per_page}


@router.get("/judges/{judge_id}/statistics", response_model=JudgeStats)
async def get_judge_statistics(judge_id: int, db: AsyncSession = Depends(get_db)):
    judge_result = await db.execute(select(Judge).where(Judge.id == judge_id))
    judge = judge_result.scalar_one_or_none()
    if not judge:
        raise HTTPException(status_code=404, detail="שופט לא נמצא")

    total_result = await db.execute(
        select(func.count(Case.id)).where(Case.judge_id == judge_id)
    )
    total_cases = total_result.scalar() or 0

    open_result = await db.execute(
        select(func.count(Case.id)).where(Case.judge_id == judge_id, Case.status == "פתוח")
    )
    open_cases = open_result.scalar() or 0

    closed_result = await db.execute(
        select(func.count(Case.id)).where(Case.judge_id == judge_id, Case.status == "סגור")
    )
    closed_cases = closed_result.scalar() or 0

    ct_result = await db.execute(
        select(Case.case_type, func.count(Case.id).label("count"))
        .where(Case.judge_id == judge_id)
        .group_by(Case.case_type)
        .order_by(func.count(Case.id).desc())
    )
    case_types = [{"type": r[0], "count": r[1]} for r in ct_result.all()]

    year_result = await db.execute(
        select(
            func.extract("year", Case.filing_date).label("year"),
            func.count(Case.id).label("count")
        )
        .where(Case.judge_id == judge_id, Case.filing_date.isnot(None))
        .group_by(text("year"))
        .order_by(text("year"))
    )
    cases_by_year = [{"year": int(r[0]), "count": r[1]} for r in year_result.all()]

    return JudgeStats(
        judge_id=judge_id,
        judge_name=judge.name,
        total_cases=total_cases,
        open_cases=open_cases,
        closed_cases=closed_cases,
        case_types=case_types,
        cases_by_year=cases_by_year,
    )
