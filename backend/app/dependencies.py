"""
FastAPI Application Dependencies
================================
Dependency injection for routes.
"""

from typing import Annotated

from fastapi import Depends, Header, HTTPException

from app.core.exceptions import UnauthorizedException
from app.core.security import decode_access_token
from app.services.company import CompanyService
from app.services.employee import EmployeeService


async def get_company_id_header(
    x_company_id: str = Header(..., alias="X-Company-ID"),
) -> str:
    """Extract company ID from header."""
    return x_company_id


async def get_employee_id_header(
    x_employee_id: str = Header(..., alias="X-Employee-ID"),
) -> str:
    """Extract employee ID from header."""
    return x_employee_id


async def get_api_key_header(
    x_api_key: str = Header(..., alias="X-API-Key"),
) -> str:
    """Extract API key from header."""
    return x_api_key


async def verify_api_key(
    api_key: Annotated[str, Depends(get_api_key_header)],
) -> dict:
    """
    Verify API key and extract payload.
    Returns the decoded token data if valid.
    """
    payload = decode_access_token(api_key)
    if not payload:
        raise UnauthorizedException(
            message="Invalid API key",
            error_code="INVALID_API_KEY",
        )
    return payload


async def get_current_company(
    company_id: Annotated[str, Depends(get_company_id_header)],
) -> dict:
    """
    Get the current company from header.
    Validates that the company exists.
    """
    try:
        service = CompanyService()
        company = await service.get_by_id(company_id)
        return company.model_dump()
    except Exception:
        raise HTTPException(
            status_code=404,
            detail={
                "error": {
                    "code": "COMPANY_NOT_FOUND",
                    "message": "Company not found",
                }
            },
        )


async def get_current_employee(
    employee_id: Annotated[str, Depends(get_employee_id_header)],
) -> dict:
    """
    Get the current employee from header.
    Validates that the employee exists.
    """
    try:
        service = EmployeeService()
        employee = await service.get_by_id(employee_id)
        return employee.model_dump()
    except Exception:
        raise HTTPException(
            status_code=404,
            detail={
                "error": {
                    "code": "EMPLOYEE_NOT_FOUND",
                    "message": "Employee not found",
                }
            },
        )


# Type aliases for cleaner dependency injection
CompanyId = Annotated[str, Depends(get_company_id_header)]
EmployeeId = Annotated[str, Depends(get_employee_id_header)]
ApiKey = Annotated[str, Depends(get_api_key_header)]
CurrentCompany = Annotated[dict, Depends(get_current_company)]
CurrentEmployee = Annotated[dict, Depends(get_current_employee)]
