"""
Reimburse.ai Backend - FastAPI Application
==========================================
Main entry point for the API server.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.config import settings
from app.core.exceptions import AppException


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Runs startup and shutdown logic.
    """
    # Startup
    print(f"🚀 Starting {settings.app_name}...")
    print(f"📦 Environment: {settings.app_env}")
    print(f"🔗 Supabase URL: {settings.supabase_url[:30]}..." if settings.supabase_url else "⚠️ Supabase URL not configured")
    
    # Initialize storage bucket
    try:
        from app.db.supabase import init_storage_bucket
        init_storage_bucket()
    except Exception as e:
        print(f"⚠️ Storage initialization warning: {e}")
    
    yield
    
    # Shutdown
    print("👋 Shutting down...")


# Create FastAPI app
app = FastAPI(
    title="Reimburse.ai API",
    description="""
    ## AI-Powered Expense Reimbursement Platform
    
    This API provides the backend for Reimburse.ai, enabling:
    
    - **Receipt Upload**: Employees upload expense receipts
    - **AI Auditing**: Automated receipt verification via x402 protocol
    - **Instant Settlement**: USDC payouts on Avalanche
    - **Multi-Tenant**: Company-isolated data with Row Level Security
    
    ### Architecture
    
    ```
    Employee → Upload API → Storage → Auditor (x402) → Treasury → USDC Payout
    ```
    
    ### Authentication
    
    Most endpoints require these headers:
    - `X-Company-ID`: Company UUID
    - `X-Employee-ID`: Employee UUID (for employee actions)
    - `X-API-Key`: API key (for service-to-service calls)
    """,
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    openapi_url="/openapi.json" if settings.debug else None,
    lifespan=lifespan,
)


# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler for AppException
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """Handle custom application exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict(),
    )


# Include API router
app.include_router(api_router, prefix="/api")


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint - API information."""
    return {
        "name": "Reimburse.ai API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs" if settings.debug else "disabled",
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
