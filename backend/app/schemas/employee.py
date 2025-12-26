"""
Employee Schemas
================
Request/Response models for employee operations.
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field


class EmployeeStatus(str, Enum):
    """Employee status within a company."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"


class EmployeeBase(BaseModel):
    """Base employee fields."""

    email: EmailStr = Field(..., description="Employee email")
    name: str = Field(..., min_length=2, max_length=255, description="Full name")
    department: str | None = Field(None, max_length=100, description="Department")
    employee_number: str | None = Field(None, max_length=50, description="Internal employee ID")


class EmployeeCreate(EmployeeBase):
    """Schema for creating a new employee."""

    company_id: str = Field(..., description="Company UUID the employee belongs to")
    wallet_address: str | None = Field(
        None,
        pattern=r"^0x[a-fA-F0-9]{40}$",
        description="Wallet address for receiving payouts",
    )
    password: str | None = Field(
        None,
        min_length=8,
        description="Password (if using email/password auth)",
    )


class EmployeeUpdate(BaseModel):
    """Schema for updating employee details."""

    name: str | None = Field(None, min_length=2, max_length=255)
    department: str | None = Field(None, max_length=100)
    employee_number: str | None = Field(None, max_length=50)
    wallet_address: str | None = Field(
        None,
        pattern=r"^0x[a-fA-F0-9]{40}$",
    )
    status: EmployeeStatus | None = None


class EmployeeResponse(EmployeeBase):
    """Schema for employee response."""

    id: str
    company_id: str
    status: EmployeeStatus
    wallet_address: str | None = None
    wallet_verified_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EmployeeWithStats(EmployeeResponse):
    """Employee with expense statistics."""

    total_receipts: int = 0
    pending_receipts: int = 0
    total_reimbursed: float = 0.0
    month_spend: float = 0.0


class EmployeeListResponse(BaseModel):
    """Response for listing employees."""

    employees: list[EmployeeResponse]
    total: int
    page: int
    limit: int
