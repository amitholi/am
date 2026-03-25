import json
import hashlib
from typing import Any, Optional
import redis.asyncio as aioredis
from app.config import settings

_redis_client: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client


def make_cache_key(prefix: str, **kwargs) -> str:
    key_data = json.dumps(kwargs, sort_keys=True, ensure_ascii=False)
    key_hash = hashlib.md5(key_data.encode()).hexdigest()
    return f"{prefix}:{key_hash}"


async def cache_get(key: str) -> Optional[Any]:
    redis = await get_redis()
    value = await redis.get(key)
    if value:
        return json.loads(value)
    return None


async def cache_set(key: str, value: Any, ttl: int = None) -> None:
    redis = await get_redis()
    if ttl is None:
        ttl = settings.CACHE_TTL
    await redis.setex(key, ttl, json.dumps(value, ensure_ascii=False, default=str))


async def cache_delete(pattern: str) -> None:
    redis = await get_redis()
    keys = await redis.keys(pattern)
    if keys:
        await redis.delete(*keys)
