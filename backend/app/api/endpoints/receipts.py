"""
Receipt Endpoints
=================
Receipt management and audit operations.
"""

from fastapi import APIRouter, HTTPException, Query

from app.core.exceptions import AppException
from app.schemas.receipt import (
    AuditResult,
    ReceiptPayoutRequest,
    ReceiptPayoutResponse,
    ReceiptResponse,
    ReceiptStatus,
    ReceiptUpdate,
)
from app.services.receipt import ReceiptService
from app.services.storage import StorageService

router = APIRouter()


@router.get(
    "/{receipt_id}",
    response_model=ReceiptResponse,
    summary="Get receipt by ID",
)
async def get_receipt(receipt_id: str):
    """Get receipt details by UUID."""
    try:
        service = ReceiptService()
        return await service.get_by_id(receipt_id)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.get(
    "/{receipt_id}/image-url",
    summary="Get receipt image URL",
    description="Get a signed URL to view the receipt image.",
)
async def get_receipt_image_url(
    receipt_id: str,
    expires_in: int = Query(3600, description="URL expiration in seconds"),
):
    """
    Get a signed URL for the receipt image.
    The URL is temporary and expires after the specified duration.
    """
    try:
        receipt_service = ReceiptService()
        storage_service = StorageService()

        receipt = await receipt_service.get_by_id(receipt_id)
        url = await storage_service.get_signed_url(receipt.file_path, expires_in)

        return {
            "success": True,
            "url": url,
            "expires_in": expires_in,
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.patch(
    "/{receipt_id}",
    response_model=ReceiptResponse,
    summary="Update receipt",
)
async def update_receipt(receipt_id: str, data: ReceiptUpdate):
    """Update receipt details (for manual corrections)."""
    try:
        service = ReceiptService()
        return await service.update(receipt_id, data)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.patch(
    "/{receipt_id}/status",
    response_model=ReceiptResponse,
    summary="Update receipt status",
)
async def update_status(receipt_id: str, status: ReceiptStatus):
    """
    Update receipt status.
    Used for manual approval/rejection by managers.
    """
    try:
        service = ReceiptService()
        return await service.update_status(receipt_id, status)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.post(
    "/{receipt_id}/audit",
    response_model=ReceiptResponse,
    summary="Apply audit result",
    description="Apply AI audit results to a receipt. Called after x402 audit completes.",
)
async def apply_audit(receipt_id: str, audit: AuditResult):
    """
    Apply AI audit results to a receipt.

    This endpoint is called after the Auditor Agent completes its analysis.
    It updates the receipt with:
    - Extracted data (merchant, amount, date)
    - AI confidence score
    - Decision reason
    - Any detected anomalies

    The receipt status is automatically set based on the audit result.
    """
    try:
        service = ReceiptService()
        return await service.apply_audit_result(receipt_id, audit)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.post(
    "/{receipt_id}/audit-fee",
    response_model=ReceiptResponse,
    summary="Record audit fee payment",
    description="Record that the x402 audit fee has been paid.",
)
async def record_audit_fee(
    receipt_id: str,
    tx_hash: str,
    amount: float,
):
    """
    Record audit fee payment.
    Called after the Treasury pays the Auditor via x402.
    """
    try:
        service = ReceiptService()
        return await service.record_audit_fee(receipt_id, tx_hash, amount)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.post(
    "/{receipt_id}/payout",
    response_model=ReceiptPayoutResponse,
    summary="Record payout",
    description="Record that a payout has been sent for this receipt.",
)
async def record_payout(receipt_id: str, data: ReceiptPayoutRequest):
    """
    Record payout completion.

    Called after the Treasury sends USDC to the employee's wallet.
    This updates the receipt status to 'paid' and creates a ledger entry.
    """
    try:
        service = ReceiptService()
        # This would typically receive the tx_hash from the blockchain
        # For now, we'll simulate with a placeholder
        receipt = await service.record_payout(
            receipt_id=receipt_id,
            tx_hash="pending",  # Would be actual tx hash
            amount=data.amount,
            wallet_address=data.wallet_address,
        )

        return ReceiptPayoutResponse(
            success=True,
            receipt_id=receipt.id,
            tx_hash=receipt.payout_tx_hash or "",
            amount=data.amount,
            wallet_address=data.wallet_address,
            status=ReceiptStatus.PAID,
        )
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.get(
    "/company/{company_id}",
    summary="List receipts by company",
)
async def list_by_company(
    company_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str | None = Query(None, description="Filter by status"),
):
    """List all receipts for a company."""
    try:
        service = ReceiptService()
        receipts, total = await service.list_by_company(company_id, page, limit, status)
        return {
            "success": True,
            "data": receipts,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "total_pages": (total + limit - 1) // limit,
            },
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.get(
    "/employee/{employee_id}",
    summary="List receipts by employee",
)
async def list_by_employee(
    employee_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str | None = Query(None, description="Filter by status"),
):
    """List all receipts for an employee."""
    try:
        service = ReceiptService()
        receipts, total = await service.list_by_employee(employee_id, page, limit, status)
        return {
            "success": True,
            "data": receipts,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "total_pages": (total + limit - 1) // limit,
            },
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())


@router.get(
    "/company/{company_id}/pending",
    summary="Get pending receipts",
    description="Get all receipts requiring attention (for approval queue).",
)
async def get_pending(company_id: str):
    """
    Get pending receipts for the approval queue.
    Includes uploaded, processing, and flagged receipts.
    """
    try:
        service = ReceiptService()
        receipts = await service.get_pending_for_company(company_id)
        return {
            "success": True,
            "data": receipts,
            "total": len(receipts),
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_dict())
