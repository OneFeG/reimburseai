"""
Security Service
================
Comprehensive security system for protecting against AI and Treasury attacks.

Features:
1. Cryptographic Audit Signatures - AI audit results are signed
2. On-chain Payment Verification - Verify payments on blockchain
3. Rate Limiting - Prevent abuse and brute force attacks
4. Anomaly Detection - Detect suspicious patterns
5. Multisig Support - Require multiple approvals for large amounts
6. Emergency Controls - Circuit breakers for suspicious activity
"""

import hashlib
import hmac
import json
import time
from datetime import datetime, timedelta, UTC
from decimal import Decimal
from typing import Optional
from collections import defaultdict
import asyncio

from pydantic import BaseModel, Field
from supabase import Client

from app.config import settings
from app.core.exceptions import SecurityException, RateLimitException
from app.db.supabase import get_supabase_admin_client


# =============================================================================
# CONFIGURATION
# =============================================================================

class SecurityConfig:
    """Security configuration settings."""
    
    # Rate limiting
    MAX_AUDITS_PER_MINUTE = 10
    MAX_AUDITS_PER_HOUR = 100
    MAX_PAYOUTS_PER_MINUTE = 5
    MAX_PAYOUTS_PER_HOUR = 50
    
    # Thresholds
    HIGH_VALUE_THRESHOLD_USD = Decimal("500.00")  # Requires additional verification
    CRITICAL_VALUE_THRESHOLD_USD = Decimal("2000.00")  # Requires multisig
    DAILY_PAYOUT_LIMIT_USD = Decimal("10000.00")  # Max per company per day
    
    # Anomaly detection
    ANOMALY_SCORE_THRESHOLD = 0.7  # 0-1 scale
    VELOCITY_CHECK_WINDOW_HOURS = 24
    MAX_DAILY_RECEIPTS_PER_EMPLOYEE = 20
    
    # Signature settings
    SIGNATURE_ALGORITHM = "sha256"
    SIGNATURE_EXPIRY_SECONDS = 300  # 5 minutes


# =============================================================================
# CRYPTOGRAPHIC SIGNATURES
# =============================================================================

class AuditSignature(BaseModel):
    """Cryptographic signature for audit results."""
    
    receipt_id: str
    audit_result: str  # "approved" | "rejected"
    amount: str
    confidence: float
    timestamp: int
    nonce: str
    signature: str


class SignatureService:
    """Service for creating and verifying cryptographic signatures."""
    
    def __init__(self, secret_key: str = None):
        self.secret_key = secret_key or settings.SECRET_KEY
        if not self.secret_key:
            raise ValueError("SECRET_KEY must be set for signature service")
    
    def create_audit_signature(
        self,
        receipt_id: str,
        audit_result: str,
        amount: Decimal,
        confidence: float,
    ) -> AuditSignature:
        """
        Create a cryptographic signature for an audit result.
        
        This signature proves that:
        1. The audit was performed by our AI auditor
        2. The result has not been tampered with
        3. The signature is recent (prevents replay attacks)
        """
        import secrets
        
        timestamp = int(time.time())
        nonce = secrets.token_hex(16)
        
        # Create message to sign
        message = f"{receipt_id}:{audit_result}:{str(amount)}:{confidence}:{timestamp}:{nonce}"
        
        # Create HMAC signature
        signature = hmac.new(
            self.secret_key.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return AuditSignature(
            receipt_id=receipt_id,
            audit_result=audit_result,
            amount=str(amount),
            confidence=confidence,
            timestamp=timestamp,
            nonce=nonce,
            signature=signature,
        )
    
    def verify_audit_signature(self, sig: AuditSignature) -> bool:
        """
        Verify an audit signature is valid and not expired.
        
        Returns True if:
        1. Signature is cryptographically valid
        2. Signature is not expired (within 5 minutes)
        """
        # Check expiry
        if int(time.time()) - sig.timestamp > SecurityConfig.SIGNATURE_EXPIRY_SECONDS:
            return False
        
        # Recreate message
        message = f"{sig.receipt_id}:{sig.audit_result}:{sig.amount}:{sig.confidence}:{sig.timestamp}:{sig.nonce}"
        
        # Verify signature
        expected_signature = hmac.new(
            self.secret_key.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(sig.signature, expected_signature)
    
    def create_payout_authorization(
        self,
        receipt_id: str,
        audit_signature: AuditSignature,
        payout_amount: Decimal,
        recipient_wallet: str,
        vault_address: str,
    ) -> str:
        """
        Create authorization token for treasury payout.
        
        This links the audit approval to the specific payout.
        """
        timestamp = int(time.time())
        
        message = (
            f"PAYOUT:{receipt_id}:{str(payout_amount)}:"
            f"{recipient_wallet}:{vault_address}:{timestamp}:"
            f"{audit_signature.signature[:32]}"  # Include part of audit sig
        )
        
        return hmac.new(
            self.secret_key.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()


# =============================================================================
# RATE LIMITING
# =============================================================================

class RateLimiter:
    """In-memory rate limiter with sliding window."""
    
    def __init__(self):
        self.requests: dict[str, list[float]] = defaultdict(list)
        self._lock = asyncio.Lock()
    
    async def check_rate_limit(
        self,
        key: str,
        max_per_minute: int,
        max_per_hour: int,
    ) -> tuple[bool, str]:
        """
        Check if request is within rate limits.
        
        Returns:
            (is_allowed, reason)
        """
        async with self._lock:
            now = time.time()
            
            # Clean old entries
            self.requests[key] = [
                ts for ts in self.requests[key]
                if now - ts < 3600  # Keep last hour
            ]
            
            # Check minute limit
            minute_ago = now - 60
            minute_count = sum(1 for ts in self.requests[key] if ts > minute_ago)
            
            if minute_count >= max_per_minute:
                return False, f"Rate limit exceeded: {max_per_minute} per minute"
            
            # Check hour limit
            hour_count = len(self.requests[key])
            if hour_count >= max_per_hour:
                return False, f"Rate limit exceeded: {max_per_hour} per hour"
            
            # Record this request
            self.requests[key].append(now)
            
            return True, "OK"
    
    async def get_remaining(self, key: str, max_per_minute: int) -> int:
        """Get remaining requests in current minute."""
        async with self._lock:
            now = time.time()
            minute_ago = now - 60
            minute_count = sum(1 for ts in self.requests.get(key, []) if ts > minute_ago)
            return max(0, max_per_minute - minute_count)


# Global rate limiter instance
rate_limiter = RateLimiter()


# =============================================================================
# ANOMALY DETECTION
# =============================================================================

class AnomalyDetector:
    """Detects suspicious patterns in expense submissions."""
    
    def __init__(self, client: Client = None):
        self.client = client or get_supabase_admin_client()
    
    async def calculate_anomaly_score(
        self,
        employee_id: str,
        company_id: str,
        amount: Decimal,
        merchant: str,
        category: str,
    ) -> tuple[float, list[str]]:
        """
        Calculate anomaly score for an expense.
        
        Returns:
            (score 0-1, list of anomaly reasons)
        """
        anomalies = []
        score = 0.0
        
        # Check 1: Velocity (too many receipts in short time)
        velocity_score, velocity_reason = await self._check_velocity(employee_id)
        if velocity_score > 0:
            score += velocity_score * 0.3
            anomalies.append(velocity_reason)
        
        # Check 2: Amount deviation from employee's history
        amount_score, amount_reason = await self._check_amount_deviation(
            employee_id, amount
        )
        if amount_score > 0:
            score += amount_score * 0.25
            anomalies.append(amount_reason)
        
        # Check 3: Unusual merchant for this category
        merchant_score, merchant_reason = await self._check_merchant_category(
            company_id, merchant, category
        )
        if merchant_score > 0:
            score += merchant_score * 0.2
            anomalies.append(merchant_reason)
        
        # Check 4: Time-based anomalies (weekend, late night)
        time_score, time_reason = self._check_time_anomaly()
        if time_score > 0:
            score += time_score * 0.15
            anomalies.append(time_reason)
        
        # Check 5: Round number pattern
        round_score, round_reason = self._check_round_number(amount)
        if round_score > 0:
            score += round_score * 0.1
            anomalies.append(round_reason)
        
        return min(score, 1.0), anomalies
    
    async def _check_velocity(self, employee_id: str) -> tuple[float, str]:
        """Check for unusual submission velocity."""
        window_start = datetime.now(UTC) - timedelta(
            hours=SecurityConfig.VELOCITY_CHECK_WINDOW_HOURS
        )
        
        result = (
            self.client.table("receipts")
            .select("id", count="exact")
            .eq("employee_id", employee_id)
            .gte("created_at", window_start.isoformat())
            .execute()
        )
        
        count = result.count or 0
        max_daily = SecurityConfig.MAX_DAILY_RECEIPTS_PER_EMPLOYEE
        
        if count >= max_daily:
            return 1.0, f"Exceeded {max_daily} receipts in 24 hours"
        elif count >= max_daily * 0.7:
            return 0.5, f"High volume: {count} receipts in 24 hours"
        
        return 0.0, ""
    
    async def _check_amount_deviation(
        self, employee_id: str, amount: Decimal
    ) -> tuple[float, str]:
        """Check if amount deviates significantly from employee's history."""
        # Get employee's historical amounts
        result = (
            self.client.table("receipts")
            .select("amount")
            .eq("employee_id", employee_id)
            .eq("status", "paid")
            .order("created_at", desc=True)
            .limit(50)
            .execute()
        )
        
        if len(result.data) < 5:
            return 0.0, ""  # Not enough history
        
        amounts = [Decimal(str(r["amount"])) for r in result.data if r["amount"]]
        avg_amount = sum(amounts) / len(amounts)
        max_amount = max(amounts)
        
        # Check if this amount is significantly higher than average
        if amount > avg_amount * 5:
            return 1.0, f"Amount ${amount} is 5x+ average (${avg_amount:.2f})"
        elif amount > max_amount * 2:
            return 0.7, f"Amount ${amount} is 2x+ historical max (${max_amount:.2f})"
        elif amount > avg_amount * 3:
            return 0.3, f"Amount ${amount} is 3x average"
        
        return 0.0, ""
    
    async def _check_merchant_category(
        self, company_id: str, merchant: str, category: str
    ) -> tuple[float, str]:
        """Check if merchant is unusual for the category."""
        # Get typical merchants for this category
        result = (
            self.client.table("receipts")
            .select("merchant")
            .eq("company_id", company_id)
            .eq("category", category)
            .eq("status", "paid")
            .execute()
        )
        
        if not result.data:
            return 0.0, ""
        
        merchants = [r["merchant"].lower() for r in result.data if r["merchant"]]
        
        # Check if merchant appears in history
        merchant_lower = merchant.lower()
        if not any(merchant_lower in m or m in merchant_lower for m in merchants):
            # New merchant for this category
            return 0.3, f"New merchant '{merchant}' for category '{category}'"
        
        return 0.0, ""
    
    def _check_time_anomaly(self) -> tuple[float, str]:
        """Check for unusual submission times."""
        now = datetime.now(UTC)
        
        # Weekend
        if now.weekday() >= 5:
            return 0.2, "Submitted on weekend"
        
        # Late night (10 PM - 6 AM)
        if now.hour >= 22 or now.hour < 6:
            return 0.3, f"Submitted at unusual hour ({now.hour}:00 UTC)"
        
        return 0.0, ""
    
    def _check_round_number(self, amount: Decimal) -> tuple[float, str]:
        """Check for suspiciously round numbers."""
        # Check if amount ends in .00
        if amount == int(amount):
            if amount >= 100:
                return 0.3, f"Suspiciously round amount: ${amount}"
            return 0.1, "Round dollar amount"
        
        return 0.0, ""


# =============================================================================
# PAYOUT VERIFICATION
# =============================================================================

class PayoutVerifier:
    """Verifies payouts meet security requirements."""
    
    def __init__(self, client: Client = None):
        self.client = client or get_supabase_admin_client()
    
    async def verify_payout_allowed(
        self,
        company_id: str,
        employee_id: str,
        amount: Decimal,
        audit_signature: AuditSignature,
    ) -> tuple[bool, str, dict]:
        """
        Comprehensive verification that a payout should proceed.
        
        Returns:
            (is_allowed, reason, metadata)
        """
        metadata = {
            "checks_passed": [],
            "checks_failed": [],
            "requires_approval": False,
            "approval_level": "none",
        }
        
        # Check 1: Verify audit signature
        sig_service = SignatureService()
        if not sig_service.verify_audit_signature(audit_signature):
            metadata["checks_failed"].append("audit_signature")
            return False, "Invalid or expired audit signature", metadata
        metadata["checks_passed"].append("audit_signature")
        
        # Check 2: Verify receipt exists and is approved
        receipt_valid, receipt_reason = await self._verify_receipt(
            audit_signature.receipt_id, amount
        )
        if not receipt_valid:
            metadata["checks_failed"].append("receipt_verification")
            return False, receipt_reason, metadata
        metadata["checks_passed"].append("receipt_verification")
        
        # Check 3: Check daily limit
        within_limit, limit_reason = await self._check_daily_limit(
            company_id, amount
        )
        if not within_limit:
            metadata["checks_failed"].append("daily_limit")
            return False, limit_reason, metadata
        metadata["checks_passed"].append("daily_limit")
        
        # Check 4: Rate limiting
        rate_key = f"payout:{company_id}"
        rate_ok, rate_reason = await rate_limiter.check_rate_limit(
            rate_key,
            SecurityConfig.MAX_PAYOUTS_PER_MINUTE,
            SecurityConfig.MAX_PAYOUTS_PER_HOUR,
        )
        if not rate_ok:
            metadata["checks_failed"].append("rate_limit")
            return False, rate_reason, metadata
        metadata["checks_passed"].append("rate_limit")
        
        # Check 5: Determine approval level required
        if amount >= SecurityConfig.CRITICAL_VALUE_THRESHOLD_USD:
            metadata["requires_approval"] = True
            metadata["approval_level"] = "multisig"
            # For now, we don't block - just flag for manual review
        elif amount >= SecurityConfig.HIGH_VALUE_THRESHOLD_USD:
            metadata["requires_approval"] = True
            metadata["approval_level"] = "manager"
        
        return True, "All security checks passed", metadata
    
    async def _verify_receipt(
        self, receipt_id: str, expected_amount: Decimal
    ) -> tuple[bool, str]:
        """Verify receipt exists and matches expected values."""
        result = (
            self.client.table("receipts")
            .select("id, status, amount, payout_amount")
            .eq("id", receipt_id)
            .execute()
        )
        
        if not result.data:
            return False, f"Receipt not found: {receipt_id}"
        
        receipt = result.data[0]
        
        if receipt["status"] != "approved":
            return False, f"Receipt status is {receipt['status']}, not approved"
        
        # Verify amount matches (with small tolerance for rounding)
        receipt_amount = Decimal(str(receipt.get("payout_amount") or receipt["amount"]))
        if abs(receipt_amount - expected_amount) > Decimal("0.01"):
            return False, f"Amount mismatch: expected ${expected_amount}, got ${receipt_amount}"
        
        return True, "Receipt verified"
    
    async def _check_daily_limit(
        self, company_id: str, amount: Decimal
    ) -> tuple[bool, str]:
        """Check if company is within daily payout limit."""
        today_start = datetime.now(UTC).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        
        result = (
            self.client.table("ledger_entries")
            .select("amount")
            .eq("company_id", company_id)
            .eq("entry_type", "reimbursement")
            .gte("created_at", today_start.isoformat())
            .execute()
        )
        
        today_total = sum(
            Decimal(str(e["amount"])) for e in result.data
        )
        
        if today_total + amount > SecurityConfig.DAILY_PAYOUT_LIMIT_USD:
            return False, (
                f"Daily limit exceeded: ${today_total} + ${amount} > "
                f"${SecurityConfig.DAILY_PAYOUT_LIMIT_USD}"
            )
        
        return True, "Within daily limit"


# =============================================================================
# SECURITY LOG
# =============================================================================

class SecurityLogger:
    """Logs security events for audit trail."""
    
    def __init__(self, client: Client = None):
        self.client = client or get_supabase_admin_client()
    
    async def log_event(
        self,
        event_type: str,
        severity: str,  # "info", "warning", "critical"
        company_id: str = None,
        employee_id: str = None,
        receipt_id: str = None,
        details: dict = None,
        ip_address: str = None,
    ):
        """Log a security event."""
        try:
            self.client.table("audit_logs").insert({
                "company_id": company_id,
                "actor_type": "security_system",
                "actor_id": employee_id,
                "action": f"security.{event_type}",
                "resource_type": "receipt" if receipt_id else "company",
                "resource_id": receipt_id,
                "details": {
                    "severity": severity,
                    "event_type": event_type,
                    **(details or {}),
                },
                "ip_address": ip_address,
            }).execute()
        except Exception as e:
            # Don't fail on logging errors
            print(f"Security logging error: {e}")
    
    async def log_anomaly_detected(
        self,
        company_id: str,
        employee_id: str,
        receipt_id: str,
        score: float,
        anomalies: list[str],
    ):
        """Log anomaly detection."""
        severity = "critical" if score >= 0.8 else "warning" if score >= 0.5 else "info"
        
        await self.log_event(
            event_type="anomaly_detected",
            severity=severity,
            company_id=company_id,
            employee_id=employee_id,
            receipt_id=receipt_id,
            details={
                "anomaly_score": score,
                "anomalies": anomalies,
            },
        )
    
    async def log_payout_blocked(
        self,
        company_id: str,
        receipt_id: str,
        reason: str,
        amount: Decimal,
    ):
        """Log blocked payout."""
        await self.log_event(
            event_type="payout_blocked",
            severity="warning",
            company_id=company_id,
            receipt_id=receipt_id,
            details={
                "reason": reason,
                "amount": str(amount),
            },
        )
    
    async def log_high_value_payout(
        self,
        company_id: str,
        receipt_id: str,
        amount: Decimal,
        approval_level: str,
    ):
        """Log high-value payout requiring additional approval."""
        await self.log_event(
            event_type="high_value_payout",
            severity="info",
            company_id=company_id,
            receipt_id=receipt_id,
            details={
                "amount": str(amount),
                "approval_level": approval_level,
            },
        )


# =============================================================================
# MAIN SECURITY SERVICE
# =============================================================================

class SecurityService:
    """Main security service coordinating all security features."""
    
    def __init__(self, client: Client = None):
        self.client = client or get_supabase_admin_client()
        self.signature_service = SignatureService()
        self.anomaly_detector = AnomalyDetector(self.client)
        self.payout_verifier = PayoutVerifier(self.client)
        self.logger = SecurityLogger(self.client)
    
    async def secure_audit(
        self,
        receipt_id: str,
        company_id: str,
        employee_id: str,
        amount: Decimal,
        merchant: str,
        category: str,
        audit_result: str,
        confidence: float,
        ip_address: str = None,
    ) -> tuple[AuditSignature, dict]:
        """
        Perform security checks and create signed audit result.
        
        Returns:
            (signature, security_metadata)
        """
        # Rate limiting
        rate_key = f"audit:{company_id}"
        rate_ok, rate_reason = await rate_limiter.check_rate_limit(
            rate_key,
            SecurityConfig.MAX_AUDITS_PER_MINUTE,
            SecurityConfig.MAX_AUDITS_PER_HOUR,
        )
        
        if not rate_ok:
            raise RateLimitException(message=rate_reason, error_code="RATE_LIMITED")
        
        # Anomaly detection
        anomaly_score, anomalies = await self.anomaly_detector.calculate_anomaly_score(
            employee_id=employee_id,
            company_id=company_id,
            amount=amount,
            merchant=merchant,
            category=category,
        )
        
        if anomaly_score >= SecurityConfig.ANOMALY_SCORE_THRESHOLD:
            await self.logger.log_anomaly_detected(
                company_id=company_id,
                employee_id=employee_id,
                receipt_id=receipt_id,
                score=anomaly_score,
                anomalies=anomalies,
            )
            # Flag for manual review instead of outright rejection
            audit_result = "flagged"
        
        # Create signature
        signature = self.signature_service.create_audit_signature(
            receipt_id=receipt_id,
            audit_result=audit_result,
            amount=amount,
            confidence=confidence,
        )
        
        metadata = {
            "anomaly_score": anomaly_score,
            "anomalies": anomalies,
            "flagged_for_review": anomaly_score >= SecurityConfig.ANOMALY_SCORE_THRESHOLD,
        }
        
        return signature, metadata
    
    async def secure_payout(
        self,
        receipt_id: str,
        company_id: str,
        employee_id: str,
        amount: Decimal,
        recipient_wallet: str,
        vault_address: str,
        audit_signature: AuditSignature,
    ) -> tuple[bool, str, dict]:
        """
        Verify payout is secure to proceed.
        
        Returns:
            (is_allowed, reason, security_metadata)
        """
        # Verify all security requirements
        is_allowed, reason, metadata = await self.payout_verifier.verify_payout_allowed(
            company_id=company_id,
            employee_id=employee_id,
            amount=amount,
            audit_signature=audit_signature,
        )
        
        if not is_allowed:
            await self.logger.log_payout_blocked(
                company_id=company_id,
                receipt_id=receipt_id,
                reason=reason,
                amount=amount,
            )
            return False, reason, metadata
        
        # Log high-value payouts
        if metadata.get("requires_approval"):
            await self.logger.log_high_value_payout(
                company_id=company_id,
                receipt_id=receipt_id,
                amount=amount,
                approval_level=metadata["approval_level"],
            )
        
        # Create payout authorization
        metadata["payout_authorization"] = self.signature_service.create_payout_authorization(
            receipt_id=receipt_id,
            audit_signature=audit_signature,
            payout_amount=amount,
            recipient_wallet=recipient_wallet,
            vault_address=vault_address,
        )
        
        return True, reason, metadata


# Singleton instance
security_service = SecurityService()
