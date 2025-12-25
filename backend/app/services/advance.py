"""
Advance Service for employee expense advances.

Manages credit lines, advance requests, and fee calculations.
"""

from typing import Any, Literal
from datetime import datetime
from decimal import Decimal
import uuid
import logging

from app.db.dependencies import get_supabase_client
from app.services.ledger import ledger_service

logger = logging.getLogger(__name__)


AdvanceStatus = Literal["pending", "approved", "rejected", "disbursed", "settled"]


class AdvanceService:
    """
    Service for managing employee expense advances.
    
    Allows employees to get advances on expenses before receipt submission.
    """
    
    # Default configuration
    DEFAULT_CREDIT_LIMIT_USD = 10000
    DEFAULT_FEE_BPS = 150  # 1.5%
    
    async def get_company_advance_config(
        self,
        company_id: str,
    ) -> dict[str, Any]:
        """
        Get advance configuration for a company.
        
        Returns default config if none exists.
        """
        client = get_supabase_client()
        
        result = (
            client.table("advance_configs")
            .select("*")
            .eq("company_id", company_id)
            .single()
            .execute()
        )
        
        if result.data:
            return result.data
        
        # Return default config
        return {
            "company_id": company_id,
            "credit_limit_usd": self.DEFAULT_CREDIT_LIMIT_USD,
            "utilization_usd": 0,
            "fee_bps": self.DEFAULT_FEE_BPS,
            "enabled": True,
        }
    
    async def update_company_advance_config(
        self,
        company_id: str,
        credit_limit_usd: float | None = None,
        fee_bps: int | None = None,
        enabled: bool | None = None,
    ) -> dict[str, Any]:
        """
        Update advance configuration for a company.
        
        Creates the config if it doesn't exist.
        """
        client = get_supabase_client()
        
        # Get existing config
        existing = await self.get_company_advance_config(company_id)
        
        update_data = {
            "company_id": company_id,
            "credit_limit_usd": credit_limit_usd if credit_limit_usd is not None else existing.get("credit_limit_usd", self.DEFAULT_CREDIT_LIMIT_USD),
            "fee_bps": fee_bps if fee_bps is not None else existing.get("fee_bps", self.DEFAULT_FEE_BPS),
            "enabled": enabled if enabled is not None else existing.get("enabled", True),
            "updated_at": datetime.utcnow().isoformat(),
        }
        
        # Upsert the config
        result = (
            client.table("advance_configs")
            .upsert(update_data, on_conflict="company_id")
            .execute()
        )
        
        if result.data:
            return result.data[0]
        
        raise Exception("Failed to update advance config")
    
    async def request_advance(
        self,
        company_id: str,
        employee_id: str,
        amount_usd: Decimal,
        reason: str | None = None,
    ) -> dict[str, Any]:
        """
        Request an advance for an employee.
        
        Args:
            company_id: Company ID
            employee_id: Employee ID
            amount_usd: Requested advance amount
            reason: Optional reason for the advance
            
        Returns:
            Dict with approval decision and details
        """
        # Get company config
        config = await self.get_company_advance_config(company_id)
        
        # Check if advances are enabled
        if not config.get("enabled", True):
            return {
                "approved": False,
                "reason": "Advances are currently disabled for this company",
            }
        
        # Check credit limit
        credit_limit = Decimal(str(config.get("credit_limit_usd", self.DEFAULT_CREDIT_LIMIT_USD)))
        current_utilization = Decimal(str(config.get("utilization_usd", 0)))
        new_utilization = current_utilization + amount_usd
        
        if new_utilization > credit_limit:
            available = credit_limit - current_utilization
            return {
                "approved": False,
                "reason": f"Insufficient credit. Available: ${available:.2f}",
                "available_credit_usd": float(available),
            }
        
        # Calculate fee
        fee_bps = config.get("fee_bps", self.DEFAULT_FEE_BPS)
        fee_usd = (amount_usd * fee_bps) / 10000
        
        # Create advance request
        client = get_supabase_client()
        
        advance_data = {
            "id": str(uuid.uuid4()),
            "company_id": company_id,
            "employee_id": employee_id,
            "amount_usd": float(amount_usd),
            "fee_usd": float(fee_usd),
            "reason": reason,
            "status": "approved",
            "created_at": datetime.utcnow().isoformat(),
        }
        
        result = client.table("advance_requests").insert(advance_data).execute()
        
        if not result.data:
            raise Exception("Failed to create advance request")
        
        advance = result.data[0]
        
        # Update utilization
        await self._update_utilization(company_id, amount_usd)
        
        # Create ledger entry
        await ledger_service.create_entry(
            company_id=company_id,
            employee_id=employee_id,
            amount_usd=amount_usd,
            fee_usd=fee_usd,
            entry_type="advance",
            reference_id=advance["id"],
            reference_type="advance_request",
        )
        
        logger.info(
            f"Advance approved: ${amount_usd} for employee {employee_id} "
            f"(fee: ${fee_usd})"
        )
        
        return {
            "approved": True,
            "advance_id": advance["id"],
            "amount_usd": float(amount_usd),
            "fee_usd": float(fee_usd),
            "total_usd": float(amount_usd + fee_usd),
        }
    
    async def _update_utilization(
        self,
        company_id: str,
        amount_change: Decimal,
    ):
        """Update the credit utilization for a company."""
        client = get_supabase_client()
        
        # Get current config
        config = await self.get_company_advance_config(company_id)
        current_utilization = Decimal(str(config.get("utilization_usd", 0)))
        new_utilization = max(Decimal("0"), current_utilization + amount_change)
        
        # Update utilization
        client.table("advance_configs").upsert(
            {
                "company_id": company_id,
                "utilization_usd": float(new_utilization),
                "updated_at": datetime.utcnow().isoformat(),
            },
            on_conflict="company_id"
        ).execute()
    
    async def get_advance(self, advance_id: str) -> dict[str, Any] | None:
        """Get an advance by ID."""
        client = get_supabase_client()
        
        result = (
            client.table("advance_requests")
            .select("*")
            .eq("id", advance_id)
            .single()
            .execute()
        )
        
        return result.data
    
    async def update_advance_status(
        self,
        advance_id: str,
        status: AdvanceStatus,
    ) -> dict[str, Any]:
        """Update the status of an advance."""
        client = get_supabase_client()
        
        update_data = {
            "status": status,
            "updated_at": datetime.utcnow().isoformat(),
        }
        
        if status == "settled":
            update_data["settled_at"] = datetime.utcnow().isoformat()
            
            # Reduce utilization when settled
            advance = await self.get_advance(advance_id)
            if advance:
                amount = Decimal(str(advance.get("amount_usd", 0)))
                await self._update_utilization(advance["company_id"], -amount)
        
        result = (
            client.table("advance_requests")
            .update(update_data)
            .eq("id", advance_id)
            .execute()
        )
        
        if result.data:
            return result.data[0]
        
        raise Exception(f"Failed to update advance {advance_id}")
    
    async def get_employee_advances(
        self,
        employee_id: str,
        status: AdvanceStatus | None = None,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        """Get advances for an employee."""
        client = get_supabase_client()
        
        query = (
            client.table("advance_requests")
            .select("*")
            .eq("employee_id", employee_id)
            .order("created_at", desc=True)
            .limit(limit)
        )
        
        if status:
            query = query.eq("status", status)
        
        result = query.execute()
        return result.data or []
    
    async def get_company_advances(
        self,
        company_id: str,
        status: AdvanceStatus | None = None,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        """Get advances for a company."""
        client = get_supabase_client()
        
        query = (
            client.table("advance_requests")
            .select("*")
            .eq("company_id", company_id)
            .order("created_at", desc=True)
            .limit(limit)
        )
        
        if status:
            query = query.eq("status", status)
        
        result = query.execute()
        return result.data or []


# Singleton instance
advance_service = AdvanceService()
