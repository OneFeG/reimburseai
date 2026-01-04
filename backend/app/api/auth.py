"""
Two-Factor Authentication API - Email-based 2FA for all accounts.

Required for every login to protect against wallet compromise.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field

from app.services.email import email_service
from app.services.employee import EmployeeService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])


class Request2FACodeRequest(BaseModel):
    """Request to send a 2FA code."""
    wallet_address: str = Field(..., description="Connected wallet address")


class Request2FACodeResponse(BaseModel):
    """Response after requesting 2FA code."""
    success: bool
    message: str
    email_hint: Optional[str] = None  # e.g., "j***@gmail.com"


class Verify2FARequest(BaseModel):
    """Request to verify a 2FA code."""
    wallet_address: str = Field(..., description="Connected wallet address")
    code: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")


class Verify2FAResponse(BaseModel):
    """Response after verifying 2FA code."""
    success: bool
    message: str
    employee_id: Optional[str] = None
    employee_name: Optional[str] = None
    companies: Optional[list] = None


def mask_email(email: str) -> str:
    """Mask email for privacy: john@example.com -> j***@example.com"""
    if not email or "@" not in email:
        return "***@***.com"
    
    local, domain = email.rsplit("@", 1)
    if len(local) <= 2:
        masked_local = local[0] + "***"
    else:
        masked_local = local[0] + "***" + local[-1]
    
    return f"{masked_local}@{domain}"


@router.post("/2fa/request", response_model=Request2FACodeResponse)
async def request_2fa_code(body: Request2FACodeRequest):
    """
    Request a 2FA verification code.
    
    Sends a 6-digit code to the employee's registered email.
    Code expires in 5 minutes.
    """
    wallet_address = body.wallet_address.strip()
    
    if not wallet_address.startswith("0x") or len(wallet_address) != 42:
        raise HTTPException(status_code=400, detail="Invalid wallet address format")
    
    # Find employee by wallet
    employee_service = EmployeeService()
    try:
        employee = await employee_service.get_by_wallet(wallet_address)
        if not employee:
            raise HTTPException(
                status_code=404, 
                detail="No account found for this wallet. Please contact your company admin to register."
            )
        employee_data = employee.model_dump()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error finding employee: {e}")
        raise HTTPException(status_code=404, detail="No account found for this wallet")
    
    # Get employee email
    email = employee_data.get("email")
    if not email:
        raise HTTPException(
            status_code=400, 
            detail="No email registered for this account. Please contact your company admin."
        )
    
    # Check for existing pending code (rate limiting)
    if await email_service.has_pending_code(wallet_address):
        return Request2FACodeResponse(
            success=True,
            message="A verification code was already sent. Please check your email or wait for it to expire.",
            email_hint=mask_email(email),
        )
    
    # Generate and store code
    code = email_service.generate_2fa_code()
    await email_service.store_verification_code(
        wallet_address=wallet_address,
        email=email,
        code=code,
        expires_minutes=5,
    )
    
    # Send email
    try:
        sent = await email_service.send_2fa_code(
            to_email=email,
            code=code,
            employee_name=employee_data.get("name"),
        )
        
        if not sent:
            raise HTTPException(status_code=500, detail="Failed to send verification email")
            
    except Exception as e:
        logger.error(f"Failed to send 2FA email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send verification email")
    
    return Request2FACodeResponse(
        success=True,
        message="Verification code sent to your registered email",
        email_hint=mask_email(email),
    )


@router.post("/2fa/verify", response_model=Verify2FAResponse)
async def verify_2fa_code(body: Verify2FARequest):
    """
    Verify a 2FA code to complete authentication.
    
    Returns employee info and company memberships on success.
    """
    wallet_address = body.wallet_address.strip()
    code = body.code.strip()
    
    # Verify code
    success, message = await email_service.verify_code(
        wallet_address=wallet_address,
        code=code,
    )
    
    if not success:
        raise HTTPException(status_code=401, detail=message)
    
    # Get employee data
    employee_service = EmployeeService()
    try:
        employee = await employee_service.get_by_wallet(wallet_address)
        employee_data = employee.model_dump()
    except Exception as e:
        logger.error(f"Error getting employee after 2FA: {e}")
        raise HTTPException(status_code=500, detail="Verification succeeded but failed to load account")
    
    # Get company memberships
    companies = []
    try:
        # Get memberships from employee data
        memberships = employee_data.get("memberships", [])
        for membership in memberships:
            companies.append({
                "id": membership.get("company_id"),
                "name": membership.get("company_name"),
                "role": membership.get("role"),
            })
    except Exception as e:
        logger.warning(f"Could not load company memberships: {e}")
    
    logger.info(f"2FA verification successful for wallet {wallet_address[:10]}...")
    
    return Verify2FAResponse(
        success=True,
        message="Authentication successful",
        employee_id=employee_data.get("id"),
        employee_name=employee_data.get("name"),
        companies=companies,
    )


@router.post("/2fa/resend", response_model=Request2FACodeResponse)
async def resend_2fa_code(body: Request2FACodeRequest):
    """
    Resend a 2FA verification code.
    
    Invalidates any existing code and sends a new one.
    """
    wallet_address = body.wallet_address.strip()
    
    # Find employee
    employee_service = EmployeeService()
    try:
        employee = await employee_service.get_by_wallet(wallet_address)
        if not employee:
            raise HTTPException(status_code=404, detail="No account found for this wallet")
        employee_data = employee.model_dump()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error finding employee: {e}")
        raise HTTPException(status_code=404, detail="No account found for this wallet")
    
    email = employee_data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="No email registered for this account")
    
    # Generate new code (overwrites existing)
    code = email_service.generate_2fa_code()
    await email_service.store_verification_code(
        wallet_address=wallet_address,
        email=email,
        code=code,
        expires_minutes=5,
    )
    
    # Send email
    try:
        await email_service.send_2fa_code(
            to_email=email,
            code=code,
            employee_name=employee_data.get("name"),
        )
    except Exception as e:
        logger.error(f"Failed to resend 2FA email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send verification email")
    
    return Request2FACodeResponse(
        success=True,
        message="New verification code sent",
        email_hint=mask_email(email),
    )
