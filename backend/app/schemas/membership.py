"""
Multi-Company Membership Schemas
================================
Request/Response models for employee company memberships.
"""

from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class MembershipRole(str, Enum):
    """Employee role within a company."""
    ADMIN = "admin"
    MANAGER = "manager"
    EMPLOYEE = "employee"


class MembershipStatus(str, Enum):
    """Membership status."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"


class MembershipBase(BaseModel):
    """Base membership fields."""
    role: MembershipRole = Field(default=MembershipRole.EMPLOYEE, description="Role in this company")
    status: MembershipStatus = Field(default=MembershipStatus.PENDING, description="Membership status")
    wallet_address: str | None = Field(
        None,
        pattern=r"^0x[a-fA-F0-9]{40}$",
        description="Wallet address for payouts from this company",
    )
    department: str | None = Field(None, max_length=100, description="Department in this company")
    employee_number: str | None = Field(None, max_length=50, description="Employee ID in this company")
    is_primary: bool = Field(default=False, description="Is this the primary company")


class MembershipCreate(MembershipBase):
    """Schema for creating a new membership."""
    employee_id: str = Field(..., description="Employee UUID")
    company_id: str = Field(..., description="Company UUID")


class MembershipUpdate(BaseModel):
    """Schema for updating membership details."""
    role: MembershipRole | None = None
    status: MembershipStatus | None = None
    wallet_address: str | None = Field(
        None,
        pattern=r"^0x[a-fA-F0-9]{40}$",
    )
    department: str | None = None
    employee_number: str | None = None
    is_primary: bool | None = None
    notifications_enabled: bool | None = None


class MembershipResponse(MembershipBase):
    """Schema for membership response."""
    id: str
    employee_id: str
    company_id: str
    notifications_enabled: bool = True
    joined_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MembershipWithCompany(MembershipResponse):
    """Membership with company details."""
    company_name: str
    company_slug: str
    company_email: str | None = None
    vault_address: str | None = None
    vault_deployed_at: datetime | None = None


class MembershipWithEmployee(MembershipResponse):
    """Membership with employee details."""
    employee_name: str
    employee_email: str


class EmployeeCompaniesResponse(BaseModel):
    """Response listing all companies an employee belongs to."""
    memberships: list[MembershipWithCompany]
    primary_company_id: str | None = None
    total_companies: int


class SwitchCompanyRequest(BaseModel):
    """Request to switch active company."""
    company_id: str = Field(..., description="Company UUID to switch to")
    set_as_primary: bool = Field(default=False, description="Set this as primary company")


class SwitchCompanyResponse(BaseModel):
    """Response after switching company."""
    success: bool
    membership: MembershipWithCompany
    message: str


class AddCompanyRequest(BaseModel):
    """Request to add a new company for the employee."""
    company_slug: str = Field(..., description="Company slug to join")
    wallet_address: str | None = Field(
        None,
        pattern=r"^0x[a-fA-F0-9]{40}$",
        description="Wallet address for this company",
    )
    department: str | None = None


class JoinCompanyInviteResponse(BaseModel):
    """Response when joining a company via invite."""
    success: bool
    membership: MembershipResponse
    company_name: str
    requires_approval: bool
