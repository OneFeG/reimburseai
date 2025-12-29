"""
Thirdweb Service for blockchain operations.

Handles USDC transfers and wallet management via Thirdweb REST API.
"""

import logging
from decimal import Decimal
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class ThirdwebError(Exception):
    """Custom exception for Thirdweb operations."""

    pass


class ThirdwebService:
    """
    Service for interacting with Thirdweb API for blockchain operations.

    Used by the Treasury agent to transfer USDC payouts to employee wallets.
    Automatically uses mainnet or testnet based on settings.use_mainnet.
    """

    USDC_DECIMALS = 6
    # Thirdweb REST API base URL
    THIRDWEB_API_URL = "https://api.thirdweb.com"

    def __init__(self):
        self.secret_key = settings.thirdweb_secret_key
        self.company_wallet = settings.thirdweb_company_wallet_address
        self.agent_a_wallet = settings.thirdweb_agent_a_wallet_address

        # Network configuration from settings
        self.chain_id = settings.actual_chain_id
        self.chain_name = settings.chain_name
        self.usdc_token_address = settings.usdc_token_address

    def _get_headers(self) -> dict[str, str]:
        """Get authorization headers for Thirdweb API."""
        return {
            "x-secret-key": self.secret_key,
            "Content-Type": "application/json",
        }

    async def transfer_usdc(
        self,
        to_address: str,
        amount_usd: Decimal,
    ) -> dict[str, Any]:
        """
        Transfer USDC from company wallet to an employee wallet.

        Args:
            to_address: Recipient wallet address
            amount_usd: Amount in USD (will be converted to USDC wei)

        Returns:
            Dict with transaction details

        Raises:
            ThirdwebError: If transfer fails
        """
        # Convert USD to USDC wei (6 decimals)
        amount_wei = int(amount_usd * (10**self.USDC_DECIMALS))

        try:
            async with httpx.AsyncClient() as client:
                # Use Thirdweb REST API for ERC20 transfer
                response = await client.post(
                    f"{self.THIRDWEB_API_URL}/v1/contracts/write",
                    headers=self._get_headers(),
                    json={
                        "calls": [
                            {
                                "contractAddress": self.usdc_token_address,
                                "method": "function transfer(address to, uint256 amount)",
                                "params": [to_address, str(amount_wei)],
                            }
                        ],
                        "chainId": self.chain_id,
                        "from": self.company_wallet,
                    },
                    timeout=60.0,
                )

                if response.status_code not in (200, 201):
                    try:
                        error_data = response.json() if response.content else {}
                        error_msg = error_data.get('message', error_data.get('error', 'Unknown error'))
                    except Exception:
                        error_msg = response.text[:200] if response.text else f"HTTP {response.status_code}"
                    raise ThirdwebError(
                        f"USDC transfer failed: {error_msg}"
                    )

                try:
                    result = response.json()
                except Exception as e:
                    logger.error(f"Failed to parse Thirdweb response: {response.text[:500]}")
                    raise ThirdwebError(f"Invalid response from Thirdweb: {str(e)}")

                # Extract transaction ID from result
                transaction_ids = result.get("result", {}).get("transactionIds", [])
                queue_id = transaction_ids[0] if transaction_ids else result.get("result", {}).get("queueId")

                logger.info(f"USDC transfer initiated: {amount_usd} USD to {to_address}")

                return {
                    "success": True,
                    "queue_id": queue_id,
                    "to_address": to_address,
                    "amount_usd": float(amount_usd),
                    "amount_wei": amount_wei,
                }

        except httpx.RequestError as e:
            logger.error(f"Thirdweb transfer request failed: {e}")
            raise ThirdwebError(f"Transfer request failed: {str(e)}")

    async def get_usdc_balance(
        self,
        wallet_address: str | None = None,
    ) -> dict[str, Any]:
        """
        Get USDC balance for a wallet using Thirdweb REST API.

        Args:
            wallet_address: Wallet to check (defaults to company wallet)

        Returns:
            Dict with balance information
        """
        address = wallet_address or self.company_wallet

        try:
            async with httpx.AsyncClient() as client:
                # Use Thirdweb REST API to read balance
                response = await client.post(
                    f"{self.THIRDWEB_API_URL}/v1/contracts/read",
                    headers=self._get_headers(),
                    json={
                        "contractAddress": self.usdc_token_address,
                        "method": "function balanceOf(address account) view returns (uint256)",
                        "params": [address],
                        "chainId": self.chain_id,
                    },
                    timeout=30.0,
                )

                if response.status_code != 200:
                    try:
                        error_data = response.json() if response.content else {}
                        error_msg = error_data.get('message', 'Unknown error')
                    except Exception:
                        error_msg = f"HTTP {response.status_code}"
                    raise ThirdwebError(f"Balance check failed: {error_msg}")

                result = response.json()
                balance_wei = int(result.get("result", "0"))
                balance_usd = Decimal(balance_wei) / (10**self.USDC_DECIMALS)

                return {
                    "wallet_address": address,
                    "balance_wei": balance_wei,
                    "balance_usd": float(balance_usd),
                    "token": "USDC",
                }

        except httpx.RequestError as e:
            logger.error(f"Thirdweb balance check failed: {e}")
            raise ThirdwebError(f"Balance check request failed: {str(e)}")

    async def get_transaction_status(
        self,
        queue_id: str,
    ) -> dict[str, Any]:
        """
        Check the status of a queued transaction.

        Args:
            queue_id: The queue ID/transaction hash returned from transfer operations

        Returns:
            Dict with transaction status
        """
        # For REST API, the queue_id is often the transaction hash
        # We can check the transaction status on-chain
        return {
            "queue_id": queue_id,
            "status": "pending",  # REST API doesn't provide queue status
            "transaction_hash": queue_id if queue_id.startswith("0x") else None,
            "chain_id": self.chain_id,
            "note": "Use blockchain explorer to verify transaction status",
        }

    async def get_native_balance(
        self,
        wallet_address: str | None = None,
    ) -> dict[str, Any]:
        """
        Get native AVAX balance for a wallet.

        Args:
            wallet_address: Wallet to check (defaults to company wallet)

        Returns:
            Dict with native balance information
        """
        address = wallet_address or self.company_wallet

        try:
            async with httpx.AsyncClient() as client:
                # Use Avalanche RPC to get balance
                rpc_url = "https://api.avax-test.network/ext/bc/C/rpc" if self.chain_id == 43113 else "https://api.avax.network/ext/bc/C/rpc"
                
                response = await client.post(
                    rpc_url,
                    json={
                        "jsonrpc": "2.0",
                        "id": 1,
                        "method": "eth_getBalance",
                        "params": [address, "latest"],
                    },
                    timeout=30.0,
                )

                if response.status_code != 200:
                    raise ThirdwebError("Native balance check failed")

                result = response.json()
                balance_hex = result.get("result", "0x0")
                balance_wei = int(balance_hex, 16)
                balance_avax = balance_wei / (10**18)

                return {
                    "wallet_address": address,
                    "balance_wei": str(balance_wei),
                    "display_value": f"{balance_avax:.6f}",
                    "symbol": "AVAX",
                }

        except httpx.RequestError as e:
            logger.error(f"Native balance check failed: {e}")
            raise ThirdwebError(f"Native balance check request failed: {str(e)}")


# Singleton instance
thirdweb_service = ThirdwebService()
