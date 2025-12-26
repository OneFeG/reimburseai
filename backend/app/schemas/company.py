"""
Company Schemas
===============
Request/Response models for company operations.
"""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, EmailStr, Field


class CompanyStatus(str, Enum):
    """Company verification status."""

    PENDING = "pending"
    VERIFIED = "verified"
    SUSPENDED = "suspended"
    REJECTED = "rejected"


class CompanyBase(BaseModel):
    """Base company fields."""

    name: str = Field(..., min_length=2, max_length=255, description="Company name")
    email: EmailStr = Field(..., description="Company admin email")


class CompanyCreate(CompanyBase):
    """Schema for creating a new company."""

    slug: str = Field(
        ...,
        min_length=3,
        max_length=100,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
        description="URL-friendly company identifier",
        examples=["acme-corp", "my-company"],
    )


class CompanyUpdate(BaseModel):
    """Schema for updating company details."""

    name: str | None = Field(None, min_length=2, max_length=255)
    email: EmailStr | None = None
    settings: dict[str, Any] | None = None


class CompanyResponse(CompanyBase):
    """Schema for company response."""

    id: str
    slug: str
    status: CompanyStatus
    vault_address: str | None = None
    vault_admin_address: str | None = None
    vault_deployed_at: datetime | None = None
    vault_chain_id: int | None = None
    settings: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VaultLinkRequest(BaseModel):
    """
    Schema for linking a vault address to a company.
    Called by Dev 1 (Web3 Lead) after deploying a vault.
    """

    company_id: str = Field(..., description="Company UUID")
    vault_address: str = Field(
        ...,
        pattern=r"^0x[a-fA-F0-9]{40}$",
        description="Deployed vault contract address",
        examples=["0x1234567890123456789012345678901234567890"],
    )
    chain_id: int = Field(
        default=43113,
        description="Chain ID where vault is deployed",
        examples=[43113],  # Avalanche Fuji
    )
    tx_hash: str | None = Field(
        None,
        pattern=r"^0x[a-fA-F0-9]{64}$",
        description="Deployment transaction hash",
    )


class VaultLinkResponse(BaseModel):
    """Response after linking a vault."""

    success: bool = True
    message: str = "Vault linked successfully"
    company_id: str
    vault_address: str
    chain_id: int


class CompanyStats(BaseModel):
    """Company statistics for dashboard."""

    total_employees: int
    active_employees: int
    total_receipts: int
    pending_receipts: int
    approved_receipts: int
    rejected_receipts: int
    total_spend_month: float
    total_spend_all_time: float
