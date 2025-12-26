"""
Policy Service
==============
Business logic for expense policy operations.
"""

from supabase import Client

from app.core.exceptions import ConflictException, NotFoundException
from app.db.supabase import get_supabase_admin_client
from app.schemas.policy import (
    PolicyCreate,
    PolicyResponse,
    PolicyUpdate,
)


class PolicyService:
    """Service for managing expense policies."""

    def __init__(self, client: Client | None = None):
        """Initialize with Supabase client."""
        self.client = client or get_supabase_admin_client()
        self.table = "policies"

    async def create(self, data: PolicyCreate) -> PolicyResponse:
        """
        Create a new policy.

        Args:
            data: Policy creation data

        Returns:
            Created policy
        """
        # If this is active, deactivate other policies for this company
        if True:  # New policies are active by default
            self.client.table(self.table).update(
                {"is_active": False}
            ).eq("company_id", data.company_id).execute()

        result = (
            self.client.table(self.table)
            .insert({**data.model_dump(), "is_active": True})
            .execute()
        )

        return PolicyResponse(**result.data[0])

    async def get_by_id(self, policy_id: str) -> PolicyResponse:
        """
        Get policy by ID.

        Args:
            policy_id: Policy UUID

        Returns:
            Policy data

        Raises:
            NotFoundException: If policy not found
        """
        result = (
            self.client.table(self.table)
            .select("*")
            .eq("id", policy_id)
            .execute()
        )

        if not result.data:
            raise NotFoundException(
                message=f"Policy not found: {policy_id}",
                error_code="POLICY_NOT_FOUND",
            )

        return PolicyResponse(**result.data[0])

    async def get_active_for_company(self, company_id: str) -> PolicyResponse:
        """
        Get the active policy for a company.

        Args:
            company_id: Company UUID

        Returns:
            Active policy

        Raises:
            NotFoundException: If no active policy found
        """
        result = (
            self.client.table(self.table)
            .select("*")
            .eq("company_id", company_id)
            .eq("is_active", True)
            .execute()
        )

        if not result.data:
            raise NotFoundException(
                message=f"No active policy found for company: {company_id}",
                error_code="POLICY_NOT_FOUND",
            )

        return PolicyResponse(**result.data[0])

    async def update(
        self, policy_id: str, data: PolicyUpdate
    ) -> PolicyResponse:
        """
        Update policy details.

        Args:
            policy_id: Policy UUID
            data: Update data

        Returns:
            Updated policy
        """
        # Get current policy to check company
        current = await self.get_by_id(policy_id)

        # Filter out None values
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}

        if not update_data:
            return current

        # If activating this policy, deactivate others
        if update_data.get("is_active"):
            self.client.table(self.table).update(
                {"is_active": False}
            ).eq("company_id", current.company_id).neq("id", policy_id).execute()

        result = (
            self.client.table(self.table)
            .update(update_data)
            .eq("id", policy_id)
            .execute()
        )

        if not result.data:
            raise NotFoundException(
                message=f"Policy not found: {policy_id}",
                error_code="POLICY_NOT_FOUND",
            )

        return PolicyResponse(**result.data[0])

    async def list_by_company(
        self, company_id: str
    ) -> list[PolicyResponse]:
        """
        List all policies for a company.

        Args:
            company_id: Company UUID

        Returns:
            List of policies
        """
        result = (
            self.client.table(self.table)
            .select("*")
            .eq("company_id", company_id)
            .order("created_at", desc=True)
            .execute()
        )

        return [PolicyResponse(**p) for p in result.data]

    async def delete(self, policy_id: str) -> bool:
        """
        Delete a policy.

        Args:
            policy_id: Policy UUID

        Returns:
            True if deleted
        """
        result = (
            self.client.table(self.table)
            .delete()
            .eq("id", policy_id)
            .execute()
        )

        return len(result.data) > 0


# Module-level helper function
_service_instance: PolicyService | None = None


def _get_service() -> PolicyService:
    """Get or create the service instance."""
    global _service_instance
    if _service_instance is None:
        _service_instance = PolicyService()
    return _service_instance


async def get_policy_by_company(company_id: str) -> dict | None:
    """Get active policy for a company (helper function)."""
    try:
        service = _get_service()
        policy = await service.get_active_for_company(company_id)
        return policy.model_dump()
    except NotFoundException:
        return None


# Export singleton service
policy_service = _get_service()
