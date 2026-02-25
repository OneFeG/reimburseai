"""
Policy Endpoints
================
Expense policy management.
"""

from fastapi import APIRouter, HTTPException

from app.core.exceptions import AppException
from app.schemas.policy import (
    PolicyCreate,
    PolicyResponse,
    PolicyUpdate,
)
from app.services.policy import PolicyService

router = APIRouter()


@router.post(
    "",
    response_model=PolicyResponse,
    status_code=201,
    summary="Create a new policy",
)
async def create_policy(data: PolicyCreate):
    """
    Create a new expense policy for a company.

    The new policy will automatically become active,
    and any existing active policy will be deactivated.
    """
    try:
        service = PolicyService()
        return await service.create(data)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.get(
    "/{policy_id}",
    response_model=PolicyResponse,
    summary="Get policy by ID",
)
async def get_policy(policy_id: str):
    """Get policy details by UUID."""
    try:
        service = PolicyService()
        return await service.get_by_id(policy_id)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.get(
    "/company/{company_id}/active",
    response_model=PolicyResponse,
    summary="Get active policy",
    description="Get the currently active policy for a company.",
)
async def get_active_policy(company_id: str):
    """
    Get the active expense policy for a company.
    This is the policy that the Auditor Agent uses for validation.
    """
    try:
        service = PolicyService()
        return await service.get_active_for_company(company_id)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.patch(
    "/{policy_id}",
    response_model=PolicyResponse,
    summary="Update policy",
)
async def update_policy(policy_id: str, data: PolicyUpdate):
    """
    Update policy details.

    If `is_active` is set to true, this policy will become active
    and any other active policy for the company will be deactivated.
    """
    try:
        service = PolicyService()
        return await service.update(policy_id, data)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.get(
    "/company/{company_id}",
    summary="List policies by company",
)
async def list_by_company(company_id: str):
    """List all policies for a company (including inactive)."""
    try:
        service = PolicyService()
        policies = await service.list_by_company(company_id)
        return {
            "success": True,
            "data": policies,
            "total": len(policies),
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.delete(
    "/{policy_id}",
    summary="Delete policy",
)
async def delete_policy(policy_id: str):
    """Delete a policy."""
    try:
        service = PolicyService()
        success = await service.delete(policy_id)
        return {"success": success, "message": "Policy deleted"}
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
