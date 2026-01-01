"""
Cryptographic Signature Service for Audit Verification.
========================================================

This service provides cryptographic signing of AI audit results to ensure:
1. Audit results cannot be tampered with after generation
2. Results can be verified at any time
3. Non-repudiation - audit decisions are provably linked to our system

Security Flow:
1. AI generates audit decision
2. Backend signs the decision with HMAC-SHA256 + private key
3. Signature is stored with the audit result
4. Before payout, signature is verified
5. Invalid signature = reject payout (tamper detection)
"""

import hashlib
import hmac
import json
import logging
import secrets
import time
from typing import Any
from datetime import datetime

from app.config import settings

logger = logging.getLogger(__name__)


class SignatureVerificationError(Exception):
    """Exception for signature verification failures."""
    pass


class TamperDetectedError(SignatureVerificationError):
    """Exception when audit result tampering is detected."""
    pass


class SignatureService:
    """
    Cryptographic signature service for audit result verification.
    
    Uses HMAC-SHA256 for signing audit results with a server-side secret key.
    This provides tamper detection and integrity verification for AI audit decisions.
    """

    # Signature scheme version (for future algorithm upgrades)
    SCHEME_VERSION = "v1"
    
    def __init__(self):
        """Initialize with signing key from settings or generate one."""
        self.signing_key = self._get_or_create_signing_key()
        
    def _get_or_create_signing_key(self) -> bytes:
        """Get signing key from settings or environment."""
        # First try to get from settings/environment
        key = getattr(settings, 'audit_signing_key', None)
        if key:
            return key.encode() if isinstance(key, str) else key
        
        # Use Thirdweb secret as fallback (it's already a secret)
        if settings.thirdweb_secret_key:
            return f"audit-{settings.thirdweb_secret_key}".encode()
        
        # Last resort: generate a key (should be persisted in production)
        logger.warning(
            "No AUDIT_SIGNING_KEY configured. Using generated key. "
            "Set AUDIT_SIGNING_KEY environment variable in production!"
        )
        return secrets.token_bytes(32)

    def sign_audit_result(
        self,
        receipt_id: str,
        audit_result: dict[str, Any],
        timestamp: float | None = None,
    ) -> dict[str, Any]:
        """
        Sign an AI audit result with cryptographic signature.
        
        Creates an HMAC-SHA256 signature over the canonical JSON representation
        of the audit result. The signature proves the audit result originated
        from our system and has not been modified.
        
        Args:
            receipt_id: The receipt ID being audited
            audit_result: The complete audit result from AI
            timestamp: Optional timestamp (uses current time if not provided)
            
        Returns:
            Signature envelope containing:
            - signature: HMAC-SHA256 hex digest
            - timestamp: When the signature was created
            - scheme: Signature scheme version
            - receipt_id: The audited receipt
            - digest: SHA256 hash of the signed content
        """
        ts = timestamp or time.time()
        
        # Create canonical representation of audit decision
        # This is what gets signed - includes key decision fields
        canonical_data = self._create_canonical_data(
            receipt_id=receipt_id,
            audit_result=audit_result,
            timestamp=ts,
        )
        
        # Create content digest (for quick verification)
        content_digest = hashlib.sha256(canonical_data.encode()).hexdigest()
        
        # Create HMAC-SHA256 signature
        signature = hmac.new(
            self.signing_key,
            canonical_data.encode(),
            hashlib.sha256,
        ).hexdigest()
        
        logger.info(
            f"Signed audit result for receipt {receipt_id}: "
            f"approved={audit_result.get('validation', {}).get('is_valid', False)}, "
            f"amount=${audit_result.get('extracted', {}).get('amount_usd', 0)}"
        )
        
        return {
            "signature": signature,
            "timestamp": ts,
            "signed_at": datetime.utcfromtimestamp(ts).isoformat(),
            "scheme": self.SCHEME_VERSION,
            "receipt_id": receipt_id,
            "content_digest": content_digest,
        }

    def verify_audit_signature(
        self,
        receipt_id: str,
        audit_result: dict[str, Any],
        signature_envelope: dict[str, Any],
        max_age_seconds: int = 3600 * 24 * 7,  # 7 days default
    ) -> dict[str, Any]:
        """
        Verify the cryptographic signature of an audit result.
        
        Ensures the audit result has not been tampered with since signing.
        This should be called before processing any payout to detect
        modifications to the audit decision.
        
        Args:
            receipt_id: The receipt ID being verified
            audit_result: The audit result to verify
            signature_envelope: The signature data from sign_audit_result
            max_age_seconds: Maximum acceptable signature age
            
        Returns:
            Verification result with status and details
            
        Raises:
            TamperDetectedError: If audit result has been modified
            SignatureVerificationError: If signature is invalid or expired
        """
        # Extract signature details
        signature = signature_envelope.get("signature")
        timestamp = signature_envelope.get("timestamp")
        scheme = signature_envelope.get("scheme")
        stored_receipt_id = signature_envelope.get("receipt_id")
        stored_digest = signature_envelope.get("content_digest")
        
        if not signature or not timestamp:
            raise SignatureVerificationError("Missing signature or timestamp")
        
        # Verify scheme version
        if scheme != self.SCHEME_VERSION:
            raise SignatureVerificationError(
                f"Unknown signature scheme: {scheme}. Expected: {self.SCHEME_VERSION}"
            )
        
        # Verify receipt ID matches
        if stored_receipt_id != receipt_id:
            raise TamperDetectedError(
                f"Receipt ID mismatch: stored={stored_receipt_id}, provided={receipt_id}"
            )
        
        # Check signature age
        current_time = time.time()
        signature_age = current_time - timestamp
        if signature_age > max_age_seconds:
            raise SignatureVerificationError(
                f"Signature expired: age={signature_age}s, max={max_age_seconds}s"
            )
        
        # Recreate canonical data
        canonical_data = self._create_canonical_data(
            receipt_id=receipt_id,
            audit_result=audit_result,
            timestamp=timestamp,
        )
        
        # Verify content digest (quick check)
        current_digest = hashlib.sha256(canonical_data.encode()).hexdigest()
        if stored_digest and current_digest != stored_digest:
            raise TamperDetectedError(
                f"Content digest mismatch - audit result has been modified! "
                f"Expected: {stored_digest}, Got: {current_digest}"
            )
        
        # Verify HMAC signature
        expected_signature = hmac.new(
            self.signing_key,
            canonical_data.encode(),
            hashlib.sha256,
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected_signature):
            raise TamperDetectedError(
                "Signature verification failed - audit result may have been tampered with!"
            )
        
        logger.info(f"Signature verified successfully for receipt {receipt_id}")
        
        return {
            "verified": True,
            "receipt_id": receipt_id,
            "signed_at": datetime.utcfromtimestamp(timestamp).isoformat(),
            "signature_age_seconds": signature_age,
            "is_valid_audit": audit_result.get("validation", {}).get("is_valid", False),
        }

    def _create_canonical_data(
        self,
        receipt_id: str,
        audit_result: dict[str, Any],
        timestamp: float,
    ) -> str:
        """
        Create canonical JSON representation for signing.
        
        Only includes fields that affect the audit decision.
        This ensures consistent hashing regardless of field ordering.
        """
        # Extract relevant audit fields
        extracted = audit_result.get("extracted", {})
        validation = audit_result.get("validation", {})
        
        canonical = {
            "v": self.SCHEME_VERSION,
            "ts": int(timestamp),  # Integer timestamp for consistency
            "receipt_id": receipt_id,
            # Core audit decision
            "decision": {
                "is_valid": validation.get("is_valid", False),
                "reason": validation.get("decision_reason", ""),
            },
            # Key extracted data that affects payout
            "extracted": {
                "amount_usd": extracted.get("amount_usd", 0),
                "vendor": extracted.get("vendor", ""),
                "category": extracted.get("category", ""),
            },
            # Confidence score
            "confidence": audit_result.get("confidence", 0),
        }
        
        # Sort keys for consistent serialization
        return json.dumps(canonical, sort_keys=True, separators=(',', ':'))

    def create_audit_certificate(
        self,
        receipt_id: str,
        audit_result: dict[str, Any],
        company_id: str,
        employee_id: str,
    ) -> dict[str, Any]:
        """
        Create a complete audit certificate with all verification data.
        
        This certificate contains everything needed to verify the audit
        decision at any point in the future.
        """
        signature_envelope = self.sign_audit_result(receipt_id, audit_result)
        
        return {
            "certificate_type": "reimburse_ai_audit",
            "version": "1.0",
            "receipt_id": receipt_id,
            "company_id": company_id,
            "employee_id": employee_id,
            "audit_decision": {
                "is_approved": audit_result.get("validation", {}).get("is_valid", False),
                "amount_usd": audit_result.get("extracted", {}).get("amount_usd", 0),
                "reason": audit_result.get("validation", {}).get("decision_reason", ""),
                "confidence": audit_result.get("confidence", 0),
            },
            "signature": signature_envelope,
            "issued_at": datetime.utcnow().isoformat(),
        }


# Singleton instance
signature_service = SignatureService()
