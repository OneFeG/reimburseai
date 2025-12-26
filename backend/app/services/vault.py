"""
Vault Deployment Service (Phase 1 - Factory Contract).

Handles automated deployment of self-custodial Treasury Vaults
for each onboarding company using Thirdweb SDK.

Architecture:
- Factory Contract: Deploys unique vault per company
- RBAC: Operator (app) can only execute payments
- Admin: Client retains withdrawal privileges
"""

import logging
from datetime import UTC, datetime
from typing import Any

import httpx

from app.config import settings
from app.db.supabase import get_supabase_admin_client

logger = logging.getLogger(__name__)


class VaultDeploymentError(Exception):
    """Custom exception for vault deployment operations."""

    pass


class VaultService:
    """
    Service for deploying and managing Treasury Vaults via Thirdweb.

    Each company gets a unique self-custodial vault where:
    - Company admin has full control (withdraw, manage)
    - Application has operator role (execute approved payments only)

    Automatically uses mainnet or testnet based on settings.use_mainnet.
    """

    # Role identifiers for RBAC
    ROLE_ADMIN = "0x0000000000000000000000000000000000000000000000000000000000000000"
    ROLE_OPERATOR = "OPERATOR"

    def __init__(self):
        self.engine_url = settings.thirdweb_engine_url
        self.secret_key = settings.thirdweb_secret_key
        self.deployer_wallet = settings.thirdweb_company_wallet_address
        self.client = get_supabase_admin_client()

        # Network configuration from settings
        self.chain_id = settings.actual_chain_id
        self.chain_name = settings.chain_name

    def _get_headers(self) -> dict[str, str]:
        """Get authorization headers for Thirdweb Engine API."""
        return {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
            "x-backend-wallet-address": self.deployer_wallet,
        }

    async def deploy_vault(
        self,
        company_id: str,
        admin_address: str,
        company_name: str,
    ) -> dict[str, Any]:
        """
        Deploy a new Treasury Vault for a company.

        Uses Thirdweb's Account Factory pattern to deploy
        a Smart Wallet that acts as the company vault.

        Args:
            company_id: UUID of the company
            admin_address: Wallet address that will have admin control
            company_name: Company name for metadata

        Returns:
            Dict with vault deployment details

        Raises:
            VaultDeploymentError: If deployment fails
        """
        try:
            async with httpx.AsyncClient() as client:
                # Deploy using Thirdweb's Account Factory
                # This creates a smart contract wallet for the company
                response = await client.post(
                    f"{self.engine_url}/deploy/{self.chain_name}/prebuilts/account-factory",
                    headers=self._get_headers(),
                    json={
                        "contractMetadata": {
                            "name": f"ReimburseAI Vault - {company_name}",
                            "description": f"Treasury vault for {company_name}",
                        },
                        "defaultAdmin": admin_address,
                    },
                    timeout=120.0,  # Deployment can take time
                )

                if response.status_code not in (200, 201):
                    error_data = response.json() if response.content else {}
                    raise VaultDeploymentError(
                        f"Vault deployment failed: {error_data.get('message', 'Unknown error')}"
                    )

                result = response.json()
                queue_id = result.get("result", {}).get("queueId")

                # Wait for deployment to complete
                vault_address = await self._wait_for_deployment(queue_id)

                # Grant operator role to our application
                await self._grant_operator_role(vault_address, self.deployer_wallet)

                # Update company record with vault info
                await self._update_company_vault(
                    company_id=company_id,
                    vault_address=vault_address,
                    admin_address=admin_address,
                )

                logger.info(f"Vault deployed for company {company_id}: {vault_address}")

                return {
                    "success": True,
                    "company_id": company_id,
                    "vault_address": vault_address,
                    "admin_address": admin_address,
                    "chain_id": self.chain_id,
                    "chain_name": self.chain_name,
                    "operator_address": self.deployer_wallet,
                }

        except httpx.RequestError as e:
            logger.error(f"Vault deployment request failed: {e}")
            raise VaultDeploymentError(f"Deployment request failed: {str(e)}")

    async def _wait_for_deployment(
        self,
        queue_id: str,
        max_attempts: int = 30,
        delay_seconds: int = 2,
    ) -> str:
        """
        Wait for contract deployment to complete.

        Args:
            queue_id: Thirdweb queue ID
            max_attempts: Maximum polling attempts
            delay_seconds: Delay between attempts

        Returns:
            Deployed contract address

        Raises:
            VaultDeploymentError: If deployment fails or times out
        """
        import asyncio

        for attempt in range(max_attempts):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        f"{self.engine_url}/transaction/status/{queue_id}",
                        headers=self._get_headers(),
                        timeout=30.0,
                    )

                    if response.status_code == 200:
                        result = response.json()
                        tx_data = result.get("result", {})
                        status = tx_data.get("status")

                        if status == "mined":
                            # Get contract address from receipt
                            contract_address = tx_data.get("deployedContractAddress")
                            if contract_address:
                                return contract_address

                            # Fallback: parse from transaction receipt
                            receipt = tx_data.get("transactionReceipt", {})
                            contract_address = receipt.get("contractAddress")
                            if contract_address:
                                return contract_address

                            raise VaultDeploymentError(
                                "Deployment mined but contract address not found"
                            )

                        elif status == "errored":
                            error_msg = tx_data.get("errorMessage", "Unknown error")
                            raise VaultDeploymentError(f"Deployment failed: {error_msg}")

                        # Still pending, continue waiting

            except httpx.RequestError as e:
                logger.warning(f"Status check failed (attempt {attempt + 1}): {e}")

            await asyncio.sleep(delay_seconds)

        raise VaultDeploymentError("Deployment timed out waiting for confirmation")

    async def _grant_operator_role(
        self,
        vault_address: str,
        operator_address: str,
    ) -> None:
        """
        Grant operator role to application wallet.

        Operator can execute pre-approved payments but cannot
        withdraw funds or change permissions.

        Args:
            vault_address: The vault contract address
            operator_address: Address to grant operator role
        """
        try:
            async with httpx.AsyncClient() as client:
                # Grant role using Thirdweb's permissions extension
                response = await client.post(
                    f"{self.engine_url}/contract/{self.chain_name}/{vault_address}/write",
                    headers=self._get_headers(),
                    json={
                        "functionName": "grantRole",
                        "args": [
                            self._get_operator_role_hash(),
                            operator_address,
                        ],
                    },
                    timeout=60.0,
                )

                if response.status_code not in (200, 201):
                    logger.warning(f"Could not grant operator role: {response.text}")
                    # Non-fatal - vault still works, just without role separation

        except Exception as e:
            logger.warning(f"Operator role grant failed: {e}")

    def _get_operator_role_hash(self) -> str:
        """Get keccak256 hash of OPERATOR role."""
        from hashlib import sha3_256

        return "0x" + sha3_256(b"OPERATOR").hexdigest()

    async def _update_company_vault(
        self,
        company_id: str,
        vault_address: str,
        admin_address: str,
    ) -> None:
        """
        Update company record with vault information.

        Args:
            company_id: Company UUID
            vault_address: Deployed vault address
            admin_address: Admin wallet address
        """
        self.client.table("companies").update(
            {
                "vault_address": vault_address,
                "vault_chain_id": self.chain_id,
                "vault_deployed_at": datetime.now(UTC).isoformat(),
                "vault_admin_address": admin_address,
            }
        ).eq("id", company_id).execute()

    async def get_vault_balance(
        self,
        vault_address: str,
        token_address: str | None = None,
    ) -> dict[str, Any]:
        """
        Get balance of vault (native or ERC20).

        Args:
            vault_address: Vault contract address
            token_address: ERC20 token address (None for native)

        Returns:
            Balance information
        """
        try:
            async with httpx.AsyncClient() as client:
                if token_address:
                    # ERC20 balance
                    response = await client.get(
                        f"{self.engine_url}/contract/{self.chain_name}/{token_address}/erc20/balance-of",
                        headers=self._get_headers(),
                        params={"wallet_address": vault_address},
                        timeout=30.0,
                    )
                else:
                    # Native balance
                    response = await client.get(
                        f"{self.engine_url}/backend-wallet/{self.chain_name}/get-balance",
                        headers=self._get_headers(),
                        params={"wallet_address": vault_address},
                        timeout=30.0,
                    )

                if response.status_code != 200:
                    error_data = response.json() if response.content else {}
                    raise VaultDeploymentError(
                        f"Balance check failed: {error_data.get('message', 'Unknown error')}"
                    )

                result = response.json()
                return {
                    "vault_address": vault_address,
                    "balance": result.get("result", {}),
                    "token_address": token_address,
                }

        except httpx.RequestError as e:
            raise VaultDeploymentError(f"Balance check failed: {str(e)}")

    async def check_operator_permissions(
        self,
        vault_address: str,
        operator_address: str,
    ) -> dict[str, Any]:
        """
        Check if an address has operator permissions on a vault.

        Args:
            vault_address: Vault contract address
            operator_address: Address to check

        Returns:
            Permission status
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.engine_url}/contract/{self.chain_name}/{vault_address}/read",
                    headers=self._get_headers(),
                    params={
                        "functionName": "hasRole",
                        "args": f"{self._get_operator_role_hash()},{operator_address}",
                    },
                    timeout=30.0,
                )

                if response.status_code == 200:
                    result = response.json()
                    has_role = result.get("result", False)
                    return {
                        "vault_address": vault_address,
                        "operator_address": operator_address,
                        "has_operator_role": has_role,
                    }

                return {
                    "vault_address": vault_address,
                    "operator_address": operator_address,
                    "has_operator_role": False,
                    "error": "Could not verify role",
                }

        except Exception as e:
            return {
                "vault_address": vault_address,
                "operator_address": operator_address,
                "has_operator_role": False,
                "error": str(e),
            }

    async def get_vault_info(self, company_id: str) -> dict[str, Any] | None:
        """
        Get vault information for a company.

        Args:
            company_id: Company UUID

        Returns:
            Vault info or None if not deployed
        """
        result = (
            self.client.table("companies")
            .select(
                "id, name, vault_address, vault_chain_id, vault_deployed_at, vault_admin_address"
            )
            .eq("id", company_id)
            .execute()
        )

        if not result.data:
            return None

        company = result.data[0]
        if not company.get("vault_address"):
            return None

        return {
            "company_id": company["id"],
            "company_name": company["name"],
            "vault_address": company["vault_address"],
            "chain_id": company["vault_chain_id"],
            "deployed_at": company["vault_deployed_at"],
            "admin_address": company.get("vault_admin_address"),
        }


# Singleton instance
vault_service = VaultService()
