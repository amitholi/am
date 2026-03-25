import asyncio
import httpx
from abc import ABC, abstractmethod
from typing import Any, Optional
from tenacity import retry, stop_after_attempt, wait_exponential
import structlog

logger = structlog.get_logger()

RATE_LIMIT_DELAY = 6.0  # 10 req/min = 6 sec between requests


class BaseCollector(ABC):
    """Base class for all data collectors"""

    def __init__(self, base_url: str, rate_limit_delay: float = RATE_LIMIT_DELAY):
        self.base_url = base_url
        self.rate_limit_delay = rate_limit_delay
        self._last_request_time = 0.0
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=30.0,
                headers={"User-Agent": "IsraeliLegalDB/1.0 (research; contact@example.com)"},
                follow_redirects=True,
            )
        return self._client

    async def _rate_limit(self):
        import time
        now = time.time()
        elapsed = now - self._last_request_time
        if elapsed < self.rate_limit_delay:
            await asyncio.sleep(self.rate_limit_delay - elapsed)
        self._last_request_time = time.time()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=30))
    async def _get(self, url: str, params: dict = None) -> Any:
        await self._rate_limit()
        client = await self._get_client()
        response = await client.get(url, params=params)
        response.raise_for_status()
        return response.json()

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    @abstractmethod
    async def sync(self) -> int:
        """Sync data from source. Returns number of records added/updated."""
        pass
