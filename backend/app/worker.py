from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.task_routes = {
    "app.tasks.ml_tasks.*": {"queue": "ml-queue"}
}

celery_app.conf.beat_schedule = {
    "train-models-daily": {
        "task": "app.tasks.ml_tasks.train_all_models",
        "schedule": 86400.0,  # 24 hours
    },
}