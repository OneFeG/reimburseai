"""
Ledger Service for tracking all financial transactions.

Manages the ledger of all advances, payouts, and company transactions.
"""

import logging
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Literal

from app.db.dependencies import get_supabase_client

logger = logging.getLogger(__name__)


# These match the ledger_entry_type enum in the database
LedgerEntryType = Literal["audit_fee", "reimbursement", "deposit", "withdrawal", "advance", "advance_repayment", "payout", "fee"]
LedgerEntryStatus = Literal["pending", "processing", "settled", "failed", "cancelled"]


class LedgerService:
    """
    Service for managing the financial ledger.

    Tracks all money movement including:
    - Employee advances (pre-expense funding)
    - Receipt payouts (reimbursements)
    - Fee collections
    - Company deposits
    """

    async def create_entry(
        self,
        company_id: str,
        employee_id: str | None,
        amount_usd: Decimal,
        entry_type: LedgerEntryType,
        fee_usd: Decimal = Decimal("0"),
        reference_id: str | None = None,
        reference_type: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Create a new ledger entry.

        Args:
            company_id: Company ID
            employee_id: Employee ID (if applicable)
            amount_usd: Transaction amount
            entry_type: Type of transaction
            fee_usd: Associated fee amount
            reference_id: ID of related entity (receipt, advance request, etc.)
            reference_type: Type of reference ("receipt", "advance_request", etc.)
            metadata: Additional metadata

        Returns:
            Created ledger entry
        """
        client = get_supabase_client()

        # Map 'payout' to 'reimbursement' for database enum compatibility
        db_entry_type = entry_type
        if entry_type == "payout":
            db_entry_type = "reimbursement"

        entry_data = {
            "id": str(uuid.uuid4()),
            "company_id": company_id,
            "employee_id": employee_id,
            "amount": float(amount_usd),  # Database uses 'amount'
            "amount_usd": float(amount_usd),  # Also store in amount_usd if column exists
            # Note: Don't include currency - let DB use default (VARCHAR(3) can't fit "USDC")
            # Run migration 008_fix_currency_column.sql to fix this
            "entry_type": db_entry_type,
            "receipt_id": reference_id if reference_type == "receipt" else None,
            "metadata": metadata or {},
        }

        try:
            result = client.table("ledger_entries").insert(entry_data).execute()

            if result.data:
                logger.info(
                    f"Ledger entry created: {entry_type} ${amount_usd} for company {company_id}"
                )
                return result.data[0]
        except Exception as e:
            logger.error(f"Failed to create ledger entry: {e}")
            # Try with minimal fields
            minimal_data = {
                "id": str(uuid.uuid4()),
                "company_id": company_id,
                "employee_id": employee_id,
                "amount": float(amount_usd),
                "entry_type": db_entry_type,
            }
            result = client.table("ledger_entries").insert(minimal_data).execute()
            if result.data:
                return result.data[0]

        raise Exception("Failed to create ledger entry")

    async def update_status(
        self,
        entry_id: str,
        status: LedgerEntryStatus,
        transaction_hash: str | None = None,
        error_message: str | None = None,
    ) -> dict[str, Any]:
        """
        Update the status of a ledger entry.

        Args:
            entry_id: Ledger entry ID
            status: New status
            transaction_hash: Blockchain transaction hash (if applicable)
            error_message: Error message (if failed)

        Returns:
            Updated ledger entry
        """
        client = get_supabase_client()

        update_data: dict[str, Any] = {
            "status": status,
            "updated_at": datetime.utcnow().isoformat(),
        }

        if transaction_hash:
            update_data["transaction_hash"] = transaction_hash

        if error_message:
            update_data["error_message"] = error_message

        if status == "settled":
            update_data["settled_at"] = datetime.utcnow().isoformat()

        result = client.table("ledger_entries").update(update_data).eq("id", entry_id).execute()

        if result.data:
            logger.info(f"Ledger entry {entry_id} updated to status: {status}")
            return result.data[0]

        raise Exception(f"Failed to update ledger entry {entry_id}")

    async def get_entry(self, entry_id: str) -> dict[str, Any] | None:
        """Get a ledger entry by ID."""
        client = get_supabase_client()

        result = client.table("ledger_entries").select("*").eq("id", entry_id).single().execute()

        return result.data

    async def get_company_ledger(
        self,
        company_id: str,
        limit: int = 100,
        offset: int = 0,
        entry_type: LedgerEntryType | None = None,
        status: LedgerEntryStatus | None = None,
    ) -> list[dict[str, Any]]:
        """
        Get ledger entries for a company.

        Args:
            company_id: Company ID
            limit: Maximum entries to return
            offset: Pagination offset
            entry_type: Filter by entry type
            status: Filter by status

        Returns:
            List of ledger entries
        """
        client = get_supabase_client()

        query = (
            client.table("ledger_entries")
            .select("*")
            .eq("company_id", company_id)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
        )

        if entry_type:
            query = query.eq("entry_type", entry_type)

        if status:
            query = query.eq("status", status)

        result = query.execute()
        return result.data or []

    async def get_employee_ledger(
        self,
        employee_id: str,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Get ledger entries for an employee."""
        client = get_supabase_client()

        result = (
            client.table("ledger_entries")
            .select("*")
            .eq("employee_id", employee_id)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        return result.data or []

    async def get_company_summary(
        self,
        company_id: str,
    ) -> dict[str, Any]:
        """
        Get a financial summary for a company.

        Returns total amounts by type and status.
        """
        client = get_supabase_client()

        # Get all entries for the company
        result = (
            client.table("ledger_entries")
            .select("entry_type, amount, metadata")
            .eq("company_id", company_id)
            .execute()
        )

        entries = result.data or []

        summary = {
            "total_payouts": Decimal("0"),
            "total_advances": Decimal("0"),
            "total_fees": Decimal("0"),
            "pending_amount": Decimal("0"),
            "settled_amount": Decimal("0"),
            "entry_count": len(entries),
        }

        for entry in entries:
            amount = Decimal(str(entry.get("amount", 0) or 0))
            entry_type = entry.get("entry_type")

            if entry_type in ("payout", "reimbursement"):
                summary["total_payouts"] += amount
            elif entry_type == "advance":
                summary["total_advances"] += amount
            elif entry_type == "audit_fee":
                summary["total_fees"] += amount

            summary["settled_amount"] += amount

        # Convert Decimals to floats for JSON serialization
        return {k: float(v) if isinstance(v, Decimal) else v for k, v in summary.items()}


# Singleton instance
ledger_service = LedgerService()
