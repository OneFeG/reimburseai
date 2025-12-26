"""
Health Check Endpoints
======================
Basic health and readiness checks.
"""

from datetime import UTC, datetime

from fastapi import APIRouter

from app.config import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Basic health check endpoint.
    Returns 200 if the service is running.
    """
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": "1.0.0",
        "timestamp": datetime.now(UTC).isoformat(),
    }


@router.get("/ready")
async def readiness_check():
    """
    Readiness check - verifies all dependencies are available.
    """
    checks = {
        "database": False,
        "storage": False,
    }

    # Check Supabase connection
    try:
        from app.db.supabase import get_supabase_admin_client

        client = get_supabase_admin_client()
        # Simple query to test connection
        client.table("companies").select("id").limit(1).execute()
        checks["database"] = True
    except Exception:
        pass

    # Check storage
    try:
        from app.db.supabase import get_storage_client

        storage = get_storage_client()
        storage.list_buckets()
        checks["storage"] = True
    except Exception:
        pass

    all_healthy = all(checks.values())

    return {
        "status": "ready" if all_healthy else "degraded",
        "checks": checks,
        "timestamp": datetime.now(UTC).isoformat(),
    }
