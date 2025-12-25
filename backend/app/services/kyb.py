"""
KYB (Know Your Business) Service for company verification.

Handles company onboarding verification flow.
"""

from typing import Any, Literal
from datetime import datetime
import uuid
import logging

from app.db.dependencies import get_supabase_client

logger = logging.getLogger(__name__)


KYBStatus = Literal["unsubmitted", "pending", "approved", "rejected", "under_review"]


class KYBService:
    """
    Service for managing KYB (Know Your Business) verification.
    
    Companies must complete KYB verification before they can use
    the full features of the platform.
    """
    
    async def get_kyb_status(self, company_id: str) -> dict[str, Any]:
        """
        Get KYB status and data for a company.
        
        Returns:
            Dict with status and submitted data
        """
        client = get_supabase_client()
        
        result = (
            client.table("kyb_submissions")
            .select("*")
            .eq("company_id", company_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        
        if result.data:
            return result.data[0]
        
        # No submission found
        return {
            "company_id": company_id,
            "status": "unsubmitted",
            "data": {},
        }
    
    async def submit_kyb(
        self,
        company_id: str,
        company_name: str,
        registration_number: str | None = None,
        country: str | None = None,
        contact_email: str | None = None,
        contact_phone: str | None = None,
        address: str | None = None,
        business_type: str | None = None,
        tax_id: str | None = None,
        bank_account_last4: str | None = None,
        documents: list[str] | None = None,
    ) -> dict[str, Any]:
        """
        Submit KYB verification data.
        
        Args:
            company_id: Company ID
            company_name: Legal company name
            registration_number: Business registration number
            country: Country of incorporation
            contact_email: Primary contact email
            contact_phone: Primary contact phone
            address: Business address
            business_type: Type of business
            tax_id: Tax identification number
            bank_account_last4: Last 4 digits of bank account
            documents: List of document file paths
            
        Returns:
            Created KYB submission
        """
        client = get_supabase_client()
        
        # Check for existing submission
        existing = await self.get_kyb_status(company_id)
        
        if existing.get("status") in ["pending", "approved"]:
            raise ValueError(
                f"KYB submission already exists with status: {existing['status']}"
            )
        
        submission_data = {
            "id": str(uuid.uuid4()),
            "company_id": company_id,
            "status": "pending",
            "data": {
                "company_name": company_name,
                "registration_number": registration_number,
                "country": country,
                "contact_email": contact_email,
                "contact_phone": contact_phone,
                "address": address,
                "business_type": business_type,
                "tax_id": tax_id,
                "bank_account_last4": bank_account_last4,
            },
            "documents": documents or [],
            "created_at": datetime.utcnow().isoformat(),
        }
        
        result = client.table("kyb_submissions").insert(submission_data).execute()
        
        if result.data:
            logger.info(f"KYB submission created for company {company_id}")
            return result.data[0]
        
        raise Exception("Failed to create KYB submission")
    
    async def update_kyb_status(
        self,
        submission_id: str,
        status: KYBStatus,
        reviewer_notes: str | None = None,
    ) -> dict[str, Any]:
        """
        Update KYB submission status (admin operation).
        
        Args:
            submission_id: KYB submission ID
            status: New status
            reviewer_notes: Notes from reviewer
            
        Returns:
            Updated KYB submission
        """
        client = get_supabase_client()
        
        update_data: dict[str, Any] = {
            "status": status,
            "updated_at": datetime.utcnow().isoformat(),
        }
        
        if reviewer_notes:
            update_data["reviewer_notes"] = reviewer_notes
        
        if status in ["approved", "rejected"]:
            update_data["reviewed_at"] = datetime.utcnow().isoformat()
        
        result = (
            client.table("kyb_submissions")
            .update(update_data)
            .eq("id", submission_id)
            .execute()
        )
        
        if result.data:
            logger.info(f"KYB submission {submission_id} updated to status: {status}")
            return result.data[0]
        
        raise Exception(f"Failed to update KYB submission {submission_id}")
    
    async def update_kyb_data(
        self,
        company_id: str,
        **kwargs,
    ) -> dict[str, Any]:
        """
        Update KYB data for resubmission.
        
        Only allowed when status is 'rejected' or 'unsubmitted'.
        """
        client = get_supabase_client()
        
        # Get existing submission
        existing = await self.get_kyb_status(company_id)
        
        if existing.get("status") not in ["unsubmitted", "rejected"]:
            raise ValueError(
                f"Cannot update KYB data with status: {existing['status']}"
            )
        
        # Merge existing data with updates
        existing_data = existing.get("data", {})
        for key, value in kwargs.items():
            if value is not None:
                existing_data[key] = value
        
        if existing.get("status") == "unsubmitted":
            # Create new submission
            return await self.submit_kyb(
                company_id=company_id,
                **existing_data,
            )
        
        # Update existing submission
        update_data = {
            "data": existing_data,
            "status": "pending",  # Reset to pending on resubmission
            "updated_at": datetime.utcnow().isoformat(),
        }
        
        result = (
            client.table("kyb_submissions")
            .update(update_data)
            .eq("id", existing["id"])
            .execute()
        )
        
        if result.data:
            return result.data[0]
        
        raise Exception("Failed to update KYB data")
    
    async def get_pending_submissions(
        self,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        """Get all pending KYB submissions (admin operation)."""
        client = get_supabase_client()
        
        result = (
            client.table("kyb_submissions")
            .select("*")
            .eq("status", "pending")
            .order("created_at", desc=False)  # Oldest first
            .limit(limit)
            .execute()
        )
        
        return result.data or []
    
    async def is_company_verified(self, company_id: str) -> bool:
        """Check if a company has been KYB verified."""
        status = await self.get_kyb_status(company_id)
        return status.get("status") == "approved"


# Singleton instance
kyb_service = KYBService()
