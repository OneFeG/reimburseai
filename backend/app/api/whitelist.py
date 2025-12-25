"""
Wallet Whitelist API endpoints.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Any
import logging

from app.services.whitelist import whitelist_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/whitelist", tags=["whitelist"])


class WalletAddRequest(BaseModel):
    """Request body for adding a wallet to whitelist."""
    wallet_address: str = Field(..., description="Wallet address to whitelist")
    company_id: str | None = Field(None, description="Company ID (None for global)")
    employee_id: str | None = Field(None, description="Employee ID if applicable")
    label: str | None = Field(None, description="Human-readable label")


class WalletRemoveRequest(BaseModel):
    """Request body for removing a wallet from whitelist."""
    wallet_address: str = Field(..., description="Wallet address to remove")
    company_id: str | None = Field(None, description="Company ID (None for global)")


class WhitelistEntryResponse(BaseModel):
    """Whitelist entry response."""
    id: str
    wallet_address: str
    company_id: str | None
    employee_id: str | None
    label: str | None
    is_active: bool
    created_at: str
    updated_at: str | None = None


class WalletCheckResponse(BaseModel):
    """Response for wallet whitelist check."""
    wallet_address: str
    is_whitelisted: bool
    company_id: str | None = None


@router.get("/check")
async def check_wallet_whitelisted(
    wallet_address: str = Query(..., description="Wallet address to check"),
    company_id: str | None = Query(None, description="Company ID"),
) -> WalletCheckResponse:
    """
    Check if a wallet address is whitelisted.
    
    Can check against global whitelist or company-specific whitelist.
    """
    is_whitelisted = await whitelist_service.is_wallet_whitelisted(
        wallet_address=wallet_address,
        company_id=company_id,
    )
    
    return WalletCheckResponse(
        wallet_address=wallet_address.lower(),
        is_whitelisted=is_whitelisted,
        company_id=company_id,
    )


@router.post("", response_model=WhitelistEntryResponse)
async def add_wallet_to_whitelist(body: WalletAddRequest):
    """
    Add a wallet to the whitelist.
    
    If company_id is None, the wallet is added to the global whitelist.
    """
    try:
        entry = await whitelist_service.add_wallet(
            wallet_address=body.wallet_address,
            company_id=body.company_id,
            employee_id=body.employee_id,
            label=body.label,
        )
        return entry
    except Exception as e:
        logger.error(f"Failed to add wallet to whitelist: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("")
async def remove_wallet_from_whitelist(body: WalletRemoveRequest):
    """
    Remove a wallet from the whitelist.
    
    This is a soft delete - the record is kept but marked as inactive.
    """
    try:
        removed = await whitelist_service.remove_wallet(
            wallet_address=body.wallet_address,
            company_id=body.company_id,
        )
        
        if removed:
            return {"success": True, "message": "Wallet removed from whitelist"}
        else:
            raise HTTPException(status_code=404, detail="Wallet not found in whitelist")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to remove wallet from whitelist: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/company/{company_id}", response_model=list[WhitelistEntryResponse])
async def get_company_whitelist(
    company_id: str,
    include_global: bool = Query(True, description="Include global whitelist entries"),
):
    """
    Get whitelisted wallets for a company.
    
    Optionally includes global whitelist entries.
    """
    entries = await whitelist_service.get_company_whitelist(
        company_id=company_id,
        include_global=include_global,
    )
    return entries


@router.get("/employee/{employee_id}")
async def get_employee_wallet(employee_id: str):
    """Get the whitelisted wallet for an employee."""
    wallet = await whitelist_service.get_employee_wallet(employee_id)
    
    if not wallet:
        raise HTTPException(
            status_code=404,
            detail="No whitelisted wallet found for employee"
        )
    
    return wallet


@router.get("/global", response_model=list[WhitelistEntryResponse])
async def get_global_whitelist():
    """
    Get global whitelist entries (admin operation).
    
    These wallets are whitelisted for all companies.
    """
    entries = await whitelist_service.get_global_whitelist()
    return entries
