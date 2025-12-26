"""
Treasury API endpoint for Agent B (Treasury).

Handles USDC payouts to employees after approved audits.
"""

from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel, Field
from decimal import Decimal
from typing import Any
import logging

from app.config import settings
from app.services.thirdweb import thirdweb_service, ThirdwebError
from app.services.receipt import receipt_service
from app.services.employee import employee_service
from app.db.dependencies import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/treasury", tags=["treasury"])


def verify_secret_key(x_secret_key: str | None = Header(None, alias="x-secret-key")):
    """Verify the internal secret key for treasury operations."""
    if not x_secret_key or x_secret_key != settings.treasury_secret_key:
        raise HTTPException(
            status_code=403,
            detail="Invalid or missing secret key"
        )
    return True


class PayoutRequest(BaseModel):
    """Request body for payout endpoint."""
    receipt_id: str | None = Field(None, description="Receipt ID that was approved")
    employee_id: str | None = Field(None, description="Employee ID to pay")
    employee_wallet: str = Field(..., description="Employee wallet address")
    amount_usd: float = Field(..., gt=0, description="Amount to pay in USD")
    reason: str | None = Field(None, description="Reason for payout")


class PayoutResponse(BaseModel):
    """Response from payout endpoint."""
    success: bool
    queue_id: str | None = None
    transaction_hash: str | None = None
    to_address: str
    amount_usd: float
    message: str


class BalanceResponse(BaseModel):
    """Response from balance endpoint."""
    wallet_address: str
    usdc_balance: float
    native_balance: str
    native_symbol: str


@router.post(
    "/payout",
    response_model=PayoutResponse,
    dependencies=[Depends(verify_secret_key)],
)
async def process_payout(body: PayoutRequest):
    """
    Process a USDC payout to an employee wallet.
    
    This endpoint is protected by an internal secret key and should only
    be called after a successful audit approval.
    
    Flow:
    1. Validate employee exists (if employee_id provided)
    2. Validate wallet is whitelisted
    3. Transfer USDC via Thirdweb
    4. Update receipt status
    5. Return transaction details
    """
    # Step 1: Validate employee if ID provided
    if body.employee_id:
        try:
            employee = await employee_service.get_employee(body.employee_id)
            if not employee:
                raise HTTPException(status_code=404, detail="Employee not found")
            
            # Verify wallet matches
            if employee.get("wallet_address") and employee["wallet_address"].lower() != body.employee_wallet.lower():
                raise HTTPException(
                    status_code=400,
                    detail="Wallet address does not match employee record"
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Employee lookup failed: {e}")
    
    # Step 2: Validate wallet is whitelisted
    from app.services.whitelist import whitelist_service
    is_whitelisted = await whitelist_service.is_wallet_whitelisted(body.employee_wallet)
    if not is_whitelisted:
        raise HTTPException(
            status_code=403,
            detail="Wallet address is not whitelisted for payouts"
        )
    
    # Step 3: Transfer USDC
    try:
        transfer_result = await thirdweb_service.transfer_usdc(
            to_address=body.employee_wallet,
            amount_usd=Decimal(str(body.amount_usd)),
        )
        logger.info(
            f"Payout initiated: ${body.amount_usd} to {body.employee_wallet}, "
            f"queue_id={transfer_result.get('queue_id')}"
        )
    except ThirdwebError as e:
        logger.error(f"Payout failed: {e}")
        raise HTTPException(status_code=500, detail=f"Payout failed: {str(e)}")
    
    # Step 4: Update receipt status if provided
    if body.receipt_id:
        try:
            await receipt_service.update_receipt_status(
                receipt_id=body.receipt_id,
                status="paid",
                payout_info={
                    "queue_id": transfer_result.get("queue_id"),
                    "amount_usd": body.amount_usd,
                    "to_address": body.employee_wallet,
                }
            )
        except Exception as e:
            logger.warning(f"Failed to update receipt status: {e}")
    
    return PayoutResponse(
        success=True,
        queue_id=transfer_result.get("queue_id"),
        to_address=body.employee_wallet,
        amount_usd=body.amount_usd,
        message=f"Payout of ${body.amount_usd} USDC initiated successfully",
    )


@router.get(
    "/balance",
    response_model=BalanceResponse,
    dependencies=[Depends(verify_secret_key)],
)
async def get_treasury_balance():
    """
    Get the current treasury wallet balances.
    
    Returns both USDC and native AVAX balances.
    """
    try:
        usdc_balance = await thirdweb_service.get_usdc_balance()
        native_balance = await thirdweb_service.get_native_balance()
        
        return BalanceResponse(
            wallet_address=thirdweb_service.company_wallet,
            usdc_balance=usdc_balance["balance_usd"],
            native_balance=native_balance["display_value"],
            native_symbol=native_balance["symbol"],
        )
    except ThirdwebError as e:
        logger.error(f"Balance check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Balance check failed: {str(e)}")


@router.get(
    "/transaction/{queue_id}",
    dependencies=[Depends(verify_secret_key)],
)
async def get_transaction_status(queue_id: str):
    """
    Check the status of a payout transaction.
    
    Args:
        queue_id: The queue ID from the payout response
    """
    try:
        status = await thirdweb_service.get_transaction_status(queue_id)
        return status
    except ThirdwebError as e:
        logger.error(f"Transaction status check failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Status check failed: {str(e)}"
        )
