"""
Multi-Company Membership Service
================================
Business logic for managing employee company memberships.
"""

from datetime import datetime, UTC
from supabase import Client

from app.core.exceptions import ConflictException, NotFoundException, ForbiddenException
from app.db.supabase import get_supabase_admin_client
from app.schemas.membership import (
    MembershipCreate,
    MembershipResponse,
    MembershipUpdate,
    MembershipWithCompany,
    EmployeeCompaniesResponse,
    SwitchCompanyResponse,
)


class MembershipService:
    """Service for managing employee company memberships."""

    def __init__(self, client: Client | None = None):
        """Initialize with Supabase client."""
        self.client = client or get_supabase_admin_client()
        self.table = "employee_company_memberships"

    async def create(self, data: MembershipCreate) -> MembershipResponse:
        """
        Create a new company membership for an employee.

        Args:
            data: Membership creation data

        Returns:
            Created membership

        Raises:
            ConflictException: If membership already exists
        """
        # Check if membership already exists
        existing = (
            self.client.table(self.table)
            .select("id")
            .eq("employee_id", data.employee_id)
            .eq("company_id", data.company_id)
            .execute()
        )
        if existing.data:
            raise ConflictException(
                message="Employee already has a membership with this company",
                error_code="MEMBERSHIP_EXISTS",
            )

        # Check if this should be primary (first membership)
        existing_memberships = (
            self.client.table(self.table)
            .select("id")
            .eq("employee_id", data.employee_id)
            .execute()
        )
        is_first = len(existing_memberships.data) == 0

        # Prepare insert data
        insert_data = data.model_dump()
        if is_first:
            insert_data["is_primary"] = True

        # Create membership
        result = self.client.table(self.table).insert(insert_data).execute()

        return MembershipResponse(**result.data[0])

    async def get_by_id(self, membership_id: str) -> MembershipResponse:
        """
        Get membership by ID.

        Args:
            membership_id: Membership UUID

        Returns:
            Membership data

        Raises:
            NotFoundException: If membership not found
        """
        result = self.client.table(self.table).select("*").eq("id", membership_id).execute()

        if not result.data:
            raise NotFoundException(
                message=f"Membership not found: {membership_id}",
                error_code="MEMBERSHIP_NOT_FOUND",
            )

        return MembershipResponse(**result.data[0])

    async def get_employee_companies(self, employee_id: str) -> EmployeeCompaniesResponse:
        """
        Get all companies an employee belongs to.

        Args:
            employee_id: Employee UUID

        Returns:
            List of memberships with company details
        """
        # Query memberships with company join
        result = (
            self.client.table(self.table)
            .select("""
                *,
                companies (
                    id,
                    name,
                    slug,
                    email,
                    vault_address,
                    vault_deployed_at,
                    status
                )
            """)
            .eq("employee_id", employee_id)
            .order("is_primary", desc=True)
            .order("joined_at", desc=False)
            .execute()
        )

        memberships = []
        primary_company_id = None

        for m in result.data:
            company = m.get("companies", {})
            membership = MembershipWithCompany(
                id=m["id"],
                employee_id=m["employee_id"],
                company_id=m["company_id"],
                role=m["role"],
                status=m["status"],
                wallet_address=m.get("wallet_address"),
                department=m.get("department"),
                employee_number=m.get("employee_number"),
                is_primary=m.get("is_primary", False),
                notifications_enabled=m.get("notifications_enabled", True),
                joined_at=m["joined_at"],
                updated_at=m["updated_at"],
                company_name=company.get("name", "Unknown"),
                company_slug=company.get("slug", ""),
                company_email=company.get("email"),
                vault_address=company.get("vault_address"),
                vault_deployed_at=company.get("vault_deployed_at"),
            )
            memberships.append(membership)
            
            if m.get("is_primary"):
                primary_company_id = m["company_id"]

        return EmployeeCompaniesResponse(
            memberships=memberships,
            primary_company_id=primary_company_id,
            total_companies=len(memberships),
        )

    async def get_membership(
        self, employee_id: str, company_id: str
    ) -> MembershipWithCompany | None:
        """
        Get specific membership for an employee-company pair.

        Args:
            employee_id: Employee UUID
            company_id: Company UUID

        Returns:
            Membership with company details or None
        """
        result = (
            self.client.table(self.table)
            .select("""
                *,
                companies (
                    id,
                    name,
                    slug,
                    email,
                    vault_address,
                    vault_deployed_at,
                    status
                )
            """)
            .eq("employee_id", employee_id)
            .eq("company_id", company_id)
            .execute()
        )

        if not result.data:
            return None

        m = result.data[0]
        company = m.get("companies", {})

        return MembershipWithCompany(
            id=m["id"],
            employee_id=m["employee_id"],
            company_id=m["company_id"],
            role=m["role"],
            status=m["status"],
            wallet_address=m.get("wallet_address"),
            department=m.get("department"),
            employee_number=m.get("employee_number"),
            is_primary=m.get("is_primary", False),
            notifications_enabled=m.get("notifications_enabled", True),
            joined_at=m["joined_at"],
            updated_at=m["updated_at"],
            company_name=company.get("name", "Unknown"),
            company_slug=company.get("slug", ""),
            company_email=company.get("email"),
            vault_address=company.get("vault_address"),
            vault_deployed_at=company.get("vault_deployed_at"),
        )

    async def switch_company(
        self, employee_id: str, company_id: str, set_as_primary: bool = False
    ) -> SwitchCompanyResponse:
        """
        Switch employee's active company context.

        Args:
            employee_id: Employee UUID
            company_id: Company UUID to switch to
            set_as_primary: Whether to set this as primary company

        Returns:
            Switch response with new active membership
        """
        # Verify membership exists
        membership = await self.get_membership(employee_id, company_id)
        if not membership:
            raise NotFoundException(
                message="You don't have membership with this company",
                error_code="MEMBERSHIP_NOT_FOUND",
            )

        # Check membership is active
        if membership.status != "active":
            raise ForbiddenException(
                message=f"Your membership with {membership.company_name} is {membership.status}",
                error_code="MEMBERSHIP_NOT_ACTIVE",
            )

        # Optionally set as primary
        if set_as_primary and not membership.is_primary:
            await self.set_primary_company(employee_id, company_id)
            membership.is_primary = True

        return SwitchCompanyResponse(
            success=True,
            membership=membership,
            message=f"Switched to {membership.company_name}",
        )

    async def set_primary_company(self, employee_id: str, company_id: str) -> bool:
        """
        Set a company as the employee's primary company.

        Args:
            employee_id: Employee UUID
            company_id: Company UUID

        Returns:
            True if successful
        """
        # Remove primary from all memberships
        self.client.table(self.table).update(
            {"is_primary": False}
        ).eq("employee_id", employee_id).execute()

        # Set new primary
        result = (
            self.client.table(self.table)
            .update({"is_primary": True})
            .eq("employee_id", employee_id)
            .eq("company_id", company_id)
            .execute()
        )

        return len(result.data) > 0

    async def update(
        self, membership_id: str, data: MembershipUpdate
    ) -> MembershipResponse:
        """
        Update membership details.

        Args:
            membership_id: Membership UUID
            data: Update data

        Returns:
            Updated membership
        """
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}

        if not update_data:
            return await self.get_by_id(membership_id)

        result = (
            self.client.table(self.table)
            .update(update_data)
            .eq("id", membership_id)
            .execute()
        )

        if not result.data:
            raise NotFoundException(
                message=f"Membership not found: {membership_id}",
                error_code="MEMBERSHIP_NOT_FOUND",
            )

        return MembershipResponse(**result.data[0])

    async def join_company_by_slug(
        self, employee_id: str, company_slug: str, wallet_address: str | None = None
    ) -> MembershipWithCompany:
        """
        Request to join a company by its slug.

        Args:
            employee_id: Employee UUID
            company_slug: Company slug
            wallet_address: Optional wallet address for this company

        Returns:
            Created membership (pending approval)
        """
        # Find company by slug
        company_result = (
            self.client.table("companies")
            .select("*")
            .eq("slug", company_slug)
            .execute()
        )

        if not company_result.data:
            raise NotFoundException(
                message=f"Company not found: {company_slug}",
                error_code="COMPANY_NOT_FOUND",
            )

        company = company_result.data[0]

        # Check if already a member
        existing = await self.get_membership(employee_id, company["id"])
        if existing:
            raise ConflictException(
                message=f"You already have membership with {company['name']}",
                error_code="MEMBERSHIP_EXISTS",
            )

        # Create pending membership
        membership_data = MembershipCreate(
            employee_id=employee_id,
            company_id=company["id"],
            role="employee",
            status="pending",
            wallet_address=wallet_address,
        )

        await self.create(membership_data)

        # Return full membership with company
        return await self.get_membership(employee_id, company["id"])

    async def leave_company(self, employee_id: str, company_id: str) -> bool:
        """
        Remove membership from a company.

        Args:
            employee_id: Employee UUID
            company_id: Company UUID

        Returns:
            True if successful
        """
        # Check if this is the only membership
        memberships = await self.get_employee_companies(employee_id)
        if memberships.total_companies <= 1:
            raise ForbiddenException(
                message="Cannot leave your only company. You must belong to at least one company.",
                error_code="CANNOT_LEAVE_ONLY_COMPANY",
            )

        # Delete membership
        result = (
            self.client.table(self.table)
            .delete()
            .eq("employee_id", employee_id)
            .eq("company_id", company_id)
            .execute()
        )

        if len(result.data) > 0:
            # If this was primary, set another as primary
            remaining = await self.get_employee_companies(employee_id)
            if remaining.memberships and not remaining.primary_company_id:
                await self.set_primary_company(
                    employee_id, remaining.memberships[0].company_id
                )

        return len(result.data) > 0

    async def list_company_members(
        self,
        company_id: str,
        page: int = 1,
        limit: int = 20,
        status: str | None = None,
    ) -> tuple[list[MembershipResponse], int]:
        """
        List all members of a company.

        Args:
            company_id: Company UUID
            page: Page number
            limit: Items per page
            status: Filter by status

        Returns:
            Tuple of (memberships, total_count)
        """
        offset = (page - 1) * limit

        # Build query
        query = self.client.table(self.table).select(
            """
            *,
            employees (
                id,
                name,
                email
            )
            """,
            count="exact"
        ).eq("company_id", company_id)

        if status:
            query = query.eq("status", status)

        # Get count
        count_result = query.execute()
        total = count_result.count or 0

        # Get paginated data
        query = (
            self.client.table(self.table)
            .select("""
                *,
                employees (
                    id,
                    name,
                    email
                )
            """)
            .eq("company_id", company_id)
            .order("joined_at", desc=True)
            .range(offset, offset + limit - 1)
        )

        if status:
            query = query.eq("status", status)

        result = query.execute()
        memberships = [MembershipResponse(**m) for m in result.data]

        return memberships, total


# Singleton instance
membership_service = MembershipService()


async def get_employee_active_company(employee_id: str, company_id: str | None = None):
    """
    Get employee's active company context.
    
    If company_id is provided, verify membership and return that company.
    Otherwise return the primary company.
    """
    if company_id:
        membership = await membership_service.get_membership(employee_id, company_id)
        if not membership:
            raise NotFoundException(
                message="No membership found for this company",
                error_code="MEMBERSHIP_NOT_FOUND",
            )
        return membership
    
    # Get primary company
    companies = await membership_service.get_employee_companies(employee_id)
    if not companies.memberships:
        raise NotFoundException(
            message="Employee has no company memberships",
            error_code="NO_MEMBERSHIPS",
        )
    
    # Return primary or first
    for m in companies.memberships:
        if m.is_primary:
            return m
    
    return companies.memberships[0]
