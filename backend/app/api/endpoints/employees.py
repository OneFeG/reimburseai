"""
Employee Endpoints
==================
CRUD operations for employees.
"""

from fastapi import APIRouter, HTTPException, Query

from app.core.exceptions import AppException
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeResponse,
    EmployeeUpdate,
    EmployeeWithStats,
)
from app.services.employee import EmployeeService

router = APIRouter()


@router.post(
    "",
    response_model=EmployeeResponse,
    status_code=201,
    summary="Create a new employee",
)
async def create_employee(data: EmployeeCreate):
    """
    Create a new employee for a company.

    The employee will be in 'pending' status until approved by admin.
    Wallet address can be added later when the employee connects their wallet.
    """
    try:
        service = EmployeeService()
        return await service.create(data)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.get(
    "/{employee_id}",
    response_model=EmployeeResponse,
    summary="Get employee by ID",
)
async def get_employee(employee_id: str):
    """Get employee details by UUID."""
    try:
        service = EmployeeService()
        return await service.get_by_id(employee_id)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.get(
    "/{employee_id}/stats",
    response_model=EmployeeWithStats,
    summary="Get employee with statistics",
)
async def get_employee_with_stats(employee_id: str):
    """Get employee details with expense statistics."""
    try:
        service = EmployeeService()
        return await service.get_with_stats(employee_id)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.patch(
    "/{employee_id}",
    response_model=EmployeeResponse,
    summary="Update employee",
)
async def update_employee(employee_id: str, data: EmployeeUpdate):
    """Update employee details."""
    try:
        service = EmployeeService()
        return await service.update(employee_id, data)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.patch(
    "/{employee_id}/wallet",
    response_model=EmployeeResponse,
    summary="Update employee wallet",
    description="Update the employee's wallet address for receiving payouts.",
)
async def update_wallet(employee_id: str, wallet_address: str):
    """
    Update employee wallet address.
    Called when an employee connects their wallet.
    """
    try:
        service = EmployeeService()
        return await service.update_wallet(employee_id, wallet_address)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.get(
    "/company/{company_id}",
    summary="List employees by company",
)
async def list_by_company(
    company_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str | None = Query(None, description="Filter by status"),
):
    """List all employees for a company."""
    try:
        service = EmployeeService()
        employees, total = await service.list_by_company(company_id, page, limit, status)
        return {
            "success": True,
            "data": employees,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "total_pages": (total + limit - 1) // limit,
            },
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.delete(
    "/{employee_id}",
    summary="Deactivate employee",
    description="Soft delete - sets employee status to 'inactive'.",
)
async def deactivate_employee(employee_id: str):
    """Deactivate an employee (soft delete)."""
    try:
        service = EmployeeService()
        success = await service.delete(employee_id)
        return {"success": success, "message": "Employee deactivated"}
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
