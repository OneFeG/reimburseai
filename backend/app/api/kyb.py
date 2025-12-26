"""
KYB (Know Your Business) API endpoints for company verification.
"""

import logging
from typing import Any, Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, EmailStr, Field

from app.services.kyb import kyb_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/kyb", tags=["kyb"])


class KYBSubmissionRequest(BaseModel):
    """Request body for KYB submission."""

    company_id: str = Field(..., description="Company ID")
    company_name: str = Field(..., min_length=2, description="Legal company name")
    registration_number: str | None = Field(None, description="Business registration number")
    country: str | None = Field(None, description="Country of incorporation")
    contact_email: EmailStr | None = Field(None, description="Primary contact email")
    contact_phone: str | None = Field(None, description="Primary contact phone")
    address: str | None = Field(None, description="Business address")
    business_type: str | None = Field(None, description="Type of business")
    tax_id: str | None = Field(None, description="Tax identification number")
    bank_account_last4: str | None = Field(
        None, max_length=4, description="Last 4 digits of bank account"
    )
    documents: list[str] | None = Field(None, description="List of document file paths")


class KYBStatusUpdate(BaseModel):
    """Request body for updating KYB status (admin)."""

    status: Literal["pending", "approved", "rejected", "under_review"]
    reviewer_notes: str | None = None


class KYBStatusResponse(BaseModel):
    """KYB status response."""

    company_id: str
    status: str
    data: dict[str, Any]
    documents: list[str] | None = None
    reviewer_notes: str | None = None
    created_at: str | None = None
    updated_at: str | None = None
    reviewed_at: str | None = None


class KYBSubmissionResponse(BaseModel):
    """KYB submission response."""

    id: str
    company_id: str
    status: str
    message: str


@router.get("/{company_id}", response_model=KYBStatusResponse)
async def get_kyb_status(company_id: str):
    """
    Get KYB verification status for a company.

    Returns the current status and submitted data.
    """
    result = await kyb_service.get_kyb_status(company_id)
    return KYBStatusResponse(
        company_id=company_id,
        status=result.get("status", "unsubmitted"),
        data=result.get("data", {}),
        documents=result.get("documents"),
        reviewer_notes=result.get("reviewer_notes"),
        created_at=result.get("created_at"),
        updated_at=result.get("updated_at"),
        reviewed_at=result.get("reviewed_at"),
    )


@router.post("", response_model=KYBSubmissionResponse)
async def submit_kyb(body: KYBSubmissionRequest):
    """
    Submit KYB verification data.

    Companies must submit KYB data to be verified before using
    the full features of the platform.
    """
    try:
        result = await kyb_service.submit_kyb(
            company_id=body.company_id,
            company_name=body.company_name,
            registration_number=body.registration_number,
            country=body.country,
            contact_email=body.contact_email,
            contact_phone=body.contact_phone,
            address=body.address,
            business_type=body.business_type,
            tax_id=body.tax_id,
            bank_account_last4=body.bank_account_last4,
            documents=body.documents,
        )

        return KYBSubmissionResponse(
            id=result["id"],
            company_id=body.company_id,
            status=result["status"],
            message="KYB submission received and pending review",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to submit KYB: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{submission_id}/status", response_model=KYBStatusResponse)
async def update_kyb_status(submission_id: str, body: KYBStatusUpdate):
    """
    Update KYB submission status (admin operation).

    Used by admins to approve or reject KYB submissions.
    """
    try:
        result = await kyb_service.update_kyb_status(
            submission_id=submission_id,
            status=body.status,
            reviewer_notes=body.reviewer_notes,
        )

        return KYBStatusResponse(
            company_id=result["company_id"],
            status=result["status"],
            data=result.get("data", {}),
            documents=result.get("documents"),
            reviewer_notes=result.get("reviewer_notes"),
            created_at=result.get("created_at"),
            updated_at=result.get("updated_at"),
            reviewed_at=result.get("reviewed_at"),
        )
    except Exception as e:
        logger.error(f"Failed to update KYB status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{company_id}/verified")
async def check_kyb_verified(company_id: str):
    """
    Check if a company is KYB verified.

    Returns a simple boolean response.
    """
    is_verified = await kyb_service.is_company_verified(company_id)
    return {"company_id": company_id, "verified": is_verified}


@router.get("/admin/pending", response_model=list[KYBStatusResponse])
async def get_pending_submissions(limit: int = Query(100, ge=1, le=500)):
    """
    Get all pending KYB submissions (admin operation).

    Returns submissions in order of creation (oldest first).
    """
    submissions = await kyb_service.get_pending_submissions(limit=limit)

    return [
        KYBStatusResponse(
            company_id=s["company_id"],
            status=s["status"],
            data=s.get("data", {}),
            documents=s.get("documents"),
            reviewer_notes=s.get("reviewer_notes"),
            created_at=s.get("created_at"),
            updated_at=s.get("updated_at"),
            reviewed_at=s.get("reviewed_at"),
        )
        for s in submissions
    ]
