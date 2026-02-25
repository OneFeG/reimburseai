"""
Test Audit endpoint - bypasses x402 for internal testing.
Add this to your API for development/testing only.
"""

import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.audit import AuditError, audit_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/test", tags=["test"])


class TestAuditRequest(BaseModel):
    """Request body for test audit endpoint."""
    image_base64: str = Field(..., description="Base64-encoded receipt image")
    image_content_type: str = Field("image/jpeg", description="MIME type of the image")
    company_id: str | None = Field(None, description="Company ID for policy lookup")


class TestAuditResponse(BaseModel):
    """Response from test audit endpoint."""
    success: bool
    is_valid: bool
    decision_reason: str
    extracted_data: dict[str, Any] | None = None
    amount_usd: float | None = None
    confidence: float | None = None


@router.post("/audit", response_model=TestAuditResponse)
async def test_audit(body: TestAuditRequest):
    """
    Test audit endpoint - NO x402 payment required.
    
    ⚠️ FOR TESTING ONLY - DO NOT USE IN PRODUCTION
    
    This endpoint directly calls the AI auditor without payment gating.
    """
    try:
        # Get company policy if provided
        policy = None
        if body.company_id:
            from app.services.policy import policy_service
            try:
                policy_data = await policy_service.get_policy_by_company(body.company_id)
                if policy_data:
                    policy = {
                        "amount_cap_usd": policy_data.get("amount_limit", 100),
                        "allowed_categories": policy_data.get("allowed_categories", []),
                        "max_days_old": policy_data.get("receipt_age_limit_days", 365),
                    }
            except Exception as e:
                logger.warning(f"Failed to fetch policy: {e}")

        # Run AI audit
        audit_result = await audit_service.analyze_receipt(
            image_data=body.image_base64,
            image_content_type=body.image_content_type,
            policy=policy,
        )

        validation = audit_result.get("validation", {})
        extracted = audit_result.get("extracted", {})

        return TestAuditResponse(
            success=True,
            is_valid=validation.get("is_valid", False),
            decision_reason=validation.get("decision_reason", "Unknown"),
            extracted_data=extracted,
            amount_usd=extracted.get("amount_usd"),
            confidence=audit_result.get("confidence"),
        )

    except AuditError as e:
        logger.error(f"Test audit failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
