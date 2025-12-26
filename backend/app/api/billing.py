"""
Billing API endpoints for usage tracking and invoicing.
"""

import logging
from datetime import datetime
from typing import Any, Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.services.billing import billing_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/billing", tags=["billing"])


class UsageSummaryResponse(BaseModel):
    """Usage summary response."""

    company_id: str
    period: str
    start_date: str
    end_date: str
    audit: dict[str, Any]
    payout: dict[str, Any]
    advance: dict[str, Any]
    total_fees_usd: float


class UsageRecordResponse(BaseModel):
    """Usage record response."""

    id: str
    company_id: str
    usage_type: str
    quantity: int
    unit_price_usd: float | None
    total_usd: float
    metadata: dict[str, Any]
    created_at: str


class InvoiceResponse(BaseModel):
    """Invoice response."""

    id: str
    company_id: str
    period_start: str
    period_end: str
    status: str
    line_items: list[dict[str, Any]]
    subtotal_usd: float
    created_at: str


@router.get("/usage/{company_id}", response_model=UsageSummaryResponse)
async def get_usage_summary(
    company_id: str,
    period: Literal["daily", "weekly", "monthly"] = Query("monthly"),
):
    """
    Get usage summary for a company.

    Returns aggregated usage data for audits, payouts, and advances
    within the specified billing period.
    """
    try:
        summary = await billing_service.get_company_usage(
            company_id=company_id,
            period=period,
        )
        return summary
    except Exception as e:
        logger.error(f"Failed to get usage summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/usage/{company_id}/records", response_model=list[UsageRecordResponse])
async def get_usage_records(
    company_id: str,
    usage_type: Literal["audit", "payout", "advance"] | None = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """
    Get detailed usage records for a company.

    Supports filtering by usage type and pagination.
    """
    records = await billing_service.get_usage_records(
        company_id=company_id,
        usage_type=usage_type,
        limit=limit,
        offset=offset,
    )
    return records


@router.post("/invoice/{company_id}", response_model=InvoiceResponse)
async def generate_invoice(
    company_id: str,
    period_start: datetime = Query(..., description="Start of billing period"),
    period_end: datetime = Query(..., description="End of billing period"),
):
    """
    Generate an invoice for a billing period.

    Creates a draft invoice with line items for all usage
    within the specified period.
    """
    try:
        invoice = await billing_service.generate_invoice(
            company_id=company_id,
            period_start=period_start,
            period_end=period_end,
        )
        return invoice
    except Exception as e:
        logger.error(f"Failed to generate invoice: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pricing")
async def get_pricing():
    """
    Get current platform pricing.

    Returns the fee structure for all billable operations.
    """
    return {
        "audit_fee_usd": float(billing_service.AUDIT_FEE_USD),
        "advance_fee_bps": billing_service.ADVANCE_FEE_BPS,
        "advance_fee_percent": billing_service.ADVANCE_FEE_BPS / 100,
        "platform_fee_bps": billing_service.PLATFORM_FEE_BPS,
        "platform_fee_percent": billing_service.PLATFORM_FEE_BPS / 100,
        "currency": "USD",
    }
