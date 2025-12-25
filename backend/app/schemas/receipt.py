"""
Receipt Schemas
===============
Request/Response models for receipt and upload operations.
"""

from datetime import date, datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class ReceiptStatus(str, Enum):
    """Receipt processing status."""

    UPLOADED = "uploaded"
    PROCESSING = "processing"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID = "paid"
    FLAGGED = "flagged"


class ReceiptCreate(BaseModel):
    """Schema for initial receipt creation (after file upload)."""

    company_id: str = Field(..., description="Company UUID")
    employee_id: str = Field(..., description="Employee UUID")
    file_path: str = Field(..., description="Storage path of uploaded file")
    file_name: str = Field(..., description="Original filename")
    file_size: int = Field(..., gt=0, description="File size in bytes")
    mime_type: str = Field(..., description="File MIME type")
    description: str | None = Field(None, max_length=500, description="Employee notes")
    category: str | None = Field(None, max_length=100, description="Expense category")


class ReceiptUpdate(BaseModel):
    """Schema for updating receipt details."""

    status: ReceiptStatus | None = None
    merchant: str | None = Field(None, max_length=255)
    merchant_category: str | None = Field(None, max_length=100)
    receipt_date: date | None = None
    amount: float | None = Field(None, gt=0)
    currency: str | None = Field(None, max_length=3)
    description: str | None = Field(None, max_length=500)
    category: str | None = Field(None, max_length=100)


class AuditResult(BaseModel):
    """
    AI audit result from the Auditor Agent.
    This is what Dev 1's x402 auditor returns.
    """

    is_valid: bool = Field(..., description="Whether the receipt passes audit")
    confidence: float = Field(..., ge=0, le=100, description="AI confidence score")
    decision_reason: str = Field(..., description="Explanation of decision")

    # Extracted data
    merchant: str | None = None
    merchant_category: str | None = None
    receipt_date: date | None = None
    amount: float | None = None
    currency: str = "USD"

    # Full extraction
    extracted_data: dict[str, Any] = Field(default_factory=dict)

    # Anomalies detected
    anomalies: list[str] = Field(default_factory=list)


class ReceiptResponse(BaseModel):
    """Schema for receipt response."""

    id: str
    company_id: str
    employee_id: str

    # File info
    file_path: str
    file_name: str
    file_size: int
    mime_type: str

    # Extracted data
    merchant: str | None = None
    merchant_category: str | None = None
    receipt_date: date | None = None
    amount: float | None = None
    currency: str = "USD"

    # Status
    status: ReceiptStatus
    ai_confidence: float | None = None
    ai_decision_reason: str | None = None
    ai_extracted_data: dict[str, Any] | None = None
    ai_anomalies: list[str] = Field(default_factory=list)

    # Audit fee
    audit_fee_paid: bool = False
    audit_fee_tx_hash: str | None = None
    audit_fee_amount: float | None = None

    # Payout
    payout_amount: float | None = None
    payout_tx_hash: str | None = None
    payout_wallet: str | None = None
    paid_at: datetime | None = None

    # Employee input
    description: str | None = None
    category: str | None = None

    # Timestamps
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ReceiptUploadResponse(BaseModel):
    """Response after successful file upload."""

    success: bool = True
    message: str = "Receipt uploaded successfully"
    receipt_id: str
    file_path: str
    status: ReceiptStatus = ReceiptStatus.UPLOADED


class ReceiptListResponse(BaseModel):
    """Response for listing receipts."""

    receipts: list[ReceiptResponse]
    total: int
    page: int
    limit: int


class ReceiptPayoutRequest(BaseModel):
    """Request to trigger payout for an approved receipt."""

    receipt_id: str = Field(..., description="Receipt UUID to pay out")
    amount: float = Field(..., gt=0, description="Amount to pay in USDC")
    wallet_address: str = Field(
        ...,
        pattern=r"^0x[a-fA-F0-9]{40}$",
        description="Recipient wallet address",
    )


class ReceiptPayoutResponse(BaseModel):
    """Response after payout is initiated."""

    success: bool = True
    receipt_id: str
    tx_hash: str
    amount: float
    wallet_address: str
    status: ReceiptStatus = ReceiptStatus.PAID
