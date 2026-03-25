from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.api.v1 import search, cases, parties, attorneys, judges, statistics, export, admin

limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

app = FastAPI(
    title="מאגר תיקי בתי משפט ישראלי",
    description="API לחיפוש, עיון וניתוח נתוני תיקי בתי משפט בישראל",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router, prefix="/api/v1", tags=["חיפוש"])
app.include_router(cases.router, prefix="/api/v1", tags=["תיקים"])
app.include_router(parties.router, prefix="/api/v1", tags=["צדדים"])
app.include_router(attorneys.router, prefix="/api/v1", tags=["עורכי דין"])
app.include_router(judges.router, prefix="/api/v1", tags=["שופטים"])
app.include_router(statistics.router, prefix="/api/v1", tags=["סטטיסטיקות"])
app.include_router(export.router, prefix="/api/v1", tags=["ייצוא"])
app.include_router(admin.router, prefix="/api/v1", tags=["ניהול"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(status_code=404, content={"detail": "לא נמצא"})


@app.exception_handler(500)
async def server_error_handler(request: Request, exc):
    return JSONResponse(status_code=500, content={"detail": "שגיאת שרת פנימית"})
