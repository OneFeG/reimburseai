"""
Encryption Utilities for PII Protection (Phase 3 Security).

Provides at-rest encryption for sensitive data fields.
Uses Fernet symmetric encryption with key management.
"""

import base64
import hashlib
import json
from typing import Any

from cryptography.fernet import Fernet

from app.config import settings


class EncryptionService:
    """
    Service for encrypting/decrypting sensitive data.
    
    Used for PII protection at rest:
    - Employee personal information
    - Bank account details
    - Tax IDs
    - KYB documentation
    """
    
    def __init__(self):
        # Derive encryption key from secret key
        # In production, use a dedicated encryption key from KMS
        key_bytes = hashlib.sha256(settings.secret_key.encode()).digest()
        self._key = base64.urlsafe_b64encode(key_bytes)
        self._fernet = Fernet(self._key)
    
    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt a plaintext string.
        
        Args:
            plaintext: The string to encrypt
            
        Returns:
            Base64-encoded encrypted string
        """
        if not plaintext:
            return plaintext
        
        encrypted = self._fernet.encrypt(plaintext.encode("utf-8"))
        return encrypted.decode("utf-8")
    
    def decrypt(self, ciphertext: str) -> str:
        """
        Decrypt an encrypted string.
        
        Args:
            ciphertext: Base64-encoded encrypted string
            
        Returns:
            Decrypted plaintext string
        """
        if not ciphertext:
            return ciphertext
        
        try:
            decrypted = self._fernet.decrypt(ciphertext.encode("utf-8"))
            return decrypted.decode("utf-8")
        except Exception:
            # Return original if decryption fails (might be unencrypted)
            return ciphertext
    
    def encrypt_dict(self, data: dict[str, Any], fields: list[str]) -> dict[str, Any]:
        """
        Encrypt specific fields in a dictionary.
        
        Args:
            data: Dictionary with data
            fields: List of field names to encrypt
            
        Returns:
            Dictionary with specified fields encrypted
        """
        result = data.copy()
        
        for field in fields:
            if field in result and result[field]:
                if isinstance(result[field], str):
                    result[field] = self.encrypt(result[field])
                elif isinstance(result[field], dict):
                    result[field] = self.encrypt(json.dumps(result[field]))
        
        return result
    
    def decrypt_dict(self, data: dict[str, Any], fields: list[str]) -> dict[str, Any]:
        """
        Decrypt specific fields in a dictionary.
        
        Args:
            data: Dictionary with encrypted fields
            fields: List of field names to decrypt
            
        Returns:
            Dictionary with specified fields decrypted
        """
        result = data.copy()
        
        for field in fields:
            if field in result and result[field]:
                decrypted = self.decrypt(result[field])
                # Try to parse as JSON if it looks like JSON
                if decrypted.startswith("{") or decrypted.startswith("["):
                    try:
                        result[field] = json.loads(decrypted)
                    except json.JSONDecodeError:
                        result[field] = decrypted
                else:
                    result[field] = decrypted
        
        return result
    
    def hash_for_lookup(self, value: str) -> str:
        """
        Create a deterministic hash for lookup purposes.
        
        Use this when you need to search encrypted fields
        (e.g., finding employee by SSN without decrypting all).
        
        Args:
            value: Value to hash
            
        Returns:
            SHA256 hash of the value
        """
        return hashlib.sha256(
            (value + settings.secret_key).encode()
        ).hexdigest()
    
    def mask_pii(self, value: str, visible_chars: int = 4) -> str:
        """
        Mask PII for display purposes.
        
        Args:
            value: Value to mask
            visible_chars: Number of characters to leave visible at end
            
        Returns:
            Masked string (e.g., "****1234")
        """
        if not value or len(value) <= visible_chars:
            return "*" * len(value) if value else ""
        
        return "*" * (len(value) - visible_chars) + value[-visible_chars:]


# PII fields that should be encrypted
PII_FIELDS = [
    "ssn",
    "tax_id",
    "bank_account_number",
    "bank_routing_number",
    "date_of_birth",
    "address",
    "phone_number",
]

# KYB fields that should be encrypted
KYB_SENSITIVE_FIELDS = [
    "registration_number",
    "tax_id",
    "bank_account_last4",
    "contact_phone",
]


# Singleton instance
encryption_service = EncryptionService()
