"""
Reimbursement Flow API - Complete expense reimbursement orchestration.

This endpoint handles the full flow:
1. Validate receipt and employee
2. Call Auditor Agent (x402 gated)
3. If approved, trigger Treasury payout
4. Record in ledger and update billing
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import Any
from decimal import Decimal
import logging
import httpx

from app.config import settings
from app.services.receipt import receipt_service
from app.services.employee import EmployeeService
from app.services.policy import PolicyService
from app.services.whitelist import whitelist_service
from app.services.ledger import ledger_service
from app.services.billing import billing_service
from app.services.storage import StorageService
from app.services.audit import audit_service, AuditError
from app.services.thirdweb import thirdweb_service, ThirdwebError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reimburse", tags=["reimbursement"])


class ReimbursementRequest(BaseModel):
    """Request for processing a reimbursement."""
    receipt_id: str = Field(..., description="Receipt ID to process")
    employee_id: str = Field(..., description="Employee requesting reimbursement")
    company_id: str = Field(..., description="Company ID")


class ReimbursementResponse(BaseModel):
    """Response from reimbursement processing."""
    success: bool
    receipt_id: str
    status: str  # "approved", "rejected", "paid", "pending"
    amount_usd: float | None = None
    decision_reason: str | None = None
    payout_queue_id: str | None = None
    ledger_entry_id: str | None = None


class UploadAndReimburseRequest(BaseModel):
    """Request for uploading and immediately processing reimbursement."""
    employee_id: str
    company_id: str
    description: str | None = None
    category: str | None = None


@router.post("/process", response_model=ReimbursementResponse)
async def process_reimbursement(body: ReimbursementRequest):
    """
    Process a complete reimbursement for an uploaded receipt.
    
    Flow:
    1. Validate receipt exists and is pending
    2. Validate employee and get wallet
    3. Get company policy
    4. Call AI Auditor for receipt analysis
    5. If approved, initiate USDC payout
    6. Record in ledger and billing
    
    This is the main orchestration endpoint that ties together
    Agent A (Auditor) and Agent B (Treasury).
    """
    # Step 1: Get receipt
    receipt = await receipt_service.get_receipt(body.receipt_id)
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    if receipt.get("status") not in ["pending", "submitted"]:
        raise HTTPException(
            status_code=400,
            detail=f"Receipt already processed with status: {receipt.get('status')}"
        )
    
    # Step 2: Validate employee and get wallet
    employee_service = EmployeeService()
    try:
        employee = await employee_service.get_by_id(body.employee_id)
        employee_data = employee.model_dump()
    except Exception:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    employee_wallet = employee_data.get("wallet_address")
    if not employee_wallet:
        raise HTTPException(
            status_code=400,
            detail="Employee does not have a wallet address configured"
        )
    
    # Check wallet is whitelisted
    is_whitelisted = await whitelist_service.is_wallet_whitelisted(
        wallet_address=employee_wallet,
        company_id=body.company_id,
    )
    if not is_whitelisted:
        raise HTTPException(
            status_code=403,
            detail="Employee wallet is not whitelisted for payouts"
        )
    
    # Step 3: Get company policy
    policy_service = PolicyService()
    try:
        policy = await policy_service.get_active_for_company(body.company_id)
        policy_data = policy.model_dump()
    except Exception:
        policy_data = None  # Use defaults
    
    # Step 4: Get receipt image and run audit
    try:
        storage_service = StorageService()
        image_data = await storage_service.download_file(receipt["file_path"])
        
        audit_result = await audit_service.analyze_receipt(
            image_data=image_data,
            image_content_type=receipt.get("content_type", "image/jpeg"),
            policy={
                "amount_cap_usd": policy_data.get("amount_limit") if policy_data else 100,
                "allowed_categories": policy_data.get("allowed_categories", []) if policy_data else ["travel", "food", "supplies"],
                "max_days_old": policy_data.get("receipt_age_limit_days", 365) if policy_data else 365,
            } if policy_data else None,
        )
        
        # Record audit usage for billing
        await billing_service.record_audit_usage(
            company_id=body.company_id,
            receipt_id=body.receipt_id,
            success=True,
            tokens_used=audit_result.get("tokens_used", 0),
        )
        
    except AuditError as e:
        logger.error(f"Audit failed: {e}")
        # Still record failed audit for billing
        await billing_service.record_audit_usage(
            company_id=body.company_id,
            receipt_id=body.receipt_id,
            success=False,
        )
        raise HTTPException(status_code=500, detail=f"Audit failed: {str(e)}")
    
    # Extract audit decision
    validation = audit_result.get("validation", {})
    extracted = audit_result.get("extracted", {})
    is_approved = validation.get("is_valid", False)
    amount_usd = extracted.get("amount_usd", 0)
    decision_reason = validation.get("decision_reason", "Unknown")
    
    # Update receipt with audit result
    new_status = "approved" if is_approved else "rejected"
    await receipt_service.update_receipt_status(
        receipt_id=body.receipt_id,
        status=new_status,
        audit_result={
            "extracted": extracted,
            "validation": validation,
            "confidence": audit_result.get("confidence"),
            "audited_at": audit_result.get("audited_at"),
        }
    )
    
    # If not approved, return here
    if not is_approved:
        return ReimbursementResponse(
            success=False,
            receipt_id=body.receipt_id,
            status="rejected",
            amount_usd=amount_usd,
            decision_reason=decision_reason,
        )
    
    # Step 5: Initiate payout
    payout_queue_id = None
    try:
        transfer_result = await thirdweb_service.transfer_usdc(
            to_address=employee_wallet,
            amount_usd=Decimal(str(amount_usd)),
        )
        payout_queue_id = transfer_result.get("queue_id")
        
        # Update receipt with payout info
        await receipt_service.update_receipt_status(
            receipt_id=body.receipt_id,
            status="paid",
            payout_info={
                "queue_id": payout_queue_id,
                "amount_usd": amount_usd,
                "to_address": employee_wallet,
            }
        )
        
        # Record payout usage for billing
        await billing_service.record_payout_usage(
            company_id=body.company_id,
            payout_amount_usd=Decimal(str(amount_usd)),
            receipt_id=body.receipt_id,
        )
        
    except ThirdwebError as e:
        logger.error(f"Payout failed: {e}")
        # Receipt is approved but payout failed
        await receipt_service.update_receipt_status(
            receipt_id=body.receipt_id,
            status="approved",  # Keep as approved, payout pending
            payout_info={"error": str(e)}
        )
        raise HTTPException(
            status_code=500,
            detail=f"Receipt approved but payout failed: {str(e)}"
        )
    
    # Step 6: Create ledger entry
    ledger_entry = await ledger_service.create_entry(
        company_id=body.company_id,
        employee_id=body.employee_id,
        amount_usd=Decimal(str(amount_usd)),
        entry_type="payout",
        reference_id=body.receipt_id,
        reference_type="receipt",
        metadata={
            "queue_id": payout_queue_id,
            "employee_wallet": employee_wallet,
            "category": extracted.get("category"),
            "vendor": extracted.get("vendor"),
        }
    )
    
    return ReimbursementResponse(
        success=True,
        receipt_id=body.receipt_id,
        status="paid",
        amount_usd=amount_usd,
        decision_reason=decision_reason,
        payout_queue_id=payout_queue_id,
        ledger_entry_id=ledger_entry.get("id"),
    )


@router.post("/upload-and-process", response_model=ReimbursementResponse)
async def upload_and_process(
    file: UploadFile = File(..., description="Receipt image file"),
    employee_id: str = Form(...),
    company_id: str = Form(...),
    description: str | None = Form(None),
    category: str | None = Form(None),
):
    """
    Upload a receipt and immediately process for reimbursement.
    
    Combines upload + audit + payout in a single request.
    This is the most convenient endpoint for employees submitting expenses.
    """
    # Step 1: Upload the receipt
    storage_service = StorageService()
    
    # Read file content
    content = await file.read()
    
    # Validate file size
    max_size = settings.max_file_size_bytes
    if len(content) > max_size:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.max_file_size_mb}MB"
        )
    
    # Upload to storage
    file_path = await storage_service.upload_receipt(
        file_content=content,
        filename=file.filename or "receipt",
        content_type=file.content_type or "image/jpeg",
        company_id=company_id,
        employee_id=employee_id,
    )
    
    # Create receipt record
    receipt = await receipt_service.create_receipt(
        company_id=company_id,
        employee_id=employee_id,
        file_path=file_path,
        filename=file.filename,
        content_type=file.content_type,
        file_size=len(content),
        description=description,
        category=category,
    )
    
    # Step 2: Process the reimbursement
    try:
        return await process_reimbursement(
            ReimbursementRequest(
                receipt_id=receipt["id"],
                employee_id=employee_id,
                company_id=company_id,
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reimbursement processing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{receipt_id}")
async def get_reimbursement_status(receipt_id: str):
    """
    Get the current status of a reimbursement request.
    
    Returns receipt status and any payout/audit details.
    """
    receipt = await receipt_service.get_receipt(receipt_id)
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    # Get payout status if available
    payout_status = None
    payout_info = receipt.get("payout_info", {})
    
    if payout_info and payout_info.get("queue_id"):
        try:
            payout_status = await thirdweb_service.get_transaction_status(
                payout_info["queue_id"]
            )
        except Exception as e:
            logger.warning(f"Could not fetch payout status: {e}")
    
    return {
        "receipt_id": receipt_id,
        "status": receipt.get("status"),
        "amount_usd": receipt.get("audit_result", {}).get("extracted", {}).get("amount_usd"),
        "audit_result": receipt.get("audit_result"),
        "payout_info": payout_info,
        "payout_status": payout_status,
        "created_at": receipt.get("created_at"),
        "updated_at": receipt.get("updated_at"),
    }
