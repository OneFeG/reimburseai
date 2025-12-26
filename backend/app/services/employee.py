"""
Employee Service
================
Business logic for employee operations.
"""

from datetime import UTC

from supabase import Client

from app.core.exceptions import ConflictException, NotFoundException
from app.core.security import hash_password
from app.db.supabase import get_supabase_admin_client
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeResponse,
    EmployeeUpdate,
    EmployeeWithStats,
)


class EmployeeService:
    """Service for managing employees."""

    def __init__(self, client: Client | None = None):
        """Initialize with Supabase client."""
        self.client = client or get_supabase_admin_client()
        self.table = "employees"

    async def create(self, data: EmployeeCreate) -> EmployeeResponse:
        """
        Create a new employee.

        Args:
            data: Employee creation data

        Returns:
            Created employee

        Raises:
            ConflictException: If email already exists in company
        """
        # Check if email exists in this company
        existing = (
            self.client.table(self.table)
            .select("id")
            .eq("company_id", data.company_id)
            .eq("email", data.email)
            .execute()
        )
        if existing.data:
            raise ConflictException(
                message=f"Employee with email '{data.email}' already exists in this company",
                error_code="EMAIL_EXISTS",
            )

        # Prepare insert data
        insert_data = data.model_dump(exclude={"password"})

        # Hash password if provided
        if data.password:
            insert_data["password_hash"] = hash_password(data.password)

        # Create employee
        result = self.client.table(self.table).insert(insert_data).execute()

        return EmployeeResponse(**result.data[0])

    async def get_by_id(self, employee_id: str) -> EmployeeResponse:
        """
        Get employee by ID.

        Args:
            employee_id: Employee UUID

        Returns:
            Employee data

        Raises:
            NotFoundException: If employee not found
        """
        result = self.client.table(self.table).select("*").eq("id", employee_id).execute()

        if not result.data:
            raise NotFoundException(
                message=f"Employee not found: {employee_id}",
                error_code="EMPLOYEE_NOT_FOUND",
            )

        return EmployeeResponse(**result.data[0])

    async def get_by_email(self, company_id: str, email: str) -> EmployeeResponse:
        """
        Get employee by email within a company.

        Args:
            company_id: Company UUID
            email: Employee email

        Returns:
            Employee data

        Raises:
            NotFoundException: If employee not found
        """
        result = (
            self.client.table(self.table)
            .select("*")
            .eq("company_id", company_id)
            .eq("email", email)
            .execute()
        )

        if not result.data:
            raise NotFoundException(
                message=f"Employee not found: {email}",
                error_code="EMPLOYEE_NOT_FOUND",
            )

        return EmployeeResponse(**result.data[0])

    async def update(self, employee_id: str, data: EmployeeUpdate) -> EmployeeResponse:
        """
        Update employee details.

        Args:
            employee_id: Employee UUID
            data: Update data

        Returns:
            Updated employee
        """
        # Filter out None values
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}

        if not update_data:
            return await self.get_by_id(employee_id)

        result = self.client.table(self.table).update(update_data).eq("id", employee_id).execute()

        if not result.data:
            raise NotFoundException(
                message=f"Employee not found: {employee_id}",
                error_code="EMPLOYEE_NOT_FOUND",
            )

        return EmployeeResponse(**result.data[0])

    async def update_wallet(self, employee_id: str, wallet_address: str) -> EmployeeResponse:
        """
        Update employee wallet address.

        Args:
            employee_id: Employee UUID
            wallet_address: New wallet address

        Returns:
            Updated employee
        """
        from datetime import datetime

        result = (
            self.client.table(self.table)
            .update(
                {
                    "wallet_address": wallet_address,
                    "wallet_verified_at": datetime.now(UTC).isoformat(),
                }
            )
            .eq("id", employee_id)
            .execute()
        )

        if not result.data:
            raise NotFoundException(
                message=f"Employee not found: {employee_id}",
                error_code="EMPLOYEE_NOT_FOUND",
            )

        return EmployeeResponse(**result.data[0])

    async def list_by_company(
        self,
        company_id: str,
        page: int = 1,
        limit: int = 20,
        status: str | None = None,
    ) -> tuple[list[EmployeeResponse], int]:
        """
        List employees for a company.

        Args:
            company_id: Company UUID
            page: Page number
            limit: Items per page
            status: Filter by status

        Returns:
            Tuple of (employees, total_count)
        """
        offset = (page - 1) * limit

        # Build query
        query = self.client.table(self.table).select("*", count="exact")
        query = query.eq("company_id", company_id)

        if status:
            query = query.eq("status", status)

        # Get total count
        count_result = query.execute()
        total = count_result.count or 0

        # Get paginated data
        result = (
            self.client.table(self.table)
            .select("*")
            .eq("company_id", company_id)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        if status:
            result = (
                self.client.table(self.table)
                .select("*")
                .eq("company_id", company_id)
                .eq("status", status)
                .order("created_at", desc=True)
                .range(offset, offset + limit - 1)
                .execute()
            )

        employees = [EmployeeResponse(**e) for e in result.data]
        return employees, total

    async def get_with_stats(self, employee_id: str) -> EmployeeWithStats:
        """
        Get employee with expense statistics.

        Args:
            employee_id: Employee UUID

        Returns:
            Employee with stats
        """
        # Get employee
        employee = await self.get_by_id(employee_id)

        # Get receipt stats
        receipts = (
            self.client.table("receipts")
            .select("id, status, amount, payout_amount")
            .eq("employee_id", employee_id)
            .execute()
        )

        total_receipts = len(receipts.data)
        pending = len([r for r in receipts.data if r["status"] in ["uploaded", "processing"]])
        reimbursed = sum(
            r.get("payout_amount") or 0 for r in receipts.data if r["status"] == "paid"
        )

        # This month spend
        from datetime import datetime

        now = datetime.now(UTC)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        month_receipts = (
            self.client.table("receipts")
            .select("amount, status")
            .eq("employee_id", employee_id)
            .gte("created_at", month_start.isoformat())
            .execute()
        )

        month_spend = sum(
            r.get("amount") or 0 for r in month_receipts.data if r["status"] in ["approved", "paid"]
        )

        return EmployeeWithStats(
            **employee.model_dump(),
            total_receipts=total_receipts,
            pending_receipts=pending,
            total_reimbursed=reimbursed,
            month_spend=month_spend,
        )

    async def delete(self, employee_id: str) -> bool:
        """
        Soft delete (deactivate) an employee.

        Args:
            employee_id: Employee UUID

        Returns:
            True if successful
        """
        result = (
            self.client.table(self.table)
            .update({"status": "inactive"})
            .eq("id", employee_id)
            .execute()
        )

        return len(result.data) > 0


# Module-level helper functions and singleton
employee_service = EmployeeService()


async def get_employee(employee_id: str) -> dict | None:
    """Get employee by ID, returns dict or None."""
    try:
        employee = await employee_service.get_by_id(employee_id)
        return employee.model_dump()
    except Exception:
        return None
