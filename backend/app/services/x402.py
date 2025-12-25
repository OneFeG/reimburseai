"""
x402 Protocol Service for pay-per-audit micropayments.

Handles verification and settlement of x402 payments for the Auditor agent.
"""

from typing import Any
import httpx
from eth_account import Account
from eth_account.messages import encode_defunct
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class X402PaymentError(Exception):
    """Custom exception for x402 payment errors."""
    pass


class X402Service:
    """
    Service for handling x402 protocol payments.
    
    The x402 protocol enables pay-per-request micropayments using
    USDC on Avalanche Fuji testnet.
    """
    
    # Payment configuration
    PRICE_PER_AUDIT_WEI = 50000  # $0.05 in USDC (6 decimals = 50000)
    CHAIN_ID = 43113  # Avalanche Fuji testnet
    USDC_TOKEN_ADDRESS = "0x5425890298aed601595a70AB815c96711a31Bc65"  # Fuji USDC
    
    def __init__(self):
        self.facilitator_url = settings.x402_facilitator_url
        self.agent_a_wallet = settings.thirdweb_agent_a_wallet_address
    
    async def verify_payment(
        self,
        payment_header: str | None,
        required_amount: int | None = None,
    ) -> dict[str, Any]:
        """
        Verify an x402 payment from the request header.
        
        Args:
            payment_header: The X-PAYMENT header value containing payment proof
            required_amount: Required payment amount in wei (defaults to PRICE_PER_AUDIT_WEI)
            
        Returns:
            Dict with verification result and payment details
            
        Raises:
            X402PaymentError: If payment verification fails
        """
        if not payment_header:
            raise X402PaymentError("Missing X-PAYMENT header")
        
        amount = required_amount or self.PRICE_PER_AUDIT_WEI
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.facilitator_url}/verify",
                    json={
                        "x402Version": 1,
                        "payment": payment_header,
                        "paymentRequirements": {
                            "scheme": "exact",
                            "network": "base-sepolia",  # x402 network
                            "maxAmountRequired": str(amount),
                            "resource": f"https://api.reimburse.ai/audit",
                            "description": "Receipt audit service",
                            "mimeType": "application/json",
                            "payTo": self.agent_a_wallet,
                            "maxTimeoutSeconds": 300,
                            "asset": self.USDC_TOKEN_ADDRESS,
                            "extra": {
                                "name": "Reimburse.ai Auditor",
                                "version": "1.0.0",
                            }
                        }
                    },
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    error_data = response.json() if response.content else {}
                    raise X402PaymentError(
                        f"Payment verification failed: {error_data.get('error', 'Unknown error')}"
                    )
                
                result = response.json()
                
                if not result.get("valid"):
                    raise X402PaymentError(
                        f"Invalid payment: {result.get('invalidReason', 'Unknown reason')}"
                    )
                
                return {
                    "valid": True,
                    "payer": result.get("payer"),
                    "amount": result.get("amount"),
                    "payment_id": result.get("paymentId"),
                }
                
        except httpx.RequestError as e:
            logger.error(f"x402 verification request failed: {e}")
            raise X402PaymentError(f"Payment verification request failed: {str(e)}")
    
    async def settle_payment(
        self,
        payment_header: str,
    ) -> dict[str, Any]:
        """
        Settle an x402 payment after successful service delivery.
        
        Args:
            payment_header: The X-PAYMENT header value containing payment proof
            
        Returns:
            Dict with settlement result
            
        Raises:
            X402PaymentError: If payment settlement fails
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.facilitator_url}/settle",
                    json={
                        "x402Version": 1,
                        "payment": payment_header,
                    },
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    error_data = response.json() if response.content else {}
                    raise X402PaymentError(
                        f"Payment settlement failed: {error_data.get('error', 'Unknown error')}"
                    )
                
                result = response.json()
                
                return {
                    "settled": True,
                    "transaction_hash": result.get("transactionHash"),
                    "settlement_id": result.get("settlementId"),
                }
                
        except httpx.RequestError as e:
            logger.error(f"x402 settlement request failed: {e}")
            raise X402PaymentError(f"Payment settlement request failed: {str(e)}")
    
    def generate_payment_requirements(
        self,
        resource: str,
        description: str,
        amount: int | None = None,
    ) -> dict[str, Any]:
        """
        Generate x402 payment requirements for a 402 response.
        
        Args:
            resource: The resource URL being accessed
            description: Human-readable description of the service
            amount: Required payment amount (defaults to PRICE_PER_AUDIT_WEI)
            
        Returns:
            Payment requirements dict for X-PAYMENT-REQUIRED header
        """
        return {
            "x402Version": 1,
            "scheme": "exact",
            "network": "base-sepolia",
            "maxAmountRequired": str(amount or self.PRICE_PER_AUDIT_WEI),
            "resource": resource,
            "description": description,
            "mimeType": "application/json",
            "payTo": self.agent_a_wallet,
            "maxTimeoutSeconds": 300,
            "asset": self.USDC_TOKEN_ADDRESS,
            "extra": {
                "name": "Reimburse.ai Auditor",
                "version": "1.0.0",
            }
        }
    
    @staticmethod
    def normalize_signature_v(signature: str) -> str:
        """
        Normalize ECDSA signature V value for compatibility.
        
        Some wallets produce v=0/1 while others use v=27/28.
        This normalizes to v=27/28 format.
        
        Args:
            signature: Hex signature string (with or without 0x prefix)
            
        Returns:
            Normalized signature string
        """
        sig = signature[2:] if signature.startswith("0x") else signature
        
        if len(sig) != 130:
            return signature  # Invalid length, return as-is
        
        v = int(sig[-2:], 16)
        
        if v < 27:
            v += 27
            sig = sig[:-2] + format(v, "02x")
        
        return "0x" + sig


# Singleton instance
x402_service = X402Service()
