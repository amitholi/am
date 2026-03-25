"""
Collector for data.gov.il CKAN API
Source: https://data.gov.il/api/3
Government open data portal
"""
import structlog
from app.collectors.base import BaseCollector

logger = structlog.get_logger()

DATA_GOV_BASE = "https://data.gov.il/api/3"


class DataGovCollector(BaseCollector):
    """Collects data from Israeli government open data portal"""

    def __init__(self):
        super().__init__(base_url=DATA_GOV_BASE)

    async def search_datasets(self, query: str) -> list:
        """Search for court-related datasets"""
        url = f"{self.base_url}/action/package_search"
        result = await self._get(url, params={"q": query, "rows": 50})
        if result.get("success"):
            return result.get("result", {}).get("results", [])
        return []

    async def fetch_resource_data(self, resource_id: str, limit: int = 100, offset: int = 0) -> list:
        """Fetch resource data"""
        url = f"{self.base_url}/action/datastore_search"
        result = await self._get(url, params={
            "resource_id": resource_id,
            "limit": limit,
            "offset": offset,
        })
        if result.get("success"):
            return result.get("result", {}).get("records", [])
        return []

    async def list_court_datasets(self) -> list:
        """List all court-related datasets"""
        datasets = await self.search_datasets("בית משפט")
        logger.info("found_court_datasets", count=len(datasets))
        return [
            {
                "id": ds.get("id"),
                "name": ds.get("name"),
                "title": ds.get("title"),
                "notes": ds.get("notes", "")[:200],
                "resources": [
                    {"id": r.get("id"), "name": r.get("name"), "format": r.get("format")}
                    for r in ds.get("resources", [])
                ],
            }
            for ds in datasets
        ]

    async def sync(self) -> int:
        """Sync relevant datasets from data.gov.il"""
        logger.info("data_gov_sync_start")
        datasets = await self.list_court_datasets()
        logger.info("data_gov_datasets_found", count=len(datasets))
        # Future: implement specific dataset imports based on what's available
        return 0
