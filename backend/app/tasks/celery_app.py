from celery import Celery
from celery.schedules import crontab
import asyncio
import structlog

from app.config import settings

logger = structlog.get_logger()

celery_app = Celery(
    "legal_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Jerusalem",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    beat_schedule={
        "sync-odata-daily": {
            "task": "app.tasks.celery_app.sync_odata_task",
            "schedule": crontab(hour=3, minute=0),  # 03:00 AM Israel time
        },
    },
)


def _run_async(coro):
    """Run async coroutine in a new event loop"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="app.tasks.celery_app.sync_odata_task", bind=True, max_retries=3)
def sync_odata_task(self):
    """Sync data from odata.org.il"""
    try:
        logger.info("sync_odata_task_start")
        from app.collectors.odata import ODataCollector
        collector = ODataCollector()
        total = _run_async(collector.sync())
        _run_async(collector.close())
        logger.info("sync_odata_task_done", total=total)
        return {"status": "success", "records": total}
    except Exception as exc:
        logger.error("sync_odata_task_error", error=str(exc))
        self.retry(exc=exc, countdown=2 ** self.request.retries * 60)


@celery_app.task(name="app.tasks.celery_app.import_csv_task", bind=True, max_retries=2)
def import_csv_task(self, file_path: str):
    """Import CSV file"""
    try:
        logger.info("import_csv_task_start", file=file_path)
        from app.collectors.bulk_importer import BulkImporter
        importer = BulkImporter()
        total = _run_async(importer.import_csv(file_path))
        logger.info("import_csv_task_done", total=total)
        return {"status": "success", "records": total}
    except Exception as exc:
        logger.error("import_csv_task_error", error=str(exc))
        self.retry(exc=exc, countdown=60)


@celery_app.task(name="app.tasks.celery_app.update_search_vectors_task")
def update_search_vectors_task():
    """Update PostgreSQL FTS search vectors"""
    try:
        from sqlalchemy import create_engine, text
        engine = create_engine(settings.DATABASE_SYNC_URL)
        with engine.connect() as conn:
            conn.execute(text("""
                UPDATE cases SET search_vector = (
                    setweight(to_tsvector('simple', COALESCE(case_number, '')), 'A') ||
                    setweight(to_tsvector('simple', COALESCE(case_type_description, '')), 'B') ||
                    setweight(to_tsvector('simple', COALESCE(judge_name, '')), 'B') ||
                    setweight(to_tsvector('simple', COALESCE(description, '')), 'C')
                )
                WHERE search_vector IS NULL OR updated_at > NOW() - INTERVAL '1 hour'
            """))
            conn.commit()
        return {"status": "success"}
    except Exception as e:
        logger.error("update_search_vectors_error", error=str(e))
        return {"status": "error", "error": str(e)}
