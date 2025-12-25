"""
Audit API endpoint for Agent A (Auditor).

Handles receipt audit requests with x402 payment gating.
"""

from fastapi import APIRouter, HTTPException, Header, Request, Response
from pydantic import BaseModel, Field
from typing import Any
import json
import logging

from app.services.x402 import x402_service, X402PaymentError
from app.services.audit import audit_service, AuditError
from app.services.policy import policy_service
from app.services.receipt import receipt_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/audit", tags=["audit"])


class AuditRequest(BaseModel):
    """Request body for audit endpoint."""
    receipt_id: str | None = Field(None, description="Receipt ID to audit (if already uploaded)")
    image_base64: str | None = Field(None, description="Base64-encoded receipt image")
    image_content_type: str = Field("image/jpeg", description="MIME type of the image")
    company_id: str | None = Field(None, description="Company ID for policy lookup")
    employee_id: str | None = Field(None, description="Employee ID")
    employee_wallet: str | None = Field(None, description="Employee wallet address")


class AuditResponse(BaseModel):
    """Response from audit endpoint."""
    receipt_id: str | None = None
    reimbursement_valid: bool
    decision_reason: str
    extracted_data: dict[str, Any] | None = None
    amount_usd: float | None = None
    policy_violations: list[str] = []
    confidence: float | None = None


@router.post(
    "",
    response_model=AuditResponse,
    responses={
        402: {
            "description": "Payment required",
            "content": {
                "application/json": {
                    "example": {
                        "error": "payment_required",
                        "x402_version": 1,
                        "payment_requirements": {}
                    }
                }
            }
        }
    }
)
async def audit_receipt(
    request: Request,
    body: AuditRequest,
    x_payment: str | None = Header(None, alias="X-PAYMENT"),
):
    """
    Audit a receipt for expense reimbursement eligibility.
    
    This endpoint is gated by x402 protocol - requires micropayment to process.
    Uses GPT-4o vision to analyze the receipt image and validate against company policy.
    
    Flow:
    1. Verify x402 payment
    2. Get receipt image (from storage or base64 input)
    3. Get company policy
    4. Run AI audit
    5. Settle payment on success
    6. Return audit result
    """
    # Step 1: Verify x402 payment
    try:
        payment_result = await x402_service.verify_payment(x_payment)
        logger.info(f"Payment verified from {payment_result.get('payer')}")
    except X402PaymentError as e:
        # Return 402 with payment requirements
        payment_requirements = x402_service.generate_payment_requirements(
            resource=str(request.url),
            description="AI-powered receipt audit service",
        )
        return Response(
            status_code=402,
            content=json.dumps({
                "error": "payment_required",
                "message": str(e),
                "x402_version": 1,
                "payment_requirements": payment_requirements,
            }),
            media_type="application/json",
            headers={
                "X-PAYMENT-REQUIRED": json.dumps(payment_requirements),
            }
        )
    
    # Step 2: Get receipt image
    image_data = None
    image_content_type = body.image_content_type
    
    if body.receipt_id:
        # Fetch from storage
        try:
            receipt = await receipt_service.get_receipt(body.receipt_id)
            if not receipt:
                raise HTTPException(status_code=404, detail="Receipt not found")
            
            # Get image from storage
            from app.services.storage import storage_service
            image_data = await storage_service.download_file(receipt["file_path"])
            image_content_type = receipt.get("content_type", "image/jpeg")
        except Exception as e:
            logger.error(f"Failed to fetch receipt: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch receipt")
    elif body.image_base64:
        image_data = body.image_base64
    else:
        raise HTTPException(
            status_code=400,
            detail="Either receipt_id or image_base64 is required"
        )
    
    # Step 3: Get company policy
    policy = None
    if body.company_id:
        try:
            policy_data = await policy_service.get_policy_by_company(body.company_id)
            if policy_data:
                policy = {
                    "amount_cap_usd": policy_data.get("amount_limit"),
                    "allowed_categories": policy_data.get("allowed_categories", []),
                    "vendor_whitelist": policy_data.get("vendor_whitelist", []),
                    "max_days_old": policy_data.get("receipt_age_limit_days", 365),
                }
        except Exception as e:
            logger.warning(f"Failed to fetch policy: {e}, using defaults")
    
    # Step 4: Run AI audit
    try:
        audit_result = await audit_service.analyze_receipt(
            image_data=image_data,
            image_content_type=image_content_type,
            policy=policy,
        )
    except AuditError as e:
        logger.error(f"Audit failed: {e}")
        raise HTTPException(status_code=500, detail=f"Audit failed: {str(e)}")
    
    # Step 5: Settle payment on success
    try:
        await x402_service.settle_payment(x_payment)
        logger.info("Payment settled successfully")
    except X402PaymentError as e:
        logger.error(f"Payment settlement failed: {e}")
        # Continue anyway - audit was successful
    
    # Step 6: Update receipt status if we have a receipt_id
    if body.receipt_id:
        try:
            validation = audit_result.get("validation", {})
            await receipt_service.update_receipt_status(
                receipt_id=body.receipt_id,
                status="approved" if validation.get("is_valid") else "rejected",
                audit_result={
                    "extracted": audit_result.get("extracted"),
                    "validation": validation,
                    "confidence": audit_result.get("confidence"),
                    "audited_at": audit_result.get("audited_at"),
                }
            )
        except Exception as e:
            logger.warning(f"Failed to update receipt status: {e}")
    
    # Build response
    validation = audit_result.get("validation", {})
    extracted = audit_result.get("extracted", {})
    
    return AuditResponse(
        receipt_id=body.receipt_id,
        reimbursement_valid=validation.get("is_valid", False),
        decision_reason=validation.get("decision_reason", "Unknown"),
        extracted_data=extracted,
        amount_usd=extracted.get("amount_usd"),
        policy_violations=validation.get("policy_violations", []),
        confidence=audit_result.get("confidence"),
    )


@router.get("/price")
async def get_audit_price():
    """Get the current price for an audit request."""
    return {
        "price_wei": x402_service.PRICE_PER_AUDIT_WEI,
        "price_usd": x402_service.PRICE_PER_AUDIT_WEI / 1_000_000,  # USDC has 6 decimals
        "currency": "USDC",
        "chain_id": x402_service.CHAIN_ID,
        "token_address": x402_service.USDC_TOKEN_ADDRESS,
    }
