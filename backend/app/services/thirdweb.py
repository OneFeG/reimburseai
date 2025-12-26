"""
Thirdweb Service for blockchain operations.

Handles USDC transfers and wallet management via Thirdweb Engine.
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
    Service for interacting with Thirdweb Engine for blockchain operations.

    Used by the Treasury agent to transfer USDC payouts to employee wallets.
    Automatically uses mainnet or testnet based on settings.use_mainnet.
    """

    USDC_DECIMALS = 6

    def __init__(self):
        self.engine_url = settings.thirdweb_engine_url
        self.secret_key = settings.thirdweb_secret_key
        self.company_wallet = settings.thirdweb_company_wallet_address
        self.agent_a_wallet = settings.thirdweb_agent_a_wallet_address

        # Network configuration from settings
        self.chain_id = settings.actual_chain_id
        self.chain_name = settings.chain_name
        self.usdc_token_address = settings.usdc_token_address

    def _get_headers(self) -> dict[str, str]:
        """Get authorization headers for Thirdweb Engine API."""
        return {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
            "x-backend-wallet-address": self.company_wallet,
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
                # Use Thirdweb Engine to transfer ERC20 tokens
                response = await client.post(
                    f"{self.engine_url}/contract/{self.chain_name}/{self.usdc_token_address}/erc20/transfer",
                    headers=self._get_headers(),
                    json={
                        "toAddress": to_address,
                        "amount": str(amount_wei),
                    },
                    timeout=60.0,
                )

                if response.status_code not in (200, 201):
                    error_data = response.json() if response.content else {}
                    raise ThirdwebError(
                        f"USDC transfer failed: {error_data.get('message', 'Unknown error')}"
                    )

                result = response.json()

                logger.info(f"USDC transfer initiated: {amount_usd} USD to {to_address}")

                return {
                    "success": True,
                    "queue_id": result.get("result", {}).get("queueId"),
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
        Get USDC balance for a wallet.

        Args:
            wallet_address: Wallet to check (defaults to company wallet)

        Returns:
            Dict with balance information
        """
        address = wallet_address or self.company_wallet

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.engine_url}/contract/{self.chain_name}/{self.usdc_token_address}/erc20/balance-of",
                    headers=self._get_headers(),
                    params={"wallet_address": address},
                    timeout=30.0,
                )

                if response.status_code != 200:
                    error_data = response.json() if response.content else {}
                    raise ThirdwebError(
                        f"Balance check failed: {error_data.get('message', 'Unknown error')}"
                    )

                result = response.json()
                balance_wei = int(result.get("result", {}).get("value", "0"))
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
            queue_id: The queue ID returned from transfer operations

        Returns:
            Dict with transaction status
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.engine_url}/transaction/status/{queue_id}",
                    headers=self._get_headers(),
                    timeout=30.0,
                )

                if response.status_code != 200:
                    error_data = response.json() if response.content else {}
                    raise ThirdwebError(
                        f"Status check failed: {error_data.get('message', 'Unknown error')}"
                    )

                result = response.json()
                tx_data = result.get("result", {})

                return {
                    "queue_id": queue_id,
                    "status": tx_data.get("status"),
                    "transaction_hash": tx_data.get("transactionHash"),
                    "chain_id": tx_data.get("chainId"),
                    "from_address": tx_data.get("fromAddress"),
                    "to_address": tx_data.get("toAddress"),
                }

        except httpx.RequestError as e:
            logger.error(f"Thirdweb status check failed: {e}")
            raise ThirdwebError(f"Status check request failed: {str(e)}")

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
                response = await client.get(
                    f"{self.engine_url}/backend-wallet/{self.chain_name}/get-balance",
                    headers=self._get_headers(),
                    params={"wallet_address": address},
                    timeout=30.0,
                )

                if response.status_code != 200:
                    error_data = response.json() if response.content else {}
                    raise ThirdwebError(
                        f"Native balance check failed: {error_data.get('message', 'Unknown error')}"
                    )

                result = response.json()

                return {
                    "wallet_address": address,
                    "balance_wei": result.get("result", {}).get("value", "0"),
                    "display_value": result.get("result", {}).get("displayValue", "0"),
                    "symbol": "AVAX",
                }

        except httpx.RequestError as e:
            logger.error(f"Thirdweb native balance check failed: {e}")
            raise ThirdwebError(f"Native balance check request failed: {str(e)}")


# Singleton instance
thirdweb_service = ThirdwebService()
