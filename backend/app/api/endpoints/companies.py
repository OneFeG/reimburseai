"""
Company Endpoints
=================
CRUD operations for companies (tenants).
"""

from fastapi import APIRouter, HTTPException, Query

from app.core.exceptions import AppException
from app.schemas.company import (
    CompanyCreate,
    CompanyResponse,
    CompanyStats,
    CompanyUpdate,
)
from app.services.company import CompanyService

router = APIRouter()


@router.post(
    "",
    response_model=CompanyResponse,
    status_code=201,
    summary="Create a new company",
    description="Register a new company (tenant) in the system.",
)
async def create_company(data: CompanyCreate):
    """
    Create a new company.
    
    This is called during company onboarding. After creation:
    1. Company starts in 'pending' status
    2. KYB verification should be initiated
    3. Dev 1 deploys a vault and links it via `/api/vaults/link`
    """
    try:
        service = CompanyService()
        company = await service.create(data)
        return company
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.get(
    "/{company_id}",
    response_model=CompanyResponse,
    summary="Get company by ID",
)
async def get_company(company_id: str):
    """Get company details by UUID."""
    try:
        service = CompanyService()
        return await service.get_by_id(company_id)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.get(
    "/slug/{slug}",
    response_model=CompanyResponse,
    summary="Get company by slug",
    description="Get company by URL-friendly slug (e.g., 'acme-corp').",
)
async def get_company_by_slug(slug: str):
    """
    Get company by slug.
    Used for routing like reimburse.ai/[company_slug].
    """
    try:
        service = CompanyService()
        return await service.get_by_slug(slug)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.patch(
    "/{company_id}",
    response_model=CompanyResponse,
    summary="Update company",
)
async def update_company(company_id: str, data: CompanyUpdate):
    """Update company details."""
    try:
        service = CompanyService()
        return await service.update(company_id, data)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.get(
    "/{company_id}/stats",
    response_model=CompanyStats,
    summary="Get company statistics",
    description="Get dashboard statistics for a company.",
)
async def get_company_stats(company_id: str):
    """
    Get company statistics for the dashboard.
    Includes employee counts, receipt counts, and spending totals.
    """
    try:
        service = CompanyService()
        return await service.get_stats(company_id)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.get(
    "",
    summary="List all companies",
    description="List all companies (admin only).",
)
async def list_companies(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """
    List all companies.
    This should be restricted to platform admins in production.
    """
    try:
        service = CompanyService()
        companies, total = await service.list_all(page, limit)
        return {
            "success": True,
            "data": companies,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "total_pages": (total + limit - 1) // limit,
            },
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
