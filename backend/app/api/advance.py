"""
Advance API endpoints for employee expense advances.
"""

import logging
from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.services.advance import advance_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/advance", tags=["advance"])


class AdvanceConfigUpdate(BaseModel):
    """Request body for updating advance configuration."""

    credit_limit_usd: float | None = Field(None, gt=0, description="Credit limit in USD")
    fee_bps: int | None = Field(None, ge=0, le=10000, description="Fee in basis points (1% = 100)")
    enabled: bool | None = Field(None, description="Whether advances are enabled")


class AdvanceConfigResponse(BaseModel):
    """Advance configuration response."""

    company_id: str
    credit_limit_usd: float
    utilization_usd: float
    fee_bps: int
    enabled: bool
    available_credit_usd: float | None = None


class AdvanceRequest(BaseModel):
    """Request body for requesting an advance."""

    company_id: str = Field(..., description="Company ID")
    employee_id: str = Field(..., description="Employee ID")
    amount_usd: float = Field(..., gt=0, description="Requested amount in USD")
    reason: str | None = Field(None, description="Reason for the advance")


class AdvanceDecisionResponse(BaseModel):
    """Response for advance request decision."""

    approved: bool
    reason: str | None = None
    advance_id: str | None = None
    amount_usd: float | None = None
    fee_usd: float | None = None
    total_usd: float | None = None
    available_credit_usd: float | None = None


class AdvanceResponse(BaseModel):
    """Advance record response."""

    id: str
    company_id: str
    employee_id: str
    amount_usd: float
    fee_usd: float
    reason: str | None
    status: str
    created_at: str
    updated_at: str | None = None
    settled_at: str | None = None


@router.get("/config/{company_id}", response_model=AdvanceConfigResponse)
async def get_advance_config(company_id: str):
    """
    Get advance configuration for a company.

    Returns credit limit, current utilization, fee structure, and enabled status.
    """
    config = await advance_service.get_company_advance_config(company_id)

    # Calculate available credit
    credit_limit = config.get("credit_limit_usd", 0)
    utilization = config.get("utilization_usd", 0)
    available = credit_limit - utilization

    return AdvanceConfigResponse(
        company_id=company_id,
        credit_limit_usd=config.get("credit_limit_usd", advance_service.DEFAULT_CREDIT_LIMIT_USD),
        utilization_usd=config.get("utilization_usd", 0),
        fee_bps=config.get("fee_bps", advance_service.DEFAULT_FEE_BPS),
        enabled=config.get("enabled", True),
        available_credit_usd=available,
    )


@router.post("/config/{company_id}", response_model=AdvanceConfigResponse)
async def update_advance_config(company_id: str, body: AdvanceConfigUpdate):
    """
    Update advance configuration for a company.

    Allows setting credit limit, fee structure, and enabling/disabling advances.
    """
    try:
        config = await advance_service.update_company_advance_config(
            company_id=company_id,
            credit_limit_usd=body.credit_limit_usd,
            fee_bps=body.fee_bps,
            enabled=body.enabled,
        )

        # Calculate available credit
        credit_limit = config.get("credit_limit_usd", 0)
        utilization = config.get("utilization_usd", 0)
        available = credit_limit - utilization

        return AdvanceConfigResponse(
            company_id=company_id,
            credit_limit_usd=config["credit_limit_usd"],
            utilization_usd=config.get("utilization_usd", 0),
            fee_bps=config["fee_bps"],
            enabled=config["enabled"],
            available_credit_usd=available,
        )
    except Exception as e:
        logger.error(f"Failed to update advance config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/request", response_model=AdvanceDecisionResponse)
async def request_advance(body: AdvanceRequest):
    """
    Request an advance for an employee.

    Returns the decision (approved/rejected) along with fee calculation
    if approved. Advances are subject to the company's credit limit and
    fee structure.
    """
    try:
        result = await advance_service.request_advance(
            company_id=body.company_id,
            employee_id=body.employee_id,
            amount_usd=Decimal(str(body.amount_usd)),
            reason=body.reason,
        )

        if result["approved"]:
            return AdvanceDecisionResponse(
                approved=True,
                advance_id=result.get("advance_id"),
                amount_usd=result.get("amount_usd"),
                fee_usd=result.get("fee_usd"),
                total_usd=result.get("total_usd"),
            )
        else:
            return AdvanceDecisionResponse(
                approved=False,
                reason=result.get("reason"),
                available_credit_usd=result.get("available_credit_usd"),
            )
    except Exception as e:
        logger.error(f"Failed to process advance request: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{advance_id}", response_model=AdvanceResponse)
async def get_advance(advance_id: str):
    """Get an advance by ID."""
    advance = await advance_service.get_advance(advance_id)
    if not advance:
        raise HTTPException(status_code=404, detail="Advance not found")
    return advance


@router.put("/{advance_id}/status")
async def update_advance_status(
    advance_id: str,
    status: Literal["pending", "approved", "rejected", "disbursed", "settled"] = Query(...),
):
    """
    Update the status of an advance.

    When marked as 'settled', the credit utilization is reduced.
    """
    try:
        advance = await advance_service.update_advance_status(advance_id, status)
        return advance
    except Exception as e:
        logger.error(f"Failed to update advance status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/employee/{employee_id}", response_model=list[AdvanceResponse])
async def get_employee_advances(
    employee_id: str,
    status: Literal["pending", "approved", "rejected", "disbursed", "settled"] | None = None,
    limit: int = Query(100, ge=1, le=500),
):
    """Get advances for an employee."""
    advances = await advance_service.get_employee_advances(
        employee_id=employee_id,
        status=status,
        limit=limit,
    )
    return advances


@router.get("/company/{company_id}", response_model=list[AdvanceResponse])
async def get_company_advances(
    company_id: str,
    status: Literal["pending", "approved", "rejected", "disbursed", "settled"] | None = None,
    limit: int = Query(100, ge=1, le=500),
):
    """Get advances for a company."""
    advances = await advance_service.get_company_advances(
        company_id=company_id,
        status=status,
        limit=limit,
    )
    return advances
