"""
Collector for odata.org.il CKAN API
Source: https://www.odata.org.il/api/3
Contains: class-action suits, court cases from 2010, labor cases (סע"ש), criminal case judges
"""
import asyncio
from typing import Optional
import structlog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.collectors.base import BaseCollector
from app.database import AsyncSessionLocal
from app.models.case import Case
from app.models.court import Court
from app.models.party import Party

logger = structlog.get_logger()

ODATA_BASE = "https://www.odata.org.il/api/3"

# Known resource IDs on odata.org.il
DATASETS = {
    "class_actions": {
        "dataset": "class-action",
        "description": "תובענות ייצוגיות",
        "case_type": 'ת"צ',
    },
    "cases_2010": {
        "dataset": "2010",
        "description": "תיקי 2010 מנט המשפט",
        "case_type": None,
    },
    "labor_cases": {
        "dataset": "saash-2015-2017",
        "description": "תיקי סע\"ש 2015-2017",
        "case_type": 'סע"ש',
    },
}


class ODataCollector(BaseCollector):
    """Collects data from odata.org.il CKAN API"""

    def __init__(self):
        super().__init__(base_url=ODATA_BASE)

    async def fetch_dataset(self, dataset_id: str) -> dict:
        """Fetch dataset metadata"""
        url = f"{self.base_url}/action/package_show"
        return await self._get(url, params={"id": dataset_id})

    async def fetch_resource(self, resource_id: str, limit: int = 100, offset: int = 0) -> list:
        """Fetch resource records"""
        url = f"{self.base_url}/action/datastore_search"
        result = await self._get(url, params={
            "resource_id": resource_id,
            "limit": limit,
            "offset": offset,
        })
        if result.get("success"):
            return result.get("result", {}).get("records", [])
        return []

    async def fetch_all_records(self, resource_id: str, batch_size: int = 100) -> list:
        """Fetch all records from a resource with pagination"""
        all_records = []
        offset = 0
        while True:
            records = await self.fetch_resource(resource_id, limit=batch_size, offset=offset)
            if not records:
                break
            all_records.extend(records)
            logger.info("odata_fetch_progress", resource_id=resource_id, fetched=len(all_records))
            if len(records) < batch_size:
                break
            offset += batch_size
        return all_records

    async def sync_class_actions(self) -> int:
        """Sync class action suits from odata.org.il"""
        logger.info("sync_class_actions_start")
        try:
            dataset_info = await self.fetch_dataset("class-action")
            if not dataset_info.get("success"):
                logger.warning("class_actions_dataset_not_found")
                return 0

            resources = dataset_info.get("result", {}).get("resources", [])
            total_added = 0

            async with AsyncSessionLocal() as db:
                court_result = await db.execute(
                    select(Court).where(Court.name.ilike("%עליון%")).limit(1)
                )
                default_court = court_result.scalar_one_or_none()
                default_court_id = default_court.id if default_court else None

                for resource in resources[:3]:  # Limit to first 3 resources
                    resource_id = resource.get("id")
                    if not resource_id:
                        continue

                    logger.info("syncing_resource", resource_id=resource_id, name=resource.get("name"))
                    records = await self.fetch_all_records(resource_id)

                    for record in records:
                        added = await self._save_class_action(db, record, default_court_id)
                        if added:
                            total_added += 1

                    await db.commit()

            logger.info("sync_class_actions_done", total=total_added)
            return total_added

        except Exception as e:
            logger.error("sync_class_actions_error", error=str(e))
            return 0

    async def _save_class_action(self, db: AsyncSession, record: dict, default_court_id: Optional[int]) -> bool:
        """Save a single class action record to database"""
        case_number = str(record.get("מספר תיק", record.get("case_number", record.get("_id", "")))).strip()
        if not case_number:
            return False

        court_id = default_court_id
        court_name = record.get("בית משפט", record.get("court", ""))
        if court_name:
            court_result = await db.execute(
                select(Court).where(Court.name.ilike(f"%{court_name[:10]}%")).limit(1)
            )
            found_court = court_result.scalar_one_or_none()
            if found_court:
                court_id = found_court.id

        existing = await db.execute(
            select(Case).where(
                Case.case_number == case_number,
                Case.court_id == court_id
            )
        )
        if existing.scalar_one_or_none():
            return False  # Already exists

        case = Case(
            case_number=case_number,
            case_type='ת"צ',
            case_type_description="תובענה ייצוגית",
            court_id=court_id,
            filing_date=_parse_date(record.get("תאריך הגשה", record.get("filing_date"))),
            status=record.get("סטטוס", record.get("status", "פתוח")),
            judge_name=record.get("שופט", record.get("judge", "")),
            description=record.get("תיאור", record.get("description", "")),
            raw_data=record,
            source_url=f"https://www.odata.org.il",
        )
        db.add(case)
        await db.flush()

        # Add parties if available
        plaintiff = record.get("תובע", record.get("plaintiff", ""))
        if plaintiff:
            db.add(Party(case_id=case.id, name=str(plaintiff)[:500], party_type="תובע"))

        defendant = record.get("נתבע", record.get("defendant", ""))
        if defendant:
            db.add(Party(case_id=case.id, name=str(defendant)[:500], party_type="נתבע"))

        return True

    async def sync(self) -> int:
        return await self.sync_class_actions()


def _parse_date(value):
    if not value:
        return None
    from datetime import date
    import re
    value = str(value).strip()
    # Try ISO format
    try:
        from datetime import datetime
        return datetime.fromisoformat(value[:10]).date()
    except Exception:
        pass
    # Try DD/MM/YYYY
    m = re.match(r"(\d{1,2})/(\d{1,2})/(\d{4})", value)
    if m:
        try:
            return date(int(m.group(3)), int(m.group(2)), int(m.group(1)))
        except Exception:
            pass
    return None
