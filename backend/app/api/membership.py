"""
Multi-Company Membership API Endpoints
======================================
Endpoints for managing employee company memberships.
"""

from fastapi import APIRouter, HTTPException, status, Header
from typing import Optional

from app.schemas.membership import (
    MembershipCreate,
    MembershipUpdate,
    MembershipResponse,
    MembershipWithCompany,
    EmployeeCompaniesResponse,
    SwitchCompanyRequest,
    SwitchCompanyResponse,
    AddCompanyRequest,
)
from app.services.membership import membership_service
from app.core.exceptions import NotFoundException, ConflictException, ForbiddenException


router = APIRouter(prefix="/memberships", tags=["Multi-Company"])


@router.get(
    "/employee/{employee_id}/companies",
    response_model=EmployeeCompaniesResponse,
    summary="Get employee's companies",
    description="Get all companies an employee belongs to with their membership details.",
)
async def get_employee_companies(employee_id: str):
    """Get all companies for an employee."""
    try:
        return await membership_service.get_employee_companies(employee_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get(
    "/employee/{employee_id}/company/{company_id}",
    response_model=MembershipWithCompany,
    summary="Get specific membership",
    description="Get membership details for a specific employee-company pair.",
)
async def get_membership(employee_id: str, company_id: str):
    """Get specific membership."""
    membership = await membership_service.get_membership(employee_id, company_id)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membership not found",
        )
    return membership


@router.post(
    "/switch",
    response_model=SwitchCompanyResponse,
    summary="Switch active company",
    description="Switch the employee's active company context.",
)
async def switch_company(
    request: SwitchCompanyRequest,
    x_employee_id: str = Header(..., alias="X-Employee-ID"),
):
    """Switch to a different company."""
    try:
        return await membership_service.switch_company(
            employee_id=x_employee_id,
            company_id=request.company_id,
            set_as_primary=request.set_as_primary,
        )
    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )
    except ForbiddenException as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=e.message,
        )


@router.post(
    "/join",
    response_model=MembershipWithCompany,
    summary="Join a company",
    description="Request to join a company by its slug. Creates a pending membership.",
)
async def join_company(
    request: AddCompanyRequest,
    x_employee_id: str = Header(..., alias="X-Employee-ID"),
):
    """Request to join a company."""
    try:
        return await membership_service.join_company_by_slug(
            employee_id=x_employee_id,
            company_slug=request.company_slug,
            wallet_address=request.wallet_address,
        )
    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )
    except ConflictException as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message,
        )


@router.delete(
    "/leave/{company_id}",
    summary="Leave a company",
    description="Remove membership from a company.",
)
async def leave_company(
    company_id: str,
    x_employee_id: str = Header(..., alias="X-Employee-ID"),
):
    """Leave a company."""
    try:
        success = await membership_service.leave_company(
            employee_id=x_employee_id,
            company_id=company_id,
        )
        return {"success": success, "message": "Successfully left company"}
    except ForbiddenException as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=e.message,
        )


@router.put(
    "/set-primary/{company_id}",
    summary="Set primary company",
    description="Set a company as the employee's primary/default company.",
)
async def set_primary_company(
    company_id: str,
    x_employee_id: str = Header(..., alias="X-Employee-ID"),
):
    """Set primary company."""
    success = await membership_service.set_primary_company(
        employee_id=x_employee_id,
        company_id=company_id,
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membership not found",
        )
    return {"success": True, "message": "Primary company updated"}


@router.patch(
    "/{membership_id}",
    response_model=MembershipResponse,
    summary="Update membership",
    description="Update membership details like wallet address, department, etc.",
)
async def update_membership(
    membership_id: str,
    data: MembershipUpdate,
):
    """Update membership details."""
    try:
        return await membership_service.update(membership_id, data)
    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )


# Admin endpoints for managing company members

@router.post(
    "/admin/create",
    response_model=MembershipResponse,
    summary="Create membership (Admin)",
    description="Admin endpoint to create a new membership for an employee.",
)
async def admin_create_membership(data: MembershipCreate):
    """Admin: Create membership."""
    try:
        return await membership_service.create(data)
    except ConflictException as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message,
        )


@router.get(
    "/company/{company_id}/members",
    summary="List company members",
    description="List all members of a company with pagination.",
)
async def list_company_members(
    company_id: str,
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
):
    """List all members of a company."""
    memberships, total = await membership_service.list_company_members(
        company_id=company_id,
        page=page,
        limit=limit,
        status=status,
    )
    return {
        "memberships": memberships,
        "total": total,
        "page": page,
        "limit": limit,
    }
