from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from app.database import get_db
from app.models.party import Party
from app.models.case import Case
from app.models.court import Court
from app.schemas.party import PartyOut
from app.schemas.case import CaseListOut

router = APIRouter()


@router.get("/parties/search")
async def search_parties(
    name: str = Query(..., min_length=2),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Party).where(Party.name.ilike(f"%{name}%"))
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar() or 0

    result = await db.execute(query.offset((page - 1) * per_page).limit(per_page))
    parties = result.scalars().all()

    return {
        "items": [PartyOut.model_validate(p) for p in parties],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.get("/parties/{party_id}/cases")
async def get_party_cases(
    party_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    party_result = await db.execute(select(Party).where(Party.id == party_id))
    party = party_result.scalar_one_or_none()
    if not party:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="צד לא נמצא")

    # Find all cases with this party name
    case_ids_query = select(Party.case_id).where(Party.name == party.name).distinct()
    case_ids_result = await db.execute(case_ids_query)
    case_ids = [r[0] for r in case_ids_result.all()]

    query = (
        select(Case, Court.name.label("court_name"))
        .outerjoin(Court, Case.court_id == Court.id)
        .where(Case.id.in_(case_ids))
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

    return {"party": PartyOut.model_validate(party), "cases": items, "total": total}
