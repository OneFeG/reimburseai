"""
Policy Schemas
==============
Request/Response models for expense policy management.
"""

from datetime import datetime

from pydantic import BaseModel, Field


class PolicyBase(BaseModel):
    """Base policy fields."""

    name: str = Field(
        default="Default Policy",
        max_length=100,
        description="Policy name",
    )
    amount_cap_usd: float = Field(
        default=1000.0,
        gt=0,
        description="Maximum single expense amount",
    )
    monthly_cap_usd: float | None = Field(
        None,
        gt=0,
        description="Maximum monthly spend per employee",
    )
    allowed_categories: list[str] = Field(
        default=["travel", "meals", "software", "equipment", "office", "other"],
        description="Allowed expense categories",
    )
    vendor_whitelist: list[str] = Field(
        default=[],
        description="Approved vendors (empty = all allowed)",
    )
    vendor_blacklist: list[str] = Field(
        default=[],
        description="Blocked vendors",
    )
    max_days_old: int = Field(
        default=30,
        ge=1,
        le=365,
        description="Maximum age of receipts in days",
    )
    custom_rules: str | None = Field(
        None,
        max_length=2000,
        description="Custom rules in natural language for AI",
    )
    require_description: bool = Field(
        default=False,
        description="Require expense description",
    )
    require_category: bool = Field(
        default=True,
        description="Require expense category",
    )
    auto_approve_under: float = Field(
        default=50.0,
        ge=0,
        description="Auto-approve expenses under this amount",
    )


class PolicyCreate(PolicyBase):
    """Schema for creating a new policy."""

    company_id: str = Field(..., description="Company UUID")


class PolicyUpdate(BaseModel):
    """Schema for updating policy details."""

    name: str | None = Field(None, max_length=100)
    amount_cap_usd: float | None = Field(None, gt=0)
    monthly_cap_usd: float | None = Field(None, gt=0)
    allowed_categories: list[str] | None = None
    vendor_whitelist: list[str] | None = None
    vendor_blacklist: list[str] | None = None
    max_days_old: int | None = Field(None, ge=1, le=365)
    custom_rules: str | None = Field(None, max_length=2000)
    require_description: bool | None = None
    require_category: bool | None = None
    auto_approve_under: float | None = Field(None, ge=0)
    is_active: bool | None = None


class PolicyResponse(PolicyBase):
    """Schema for policy response."""

    id: str
    company_id: str
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PolicyListResponse(BaseModel):
    """Response for listing policies."""

    policies: list[PolicyResponse]
    total: int
