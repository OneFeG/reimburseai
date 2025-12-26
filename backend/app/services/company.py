"""
Company Service
===============
Business logic for company operations.
"""

from datetime import UTC, datetime
from typing import Any

from supabase import Client

from app.core.exceptions import ConflictException, NotFoundException
from app.db.supabase import get_supabase_admin_client
from app.schemas.company import (
    CompanyCreate,
    CompanyResponse,
    CompanyStats,
    CompanyUpdate,
    VaultLinkRequest,
)


class CompanyService:
    """Service for managing companies (tenants)."""

    def __init__(self, client: Client | None = None):
        """Initialize with Supabase client."""
        self.client = client or get_supabase_admin_client()
        self.table = "companies"

    async def create(self, data: CompanyCreate) -> CompanyResponse:
        """
        Create a new company.

        Args:
            data: Company creation data

        Returns:
            Created company

        Raises:
            ConflictException: If slug or email already exists
        """
        # Check if slug exists
        existing = self.client.table(self.table).select("id").eq("slug", data.slug).execute()
        if existing.data:
            raise ConflictException(
                message=f"Company with slug '{data.slug}' already exists",
                error_code="SLUG_EXISTS",
            )

        # Check if email exists
        existing_email = (
            self.client.table(self.table).select("id").eq("email", data.email).execute()
        )
        if existing_email.data:
            raise ConflictException(
                message=f"Company with email '{data.email}' already exists",
                error_code="EMAIL_EXISTS",
            )

        # Create company
        result = self.client.table(self.table).insert(data.model_dump()).execute()

        return CompanyResponse(**result.data[0])

    async def get_by_id(self, company_id: str) -> CompanyResponse:
        """
        Get company by ID.

        Args:
            company_id: Company UUID

        Returns:
            Company data

        Raises:
            NotFoundException: If company not found
        """
        result = self.client.table(self.table).select("*").eq("id", company_id).execute()

        if not result.data:
            raise NotFoundException(
                message=f"Company not found: {company_id}",
                error_code="COMPANY_NOT_FOUND",
            )

        return CompanyResponse(**result.data[0])

    async def get_by_slug(self, slug: str) -> CompanyResponse:
        """
        Get company by URL slug.

        Args:
            slug: Company slug (e.g., 'acme-corp')

        Returns:
            Company data

        Raises:
            NotFoundException: If company not found
        """
        result = self.client.table(self.table).select("*").eq("slug", slug).execute()

        if not result.data:
            raise NotFoundException(
                message=f"Company not found: {slug}",
                error_code="COMPANY_NOT_FOUND",
            )

        return CompanyResponse(**result.data[0])

    async def update(self, company_id: str, data: CompanyUpdate) -> CompanyResponse:
        """
        Update company details.

        Args:
            company_id: Company UUID
            data: Update data

        Returns:
            Updated company
        """
        # Filter out None values
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}

        if not update_data:
            return await self.get_by_id(company_id)

        result = self.client.table(self.table).update(update_data).eq("id", company_id).execute()

        if not result.data:
            raise NotFoundException(
                message=f"Company not found: {company_id}",
                error_code="COMPANY_NOT_FOUND",
            )

        return CompanyResponse(**result.data[0])

    async def link_vault(self, data: VaultLinkRequest) -> CompanyResponse:
        """
        Link a deployed vault address to a company.
        This is called by Dev 1 (Web3 Lead) after deploying a vault.

        Args:
            data: Vault linking data

        Returns:
            Updated company with vault address
        """
        update_data = {
            "vault_address": data.vault_address,
            "vault_chain_id": data.chain_id,
            "vault_deployed_at": datetime.now(UTC).isoformat(),
        }

        result = (
            self.client.table(self.table).update(update_data).eq("id", data.company_id).execute()
        )

        if not result.data:
            raise NotFoundException(
                message=f"Company not found: {data.company_id}",
                error_code="COMPANY_NOT_FOUND",
            )

        return CompanyResponse(**result.data[0])

    async def update_status(self, company_id: str, status: str) -> CompanyResponse:
        """Update company verification status."""
        update_data: dict[str, Any] = {"status": status}

        if status == "verified":
            update_data["kyb_verified_at"] = datetime.now(UTC).isoformat()

        result = self.client.table(self.table).update(update_data).eq("id", company_id).execute()

        if not result.data:
            raise NotFoundException(
                message=f"Company not found: {company_id}",
                error_code="COMPANY_NOT_FOUND",
            )

        return CompanyResponse(**result.data[0])

    async def get_stats(self, company_id: str) -> CompanyStats:
        """
        Get company statistics for dashboard.

        Args:
            company_id: Company UUID

        Returns:
            Company statistics
        """
        # Get employee counts
        employees = (
            self.client.table("employees")
            .select("id, status")
            .eq("company_id", company_id)
            .execute()
        )

        total_employees = len(employees.data)
        active_employees = len([e for e in employees.data if e["status"] == "active"])

        # Get receipt counts and sums
        receipts = (
            self.client.table("receipts")
            .select("id, status, amount, created_at")
            .eq("company_id", company_id)
            .execute()
        )

        total_receipts = len(receipts.data)
        pending = len([r for r in receipts.data if r["status"] in ["uploaded", "processing"]])
        approved = len([r for r in receipts.data if r["status"] in ["approved", "paid"]])
        rejected = len([r for r in receipts.data if r["status"] == "rejected"])

        # Calculate spend
        all_time = sum(
            r["amount"] or 0 for r in receipts.data if r["status"] in ["approved", "paid"]
        )

        # This month's spend
        now = datetime.now(UTC)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_spend = sum(
            r["amount"] or 0
            for r in receipts.data
            if r["status"] in ["approved", "paid"]
            and r.get("created_at", "") >= month_start.isoformat()
        )

        return CompanyStats(
            total_employees=total_employees,
            active_employees=active_employees,
            total_receipts=total_receipts,
            pending_receipts=pending,
            approved_receipts=approved,
            rejected_receipts=rejected,
            total_spend_month=month_spend,
            total_spend_all_time=all_time,
        )

    async def list_all(self, page: int = 1, limit: int = 20) -> tuple[list[CompanyResponse], int]:
        """
        List all companies (admin only).

        Args:
            page: Page number
            limit: Items per page

        Returns:
            Tuple of (companies, total_count)
        """
        offset = (page - 1) * limit

        # Get total count
        count_result = self.client.table(self.table).select("id", count="exact").execute()
        total = count_result.count or 0

        # Get paginated data
        result = (
            self.client.table(self.table)
            .select("*")
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        companies = [CompanyResponse(**c) for c in result.data]
        return companies, total
