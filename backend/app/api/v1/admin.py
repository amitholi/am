from fastapi import APIRouter, Depends, Header, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
import aiofiles
import os

from app.database import get_db
from app.config import settings
from app.models.case import Case
from app.models.court import Court
from app.models.judge import Judge
from app.models.attorney import Attorney
from app.models.party import Party
from app.models.document import Document
from app.models.hearing import Hearing
from app.cache import cache_delete

router = APIRouter()


def require_admin(x_api_key: str = Header(...)):
    if x_api_key != settings.ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="אין הרשאה")


@router.post("/admin/sync/odata")
async def sync_odata(
    background_tasks: BackgroundTasks,
    _: None = Depends(require_admin),
):
    from app.tasks.celery_app import sync_odata_task
    task = sync_odata_task.delay()
    return {"message": "סנכרון הופעל", "task_id": task.id}


@router.get("/admin/sync/status")
async def sync_status(_: None = Depends(require_admin)):
    try:
        from app.tasks.celery_app import celery_app
        inspect = celery_app.control.inspect()
        active = inspect.active() or {}
        scheduled = inspect.scheduled() or {}
        return {
            "active_tasks": active,
            "scheduled_tasks": scheduled,
        }
    except Exception as e:
        return {"error": str(e), "active_tasks": {}, "scheduled_tasks": {}}


@router.get("/admin/stats")
async def admin_stats(
    _: None = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    tables = {
        "cases": Case,
        "courts": Court,
        "judges": Judge,
        "attorneys": Attorney,
        "parties": Party,
        "documents": Document,
        "hearings": Hearing,
    }
    counts = {}
    for name, model in tables.items():
        result = await db.execute(select(func.count(model.id)))
        counts[name] = result.scalar() or 0

    return {"table_counts": counts}


@router.post("/admin/import/csv")
async def import_csv(
    file: UploadFile = File(...),
    _: None = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="יש להעלות קובץ CSV")

    upload_dir = "/app/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)

    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    from app.tasks.celery_app import import_csv_task
    task = import_csv_task.delay(file_path)
    return {"message": "ייבוא הופעל", "task_id": task.id, "file": file.filename}


@router.post("/admin/cache/clear")
async def clear_cache(_: None = Depends(require_admin)):
    await cache_delete("*")
    return {"message": "קאש נוקה"}
