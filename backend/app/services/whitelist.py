"""
Wallet Whitelist Service for managing allowed wallet addresses.

Database-backed wallet whitelist for payout authorization.
"""

from typing import Any
from datetime import datetime
import uuid
import logging

from app.db.dependencies import get_supabase_client

logger = logging.getLogger(__name__)


class WhitelistService:
    """
    Service for managing whitelisted wallet addresses.
    
    Only whitelisted wallets can receive payouts from the treasury.
    """
    
    async def is_wallet_whitelisted(
        self,
        wallet_address: str,
        company_id: str | None = None,
    ) -> bool:
        """
        Check if a wallet address is whitelisted.
        
        Args:
            wallet_address: Wallet address to check
            company_id: Optional company ID to check company-specific whitelist
            
        Returns:
            True if wallet is whitelisted
        """
        client = get_supabase_client()
        
        # Normalize address to lowercase
        address = wallet_address.lower()
        
        # Check global whitelist
        query = (
            client.table("wallet_whitelist")
            .select("id")
            .eq("wallet_address", address)
            .eq("is_active", True)
        )
        
        if company_id:
            # Check company-specific or global
            query = query.or_(f"company_id.eq.{company_id},company_id.is.null")
        
        result = query.limit(1).execute()
        
        return len(result.data or []) > 0
    
    async def add_wallet(
        self,
        wallet_address: str,
        company_id: str | None = None,
        employee_id: str | None = None,
        label: str | None = None,
        added_by: str | None = None,
    ) -> dict[str, Any]:
        """
        Add a wallet to the whitelist.
        
        Args:
            wallet_address: Wallet address to whitelist
            company_id: Company ID (None for global whitelist)
            employee_id: Employee ID (if wallet belongs to an employee)
            label: Human-readable label
            added_by: User ID who added the wallet
            
        Returns:
            Created whitelist entry
        """
        client = get_supabase_client()
        
        # Normalize address
        address = wallet_address.lower()
        
        # Check if already exists
        existing = (
            client.table("wallet_whitelist")
            .select("id")
            .eq("wallet_address", address)
            .eq("company_id", company_id)
            .execute()
        )
        
        if existing.data:
            # Reactivate if exists but inactive
            result = (
                client.table("wallet_whitelist")
                .update({
                    "is_active": True,
                    "updated_at": datetime.utcnow().isoformat(),
                })
                .eq("id", existing.data[0]["id"])
                .execute()
            )
            if result.data:
                return result.data[0]
            raise Exception("Failed to reactivate wallet")
        
        # Create new entry
        entry_data = {
            "id": str(uuid.uuid4()),
            "wallet_address": address,
            "company_id": company_id,
            "employee_id": employee_id,
            "label": label,
            "added_by": added_by,
            "is_active": True,
            "created_at": datetime.utcnow().isoformat(),
        }
        
        result = client.table("wallet_whitelist").insert(entry_data).execute()
        
        if result.data:
            logger.info(f"Wallet {address} added to whitelist")
            return result.data[0]
        
        raise Exception("Failed to add wallet to whitelist")
    
    async def remove_wallet(
        self,
        wallet_address: str,
        company_id: str | None = None,
    ) -> bool:
        """
        Remove a wallet from the whitelist (soft delete).
        
        Args:
            wallet_address: Wallet address to remove
            company_id: Company ID (None for global whitelist)
            
        Returns:
            True if wallet was removed
        """
        client = get_supabase_client()
        
        address = wallet_address.lower()
        
        query = (
            client.table("wallet_whitelist")
            .update({
                "is_active": False,
                "updated_at": datetime.utcnow().isoformat(),
            })
            .eq("wallet_address", address)
        )
        
        if company_id:
            query = query.eq("company_id", company_id)
        
        result = query.execute()
        
        if result.data:
            logger.info(f"Wallet {address} removed from whitelist")
            return True
        
        return False
    
    async def get_company_whitelist(
        self,
        company_id: str,
        include_global: bool = True,
    ) -> list[dict[str, Any]]:
        """
        Get whitelisted wallets for a company.
        
        Args:
            company_id: Company ID
            include_global: Include global whitelist entries
            
        Returns:
            List of whitelist entries
        """
        client = get_supabase_client()
        
        query = (
            client.table("wallet_whitelist")
            .select("*")
            .eq("is_active", True)
        )
        
        if include_global:
            query = query.or_(f"company_id.eq.{company_id},company_id.is.null")
        else:
            query = query.eq("company_id", company_id)
        
        result = query.order("created_at", desc=True).execute()
        
        return result.data or []
    
    async def get_employee_wallet(
        self,
        employee_id: str,
    ) -> dict[str, Any] | None:
        """Get whitelisted wallet for an employee."""
        client = get_supabase_client()
        
        result = (
            client.table("wallet_whitelist")
            .select("*")
            .eq("employee_id", employee_id)
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        
        if result.data:
            return result.data[0]
        
        return None
    
    async def get_global_whitelist(self) -> list[dict[str, Any]]:
        """Get global whitelist (admin operation)."""
        client = get_supabase_client()
        
        result = (
            client.table("wallet_whitelist")
            .select("*")
            .is_("company_id", "null")
            .eq("is_active", True)
            .order("created_at", desc=True)
            .execute()
        )
        
        return result.data or []


# Singleton instance
whitelist_service = WhitelistService()
