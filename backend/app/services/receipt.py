"""
Receipt Service
===============
Business logic for receipt operations.
"""

from datetime import datetime, timezone
from typing import Any

from supabase import Client

from app.core.exceptions import BadRequestException, NotFoundException
from app.db.supabase import get_supabase_admin_client
from app.schemas.receipt import (
    AuditResult,
    ReceiptCreate,
    ReceiptResponse,
    ReceiptStatus,
    ReceiptUpdate,
)


class ReceiptService:
    """Service for managing receipts."""

    def __init__(self, client: Client | None = None):
        """Initialize with Supabase client."""
        self.client = client or get_supabase_admin_client()
        self.table = "receipts"

    async def create(self, data: ReceiptCreate) -> ReceiptResponse:
        """
        Create a new receipt record after file upload.

        Args:
            data: Receipt creation data

        Returns:
            Created receipt
        """
        result = (
            self.client.table(self.table)
            .insert(data.model_dump())
            .execute()
        )

        return ReceiptResponse(**result.data[0])

    async def get_by_id(self, receipt_id: str) -> ReceiptResponse:
        """
        Get receipt by ID.

        Args:
            receipt_id: Receipt UUID

        Returns:
            Receipt data

        Raises:
            NotFoundException: If receipt not found
        """
        result = (
            self.client.table(self.table)
            .select("*")
            .eq("id", receipt_id)
            .execute()
        )

        if not result.data:
            raise NotFoundException(
                message=f"Receipt not found: {receipt_id}",
                error_code="RECEIPT_NOT_FOUND",
            )

        return ReceiptResponse(**result.data[0])

    async def update(
        self, receipt_id: str, data: ReceiptUpdate
    ) -> ReceiptResponse:
        """
        Update receipt details.

        Args:
            receipt_id: Receipt UUID
            data: Update data

        Returns:
            Updated receipt
        """
        # Filter out None values
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}

        if not update_data:
            return await self.get_by_id(receipt_id)

        result = (
            self.client.table(self.table)
            .update(update_data)
            .eq("id", receipt_id)
            .execute()
        )

        if not result.data:
            raise NotFoundException(
                message=f"Receipt not found: {receipt_id}",
                error_code="RECEIPT_NOT_FOUND",
            )

        return ReceiptResponse(**result.data[0])

    async def update_status(
        self, receipt_id: str, status: ReceiptStatus
    ) -> ReceiptResponse:
        """
        Update receipt status.

        Args:
            receipt_id: Receipt UUID
            status: New status

        Returns:
            Updated receipt
        """
        result = (
            self.client.table(self.table)
            .update({"status": status.value})
            .eq("id", receipt_id)
            .execute()
        )

        if not result.data:
            raise NotFoundException(
                message=f"Receipt not found: {receipt_id}",
                error_code="RECEIPT_NOT_FOUND",
            )

        return ReceiptResponse(**result.data[0])

    async def apply_audit_result(
        self, receipt_id: str, audit: AuditResult
    ) -> ReceiptResponse:
        """
        Apply AI audit results to a receipt.

        Args:
            receipt_id: Receipt UUID
            audit: Audit result from Auditor Agent

        Returns:
            Updated receipt
        """
        # Determine status based on audit
        if audit.is_valid:
            status = ReceiptStatus.APPROVED
        elif audit.anomalies:
            status = ReceiptStatus.FLAGGED
        else:
            status = ReceiptStatus.REJECTED

        update_data: dict[str, Any] = {
            "status": status.value,
            "ai_confidence": audit.confidence,
            "ai_decision_reason": audit.decision_reason,
            "ai_extracted_data": audit.extracted_data,
            "ai_anomalies": audit.anomalies,
        }

        # Apply extracted data
        if audit.merchant:
            update_data["merchant"] = audit.merchant
        if audit.merchant_category:
            update_data["merchant_category"] = audit.merchant_category
        if audit.receipt_date:
            update_data["receipt_date"] = audit.receipt_date.isoformat()
        if audit.amount:
            update_data["amount"] = audit.amount
        if audit.currency:
            update_data["currency"] = audit.currency

        result = (
            self.client.table(self.table)
            .update(update_data)
            .eq("id", receipt_id)
            .execute()
        )

        if not result.data:
            raise NotFoundException(
                message=f"Receipt not found: {receipt_id}",
                error_code="RECEIPT_NOT_FOUND",
            )

        return ReceiptResponse(**result.data[0])

    async def record_audit_fee(
        self,
        receipt_id: str,
        tx_hash: str,
        amount: float,
    ) -> ReceiptResponse:
        """
        Record audit fee payment for a receipt.

        Args:
            receipt_id: Receipt UUID
            tx_hash: Transaction hash
            amount: Fee amount in USDC

        Returns:
            Updated receipt
        """
        result = (
            self.client.table(self.table)
            .update({
                "audit_fee_paid": True,
                "audit_fee_tx_hash": tx_hash,
                "audit_fee_amount": amount,
            })
            .eq("id", receipt_id)
            .execute()
        )

        if not result.data:
            raise NotFoundException(
                message=f"Receipt not found: {receipt_id}",
                error_code="RECEIPT_NOT_FOUND",
            )

        return ReceiptResponse(**result.data[0])

    async def record_payout(
        self,
        receipt_id: str,
        tx_hash: str,
        amount: float,
        wallet_address: str,
    ) -> ReceiptResponse:
        """
        Record payout completion for a receipt.

        Args:
            receipt_id: Receipt UUID
            tx_hash: Payout transaction hash
            amount: Payout amount in USDC
            wallet_address: Recipient wallet

        Returns:
            Updated receipt
        """
        result = (
            self.client.table(self.table)
            .update({
                "status": ReceiptStatus.PAID.value,
                "payout_tx_hash": tx_hash,
                "payout_amount": amount,
                "payout_wallet": wallet_address,
                "paid_at": datetime.now(timezone.utc).isoformat(),
            })
            .eq("id", receipt_id)
            .execute()
        )

        if not result.data:
            raise NotFoundException(
                message=f"Receipt not found: {receipt_id}",
                error_code="RECEIPT_NOT_FOUND",
            )

        # Also create ledger entry
        await self._create_ledger_entry(
            receipt_id=receipt_id,
            entry_type="reimbursement",
            amount=amount,
            tx_hash=tx_hash,
            to_address=wallet_address,
        )

        return ReceiptResponse(**result.data[0])

    async def _create_ledger_entry(
        self,
        receipt_id: str,
        entry_type: str,
        amount: float,
        tx_hash: str,
        to_address: str,
    ) -> None:
        """Create a ledger entry for the transaction."""
        # Get receipt for company_id and employee_id
        receipt = await self.get_by_id(receipt_id)

        self.client.table("ledger_entries").insert({
            "company_id": receipt.company_id,
            "entry_type": entry_type,
            "amount": amount,
            "currency": "USDC",
            "receipt_id": receipt_id,
            "employee_id": receipt.employee_id,
            "tx_hash": tx_hash,
            "to_address": to_address,
        }).execute()

    async def list_by_company(
        self,
        company_id: str,
        page: int = 1,
        limit: int = 20,
        status: str | None = None,
    ) -> tuple[list[ReceiptResponse], int]:
        """
        List receipts for a company.

        Args:
            company_id: Company UUID
            page: Page number
            limit: Items per page
            status: Filter by status

        Returns:
            Tuple of (receipts, total_count)
        """
        offset = (page - 1) * limit

        # Build base query for count
        count_query = (
            self.client.table(self.table)
            .select("id", count="exact")
            .eq("company_id", company_id)
        )
        if status:
            count_query = count_query.eq("status", status)

        count_result = count_query.execute()
        total = count_result.count or 0

        # Build data query
        data_query = (
            self.client.table(self.table)
            .select("*")
            .eq("company_id", company_id)
        )
        if status:
            data_query = data_query.eq("status", status)

        result = (
            data_query
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        receipts = [ReceiptResponse(**r) for r in result.data]
        return receipts, total

    async def list_by_employee(
        self,
        employee_id: str,
        page: int = 1,
        limit: int = 20,
        status: str | None = None,
    ) -> tuple[list[ReceiptResponse], int]:
        """
        List receipts for an employee.

        Args:
            employee_id: Employee UUID
            page: Page number
            limit: Items per page
            status: Filter by status

        Returns:
            Tuple of (receipts, total_count)
        """
        offset = (page - 1) * limit

        # Build base query for count
        count_query = (
            self.client.table(self.table)
            .select("id", count="exact")
            .eq("employee_id", employee_id)
        )
        if status:
            count_query = count_query.eq("status", status)

        count_result = count_query.execute()
        total = count_result.count or 0

        # Build data query
        data_query = (
            self.client.table(self.table)
            .select("*")
            .eq("employee_id", employee_id)
        )
        if status:
            data_query = data_query.eq("status", status)

        result = (
            data_query
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        receipts = [ReceiptResponse(**r) for r in result.data]
        return receipts, total

    async def get_pending_for_company(
        self, company_id: str
    ) -> list[ReceiptResponse]:
        """
        Get all pending receipts for a company (for approval queue).

        Args:
            company_id: Company UUID

        Returns:
            List of pending receipts
        """
        result = (
            self.client.table(self.table)
            .select("*")
            .eq("company_id", company_id)
            .in_("status", ["uploaded", "processing", "flagged"])
            .order("created_at", desc=True)
            .execute()
        )

        return [ReceiptResponse(**r) for r in result.data]
