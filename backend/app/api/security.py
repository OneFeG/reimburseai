"""
Security API Endpoints
======================
Endpoints for security-related operations.
"""

from decimal import Decimal
from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel, Field
from typing import Optional

from app.services.security import (
    security_service,
    SecurityConfig,
    AuditSignature,
    rate_limiter,
)
from app.core.exceptions import RateLimitException


router = APIRouter(prefix="/security", tags=["Security"])


class AuditSecurityRequest(BaseModel):
    """Request for secured audit."""
    receipt_id: str
    company_id: str
    employee_id: str
    amount: str
    merchant: str
    category: str
    audit_result: str  # "approved" | "rejected"
    confidence: float = Field(ge=0, le=100)


class AuditSecurityResponse(BaseModel):
    """Response with signed audit result."""
    signature: AuditSignature
    security_metadata: dict
    flagged_for_review: bool


class PayoutSecurityRequest(BaseModel):
    """Request for secured payout verification."""
    receipt_id: str
    company_id: str
    employee_id: str
    amount: str
    recipient_wallet: str
    vault_address: str
    audit_signature: AuditSignature


class PayoutSecurityResponse(BaseModel):
    """Response from payout security check."""
    is_allowed: bool
    reason: str
    security_metadata: dict
    payout_authorization: Optional[str] = None


class VerifySignatureRequest(BaseModel):
    """Request to verify a signature."""
    signature: AuditSignature


class RateLimitStatusResponse(BaseModel):
    """Rate limit status response."""
    remaining_per_minute: int
    max_per_minute: int
    max_per_hour: int


class SecurityConfigResponse(BaseModel):
    """Security configuration (non-sensitive)."""
    high_value_threshold_usd: str
    critical_value_threshold_usd: str
    daily_payout_limit_usd: str
    max_daily_receipts_per_employee: int
    signature_expiry_seconds: int


@router.post(
    "/audit/sign",
    response_model=AuditSecurityResponse,
    summary="Create signed audit result",
    description="Creates a cryptographically signed audit result with anomaly detection.",
)
async def create_signed_audit(request: AuditSecurityRequest, req: Request):
    """Create a signed audit result."""
    try:
        ip_address = req.client.host if req.client else None
        
        signature, metadata = await security_service.secure_audit(
            receipt_id=request.receipt_id,
            company_id=request.company_id,
            employee_id=request.employee_id,
            amount=Decimal(request.amount),
            merchant=request.merchant,
            category=request.category,
            audit_result=request.audit_result,
            confidence=request.confidence,
            ip_address=ip_address,
        )
        
        return AuditSecurityResponse(
            signature=signature,
            security_metadata=metadata,
            flagged_for_review=metadata.get("flagged_for_review", False),
        )
    except RateLimitException as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=e.message,
        )


@router.post(
    "/payout/verify",
    response_model=PayoutSecurityResponse,
    summary="Verify payout security",
    description="Verifies that a payout meets all security requirements.",
)
async def verify_payout_security(request: PayoutSecurityRequest):
    """Verify a payout is secure to proceed."""
    is_allowed, reason, metadata = await security_service.secure_payout(
        receipt_id=request.receipt_id,
        company_id=request.company_id,
        employee_id=request.employee_id,
        amount=Decimal(request.amount),
        recipient_wallet=request.recipient_wallet,
        vault_address=request.vault_address,
        audit_signature=request.audit_signature,
    )
    
    return PayoutSecurityResponse(
        is_allowed=is_allowed,
        reason=reason,
        security_metadata=metadata,
        payout_authorization=metadata.get("payout_authorization"),
    )


@router.post(
    "/signature/verify",
    summary="Verify audit signature",
    description="Verifies that an audit signature is valid and not expired.",
)
async def verify_signature(request: VerifySignatureRequest):
    """Verify an audit signature."""
    from app.services.security import SignatureService
    
    sig_service = SignatureService()
    is_valid = sig_service.verify_audit_signature(request.signature)
    
    return {
        "is_valid": is_valid,
        "receipt_id": request.signature.receipt_id,
        "audit_result": request.signature.audit_result,
        "expired": not is_valid and request.signature.timestamp > 0,
    }


@router.get(
    "/rate-limit/{resource}/{resource_id}",
    response_model=RateLimitStatusResponse,
    summary="Check rate limit status",
    description="Check remaining rate limit for a resource.",
)
async def check_rate_limit(resource: str, resource_id: str):
    """Check rate limit status."""
    if resource == "audit":
        remaining = await rate_limiter.get_remaining(
            f"audit:{resource_id}",
            SecurityConfig.MAX_AUDITS_PER_MINUTE,
        )
        return RateLimitStatusResponse(
            remaining_per_minute=remaining,
            max_per_minute=SecurityConfig.MAX_AUDITS_PER_MINUTE,
            max_per_hour=SecurityConfig.MAX_AUDITS_PER_HOUR,
        )
    elif resource == "payout":
        remaining = await rate_limiter.get_remaining(
            f"payout:{resource_id}",
            SecurityConfig.MAX_PAYOUTS_PER_MINUTE,
        )
        return RateLimitStatusResponse(
            remaining_per_minute=remaining,
            max_per_minute=SecurityConfig.MAX_PAYOUTS_PER_MINUTE,
            max_per_hour=SecurityConfig.MAX_PAYOUTS_PER_HOUR,
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown resource: {resource}",
        )


@router.get(
    "/config",
    response_model=SecurityConfigResponse,
    summary="Get security configuration",
    description="Get public security configuration values.",
)
async def get_security_config():
    """Get public security configuration."""
    return SecurityConfigResponse(
        high_value_threshold_usd=str(SecurityConfig.HIGH_VALUE_THRESHOLD_USD),
        critical_value_threshold_usd=str(SecurityConfig.CRITICAL_VALUE_THRESHOLD_USD),
        daily_payout_limit_usd=str(SecurityConfig.DAILY_PAYOUT_LIMIT_USD),
        max_daily_receipts_per_employee=SecurityConfig.MAX_DAILY_RECEIPTS_PER_EMPLOYEE,
        signature_expiry_seconds=SecurityConfig.SIGNATURE_EXPIRY_SECONDS,
    )


@router.get(
    "/health",
    summary="Security service health check",
    description="Check if security service is operational.",
)
async def security_health():
    """Security service health check."""
    return {
        "status": "healthy",
        "service": "security",
        "features": [
            "cryptographic_signatures",
            "rate_limiting",
            "anomaly_detection",
            "payout_verification",
            "audit_logging",
        ],
    }
