"""
Billing/Metering Service for tracking usage and fees.

Handles audit counting, fee calculation, and usage tracking per company.
"""

from typing import Any, Literal
from datetime import datetime, timedelta
from decimal import Decimal
import uuid
import logging

from app.db.dependencies import get_supabase_client

logger = logging.getLogger(__name__)


BillingPeriod = Literal["daily", "weekly", "monthly"]


class BillingService:
    """
    Service for tracking usage and calculating fees.
    
    Tracks:
    - Number of audits performed
    - Credit/advance usage
    - Platform fees
    - Payout volumes
    """
    
    # Fee configuration
    AUDIT_FEE_USD = Decimal("0.05")  # $0.05 per audit
    ADVANCE_FEE_BPS = 150  # 1.5% on advances
    PLATFORM_FEE_BPS = 50  # 0.5% on payouts
    
    async def record_audit_usage(
        self,
        company_id: str,
        receipt_id: str | None = None,
        success: bool = True,
        tokens_used: int = 0,
    ) -> dict[str, Any]:
        """
        Record an audit request for billing purposes.
        
        Args:
            company_id: Company ID
            receipt_id: Associated receipt ID
            success: Whether the audit succeeded
            tokens_used: AI tokens consumed
            
        Returns:
            Created usage record
        """
        client = get_supabase_client()
        
        usage_data = {
            "id": str(uuid.uuid4()),
            "company_id": company_id,
            "usage_type": "audit",
            "quantity": 1,
            "unit_price_usd": float(self.AUDIT_FEE_USD),
            "total_usd": float(self.AUDIT_FEE_USD),
            "metadata": {
                "receipt_id": receipt_id,
                "success": success,
                "tokens_used": tokens_used,
            },
            "created_at": datetime.utcnow().isoformat(),
        }
        
        result = client.table("usage_records").insert(usage_data).execute()
        
        if result.data:
            logger.info(f"Audit usage recorded for company {company_id}")
            return result.data[0]
        
        raise Exception("Failed to record audit usage")
    
    async def record_payout_usage(
        self,
        company_id: str,
        payout_amount_usd: Decimal,
        receipt_id: str | None = None,
    ) -> dict[str, Any]:
        """
        Record a payout for billing (platform fee calculation).
        
        Args:
            company_id: Company ID
            payout_amount_usd: Payout amount
            receipt_id: Associated receipt ID
            
        Returns:
            Created usage record
        """
        client = get_supabase_client()
        
        platform_fee = (payout_amount_usd * self.PLATFORM_FEE_BPS) / 10000
        
        usage_data = {
            "id": str(uuid.uuid4()),
            "company_id": company_id,
            "usage_type": "payout",
            "quantity": 1,
            "unit_price_usd": float(payout_amount_usd),
            "total_usd": float(platform_fee),
            "metadata": {
                "receipt_id": receipt_id,
                "payout_amount_usd": float(payout_amount_usd),
                "fee_bps": self.PLATFORM_FEE_BPS,
            },
            "created_at": datetime.utcnow().isoformat(),
        }
        
        result = client.table("usage_records").insert(usage_data).execute()
        
        if result.data:
            return result.data[0]
        
        raise Exception("Failed to record payout usage")
    
    async def record_advance_usage(
        self,
        company_id: str,
        advance_amount_usd: Decimal,
        fee_usd: Decimal,
        advance_id: str,
    ) -> dict[str, Any]:
        """
        Record an advance for billing.
        
        Args:
            company_id: Company ID
            advance_amount_usd: Advance principal
            fee_usd: Advance fee charged
            advance_id: Advance request ID
            
        Returns:
            Created usage record
        """
        client = get_supabase_client()
        
        usage_data = {
            "id": str(uuid.uuid4()),
            "company_id": company_id,
            "usage_type": "advance",
            "quantity": 1,
            "unit_price_usd": float(advance_amount_usd),
            "total_usd": float(fee_usd),
            "metadata": {
                "advance_id": advance_id,
                "advance_amount_usd": float(advance_amount_usd),
            },
            "created_at": datetime.utcnow().isoformat(),
        }
        
        result = client.table("usage_records").insert(usage_data).execute()
        
        if result.data:
            return result.data[0]
        
        raise Exception("Failed to record advance usage")
    
    async def get_company_usage(
        self,
        company_id: str,
        period: BillingPeriod = "monthly",
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> dict[str, Any]:
        """
        Get usage summary for a company.
        
        Args:
            company_id: Company ID
            period: Billing period
            start_date: Start of period (defaults to current period)
            end_date: End of period
            
        Returns:
            Usage summary with totals by type
        """
        client = get_supabase_client()
        
        # Calculate date range
        if not end_date:
            end_date = datetime.utcnow()
        
        if not start_date:
            if period == "daily":
                start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
            elif period == "weekly":
                start_date = end_date - timedelta(days=end_date.weekday())
                start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            else:  # monthly
                start_date = end_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Fetch usage records
        result = (
            client.table("usage_records")
            .select("*")
            .eq("company_id", company_id)
            .gte("created_at", start_date.isoformat())
            .lte("created_at", end_date.isoformat())
            .execute()
        )
        
        records = result.data or []
        
        # Aggregate by type
        summary = {
            "company_id": company_id,
            "period": period,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "audit": {"count": 0, "total_usd": Decimal("0")},
            "payout": {"count": 0, "volume_usd": Decimal("0"), "fees_usd": Decimal("0")},
            "advance": {"count": 0, "volume_usd": Decimal("0"), "fees_usd": Decimal("0")},
            "total_fees_usd": Decimal("0"),
        }
        
        for record in records:
            usage_type = record.get("usage_type")
            total = Decimal(str(record.get("total_usd", 0)))
            
            if usage_type == "audit":
                summary["audit"]["count"] += 1
                summary["audit"]["total_usd"] += total
            elif usage_type == "payout":
                summary["payout"]["count"] += 1
                summary["payout"]["volume_usd"] += Decimal(str(record.get("unit_price_usd", 0)))
                summary["payout"]["fees_usd"] += total
            elif usage_type == "advance":
                summary["advance"]["count"] += 1
                summary["advance"]["volume_usd"] += Decimal(str(record.get("unit_price_usd", 0)))
                summary["advance"]["fees_usd"] += total
            
            summary["total_fees_usd"] += total
        
        # Convert Decimals to floats
        summary["audit"]["total_usd"] = float(summary["audit"]["total_usd"])
        summary["payout"]["volume_usd"] = float(summary["payout"]["volume_usd"])
        summary["payout"]["fees_usd"] = float(summary["payout"]["fees_usd"])
        summary["advance"]["volume_usd"] = float(summary["advance"]["volume_usd"])
        summary["advance"]["fees_usd"] = float(summary["advance"]["fees_usd"])
        summary["total_fees_usd"] = float(summary["total_fees_usd"])
        
        return summary
    
    async def get_usage_records(
        self,
        company_id: str,
        usage_type: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Get detailed usage records for a company."""
        client = get_supabase_client()
        
        query = (
            client.table("usage_records")
            .select("*")
            .eq("company_id", company_id)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
        )
        
        if usage_type:
            query = query.eq("usage_type", usage_type)
        
        result = query.execute()
        return result.data or []
    
    async def generate_invoice(
        self,
        company_id: str,
        period_start: datetime,
        period_end: datetime,
    ) -> dict[str, Any]:
        """
        Generate an invoice for a billing period.
        
        Args:
            company_id: Company ID
            period_start: Start of billing period
            period_end: End of billing period
            
        Returns:
            Invoice data with line items
        """
        client = get_supabase_client()
        
        # Get usage for period
        usage = await self.get_company_usage(
            company_id=company_id,
            start_date=period_start,
            end_date=period_end,
        )
        
        # Build invoice
        invoice = {
            "id": str(uuid.uuid4()),
            "company_id": company_id,
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
            "status": "draft",
            "line_items": [],
            "subtotal_usd": 0,
            "created_at": datetime.utcnow().isoformat(),
        }
        
        # Add line items
        if usage["audit"]["count"] > 0:
            invoice["line_items"].append({
                "description": f"Receipt Audits ({usage['audit']['count']} audits)",
                "quantity": usage["audit"]["count"],
                "unit_price_usd": float(self.AUDIT_FEE_USD),
                "total_usd": usage["audit"]["total_usd"],
            })
            invoice["subtotal_usd"] += usage["audit"]["total_usd"]
        
        if usage["payout"]["count"] > 0:
            invoice["line_items"].append({
                "description": f"Platform Fee on Payouts (${usage['payout']['volume_usd']:.2f} volume)",
                "quantity": usage["payout"]["count"],
                "unit_price_usd": None,
                "total_usd": usage["payout"]["fees_usd"],
            })
            invoice["subtotal_usd"] += usage["payout"]["fees_usd"]
        
        if usage["advance"]["count"] > 0:
            invoice["line_items"].append({
                "description": f"Advance Fees (${usage['advance']['volume_usd']:.2f} advanced)",
                "quantity": usage["advance"]["count"],
                "unit_price_usd": None,
                "total_usd": usage["advance"]["fees_usd"],
            })
            invoice["subtotal_usd"] += usage["advance"]["fees_usd"]
        
        # Store invoice
        result = client.table("invoices").insert(invoice).execute()
        
        if result.data:
            return result.data[0]
        
        return invoice


# Singleton instance
billing_service = BillingService()
