"""
Ledger API endpoints for financial transaction tracking.
"""

import logging
from decimal import Decimal
from typing import Any, Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.services.ledger import ledger_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ledger", tags=["ledger"])


class LedgerEntryCreate(BaseModel):
    """Request body for creating a ledger entry."""

    company_id: str = Field(..., description="Company ID")
    employee_id: str | None = Field(None, description="Employee ID")
    amount_usd: float = Field(..., gt=0, description="Transaction amount in USD")
    fee_usd: float = Field(0, ge=0, description="Fee amount in USD")
    entry_type: Literal["advance", "payout", "fee", "deposit"] = Field(
        ..., description="Type of transaction"
    )
    reference_id: str | None = Field(None, description="Reference ID")
    reference_type: str | None = Field(None, description="Reference type")
    metadata: dict[str, Any] | None = Field(None, description="Additional metadata")


class LedgerEntryUpdate(BaseModel):
    """Request body for updating ledger entry status."""

    status: Literal["pending", "processing", "settled", "failed", "cancelled"]
    transaction_hash: str | None = None
    error_message: str | None = None


class LedgerEntryResponse(BaseModel):
    """Ledger entry response."""

    id: str
    company_id: str
    employee_id: str | None
    amount_usd: float
    fee_usd: float
    entry_type: str
    status: str
    reference_id: str | None
    reference_type: str | None
    transaction_hash: str | None = None
    metadata: dict[str, Any]
    created_at: str
    updated_at: str | None = None
    settled_at: str | None = None


class LedgerSummaryResponse(BaseModel):
    """Company ledger summary response."""

    total_payouts: float
    total_advances: float
    total_fees: float
    pending_amount: float
    settled_amount: float
    entry_count: int


@router.post("", response_model=LedgerEntryResponse)
async def create_ledger_entry(body: LedgerEntryCreate):
    """
    Create a new ledger entry.

    Used to track all financial transactions including advances,
    payouts, fees, and deposits.
    """
    try:
        entry = await ledger_service.create_entry(
            company_id=body.company_id,
            employee_id=body.employee_id,
            amount_usd=Decimal(str(body.amount_usd)),
            fee_usd=Decimal(str(body.fee_usd)),
            entry_type=body.entry_type,
            reference_id=body.reference_id,
            reference_type=body.reference_type,
            metadata=body.metadata,
        )
        return entry
    except Exception as e:
        logger.error(f"Failed to create ledger entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{entry_id}", response_model=LedgerEntryResponse)
async def get_ledger_entry(entry_id: str):
    """Get a ledger entry by ID."""
    entry = await ledger_service.get_entry(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Ledger entry not found")
    return entry


@router.put("/{entry_id}", response_model=LedgerEntryResponse)
async def update_ledger_entry(entry_id: str, body: LedgerEntryUpdate):
    """
    Update a ledger entry's status.

    Used to mark entries as settled, failed, or cancelled.
    """
    try:
        entry = await ledger_service.update_status(
            entry_id=entry_id,
            status=body.status,
            transaction_hash=body.transaction_hash,
            error_message=body.error_message,
        )
        return entry
    except Exception as e:
        logger.error(f"Failed to update ledger entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/company/{company_id}", response_model=list[LedgerEntryResponse])
async def get_company_ledger(
    company_id: str,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    entry_type: Literal["advance", "payout", "fee", "deposit"] | None = None,
    status: Literal["pending", "processing", "settled", "failed", "cancelled"] | None = None,
):
    """
    Get all ledger entries for a company.

    Supports filtering by entry type and status.
    """
    entries = await ledger_service.get_company_ledger(
        company_id=company_id,
        limit=limit,
        offset=offset,
        entry_type=entry_type,
        status=status,
    )
    return entries


@router.get("/company/{company_id}/summary", response_model=LedgerSummaryResponse)
async def get_company_ledger_summary(company_id: str):
    """
    Get a financial summary for a company.

    Returns aggregated totals by transaction type and status.
    """
    summary = await ledger_service.get_company_summary(company_id)
    return summary


@router.get("/employee/{employee_id}", response_model=list[LedgerEntryResponse])
async def get_employee_ledger(
    employee_id: str,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """Get all ledger entries for an employee."""
    entries = await ledger_service.get_employee_ledger(
        employee_id=employee_id,
        limit=limit,
        offset=offset,
    )
    return entries
