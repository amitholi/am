from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List

from app.database import get_db
from app.models.case import Case
from app.models.court import Court
from app.models.party import Party
from app.models.document import Document
from app.models.hearing import Hearing
from app.models.attorney import CaseAttorney, Attorney
from app.schemas.case import CaseOut, CaseListOut, PaginatedCases
from app.schemas.party import PartyOut
from app.schemas.document import DocumentOut
from app.schemas.hearing import HearingOut
from app.cache import cache_get, cache_set, make_cache_key

router = APIRouter()


@router.get("/cases/{case_id}", response_model=CaseOut)
async def get_case(case_id: int, db: AsyncSession = Depends(get_db)):
    cache_key = f"case:{case_id}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    result = await db.execute(
        select(Case, Court.name.label("court_name"))
        .outerjoin(Court, Case.court_id == Court.id)
        .where(Case.id == case_id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="תיק לא נמצא")

    case = row[0]
    out = CaseOut.model_validate(case)
    await cache_set(cache_key, out.model_dump())
    return out


@router.get("/cases/by-number/{case_number}")
async def get_case_by_number(
    case_number: str,
    court_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Case).where(Case.case_number == case_number)
    if court_id:
        query = query.where(Case.court_id == court_id)
    result = await db.execute(query)
    cases = result.scalars().all()
    if not cases:
        raise HTTPException(status_code=404, detail="תיק לא נמצא")
    return [CaseOut.model_validate(c) for c in cases]


@router.get("/cases/{case_id}/parties", response_model=List[PartyOut])
async def get_case_parties(case_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Party).where(Party.case_id == case_id).order_by(Party.party_number)
    )
    return [PartyOut.model_validate(p) for p in result.scalars().all()]


@router.get("/cases/{case_id}/documents", response_model=List[DocumentOut])
async def get_case_documents(case_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Document)
        .where(Document.case_id == case_id)
        .order_by(Document.filing_date.desc().nullslast())
    )
    return [DocumentOut.model_validate(d) for d in result.scalars().all()]


@router.get("/cases/{case_id}/hearings", response_model=List[HearingOut])
async def get_case_hearings(case_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Hearing)
        .where(Hearing.case_id == case_id)
        .order_by(Hearing.hearing_date.desc().nullslast())
    )
    return [HearingOut.model_validate(h) for h in result.scalars().all()]


@router.get("/cases/{case_id}/timeline")
async def get_case_timeline(case_id: int, db: AsyncSession = Depends(get_db)):
    case_result = await db.execute(select(Case).where(Case.id == case_id))
    case = case_result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="תיק לא נמצא")

    events = []

    if case.filing_date:
        events.append({
            "date": str(case.filing_date),
            "type": "filing",
            "title": "הגשת תיק",
            "description": f"תיק {case.case_number} הוגש לבית המשפט",
        })

    doc_result = await db.execute(
        select(Document)
        .where(Document.case_id == case_id)
        .where(Document.filing_date.isnot(None))
        .order_by(Document.filing_date)
    )
    for doc in doc_result.scalars().all():
        events.append({
            "date": str(doc.filing_date),
            "type": "document",
            "title": doc.document_type or "מסמך",
            "description": doc.title,
            "id": doc.id,
        })

    hearing_result = await db.execute(
        select(Hearing)
        .where(Hearing.case_id == case_id)
        .where(Hearing.hearing_date.isnot(None))
        .order_by(Hearing.hearing_date)
    )
    for h in hearing_result.scalars().all():
        events.append({
            "date": str(h.hearing_date),
            "type": "hearing",
            "title": h.hearing_type or "דיון",
            "description": h.notes,
            "courtroom": h.courtroom,
            "id": h.id,
        })

    events.sort(key=lambda x: x["date"] or "")
    return {"case_id": case_id, "events": events}
