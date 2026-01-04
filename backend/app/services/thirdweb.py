"""
Thirdweb Service for blockchain operations.

Handles USDC transfers and wallet management via Thirdweb REST API.
Supports both EIP-7702 chains (uses Thirdweb) and non-EIP7702 chains (uses direct web3.py transfer).
"""

import logging
from decimal import Decimal
from typing import Any

import httpx
from web3 import Web3
from eth_account import Account

from app.config import settings

logger = logging.getLogger(__name__)


# Chains that support EIP-7702 (Pectra upgrade)
# These chains can use Thirdweb's advanced account abstraction features
EIP7702_SUPPORTED_CHAINS = {
    1,      # Ethereum Mainnet (post-Pectra upgrade)
    11155111,  # Sepolia testnet
}

# Chains that do NOT support EIP-7702 (require direct transfers)
# These include L2s and other chains that haven't adopted Pectra
NON_EIP7702_CHAINS = {
    43113,  # Avalanche Fuji Testnet
    43114,  # Avalanche Mainnet
    137,    # Polygon Mainnet
    80001,  # Polygon Mumbai (deprecated)
    80002,  # Polygon Amoy
    42161,  # Arbitrum One
    421614, # Arbitrum Sepolia
    10,     # Optimism Mainnet
    11155420,  # Optimism Sepolia
    8453,   # Base Mainnet
    84532,  # Base Sepolia
}


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
        
        # Treasury private key for direct transfers (non-EIP7702 chains)
        self.treasury_private_key = getattr(settings, 'treasury_private_key', None)
        
        # Determine if this chain supports EIP-7702
        self.supports_eip7702 = self._check_eip7702_support()
        
        # Initialize Web3 for direct transfers if needed
        self.web3 = None
        if not self.supports_eip7702:
            self._init_web3()
            
        logger.info(
            f"ThirdwebService initialized for chain {self.chain_id} ({self.chain_name}). "
            f"EIP-7702 support: {self.supports_eip7702}"
        )
    
    def _check_eip7702_support(self) -> bool:
        """
        Check if the current chain supports EIP-7702.
        
        EIP-7702 is part of the Pectra upgrade and enables advanced
        account abstraction features. Chains without this support
        require direct web3.py transfers.
        """
        if self.chain_id in EIP7702_SUPPORTED_CHAINS:
            return True
        if self.chain_id in NON_EIP7702_CHAINS:
            return False
        # Default to non-EIP7702 for unknown chains (safer)
        logger.warning(
            f"Unknown chain ID {self.chain_id}, defaulting to non-EIP7702 mode"
        )
        return False
    
    def _init_web3(self):
        """Initialize Web3 connection for direct transfers."""
        # RPC URLs for different chains
        rpc_urls = {
            43113: "https://api.avax-test.network/ext/bc/C/rpc",  # Avalanche Fuji
            43114: "https://api.avax.network/ext/bc/C/rpc",  # Avalanche Mainnet
            137: "https://polygon-rpc.com",  # Polygon Mainnet
            80002: "https://rpc-amoy.polygon.technology",  # Polygon Amoy
            42161: "https://arb1.arbitrum.io/rpc",  # Arbitrum One
            421614: "https://sepolia-rollup.arbitrum.io/rpc",  # Arbitrum Sepolia
            10: "https://mainnet.optimism.io",  # Optimism
            11155420: "https://sepolia.optimism.io",  # Optimism Sepolia
            8453: "https://mainnet.base.org",  # Base
            84532: "https://sepolia.base.org",  # Base Sepolia
        }
        
        rpc_url = rpc_urls.get(self.chain_id)
        if rpc_url:
            self.web3 = Web3(Web3.HTTPProvider(rpc_url))
            logger.info(f"Web3 initialized for chain {self.chain_id}")
        else:
            logger.warning(f"No RPC URL configured for chain {self.chain_id}")

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
        
        Automatically selects the transfer method based on chain support:
        - EIP-7702 chains: Uses Thirdweb REST API
        - Non-EIP7702 chains: Uses direct web3.py transfer

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
        
        if self.supports_eip7702:
            logger.info(f"Using Thirdweb REST API for EIP-7702 chain {self.chain_id}")
            return await self._transfer_usdc_thirdweb(to_address, amount_usd, amount_wei)
        else:
            logger.info(f"Using direct web3.py transfer for non-EIP7702 chain {self.chain_id}")
            return await self._transfer_usdc_direct(to_address, amount_usd, amount_wei)
    
    async def _transfer_usdc_direct(
        self,
        to_address: str,
        amount_usd: Decimal,
        amount_wei: int,
    ) -> dict[str, Any]:
        """
        Transfer USDC using direct web3.py transfer.
        
        Used for non-EIP7702 chains like Avalanche, Polygon, Arbitrum, etc.
        """
        if not self.web3:
            raise ThirdwebError("Web3 not initialized for direct transfers")
        
        if not self.treasury_private_key:
            raise ThirdwebError("Treasury private key not configured for direct transfers")
        
        try:
            # ERC20 transfer function ABI
            erc20_abi = [
                {
                    "constant": False,
                    "inputs": [
                        {"name": "_to", "type": "address"},
                        {"name": "_value", "type": "uint256"}
                    ],
                    "name": "transfer",
                    "outputs": [{"name": "", "type": "bool"}],
                    "type": "function"
                }
            ]
            
            # Create contract instance
            usdc_contract = self.web3.eth.contract(
                address=Web3.to_checksum_address(self.usdc_token_address),
                abi=erc20_abi
            )
            
            # Get account from private key
            account = Account.from_key(self.treasury_private_key)
            
            # Build transaction
            nonce = self.web3.eth.get_transaction_count(account.address)
            gas_price = self.web3.eth.gas_price
            
            # Estimate gas
            try:
                gas_estimate = usdc_contract.functions.transfer(
                    Web3.to_checksum_address(to_address),
                    amount_wei
                ).estimate_gas({'from': account.address})
            except Exception as e:
                logger.warning(f"Gas estimation failed, using default: {e}")
                gas_estimate = 100000  # Default gas limit for ERC20 transfer
            
            # Build transaction
            tx = usdc_contract.functions.transfer(
                Web3.to_checksum_address(to_address),
                amount_wei
            ).build_transaction({
                'chainId': self.chain_id,
                'gas': int(gas_estimate * 1.2),  # 20% buffer
                'gasPrice': gas_price,
                'nonce': nonce,
            })
            
            # Sign and send transaction
            signed_tx = self.web3.eth.account.sign_transaction(tx, self.treasury_private_key)
            tx_hash = self.web3.eth.send_raw_transaction(signed_tx.raw_transaction)
            tx_hash_hex = tx_hash.hex()
            
            logger.info(f"Direct USDC transfer initiated: {amount_usd} USD to {to_address}, tx: {tx_hash_hex}")
            
            return {
                "success": True,
                "transaction_hash": tx_hash_hex,
                "queue_id": tx_hash_hex,  # For compatibility
                "to_address": to_address,
                "amount_usd": float(amount_usd),
                "amount_wei": amount_wei,
                "method": "direct_web3",
                "chain_id": self.chain_id,
            }
            
        except Exception as e:
            logger.error(f"Direct USDC transfer failed: {e}")
            raise ThirdwebError(f"Direct transfer failed: {str(e)}")
    
    async def _transfer_usdc_thirdweb(
        self,
        to_address: str,
        amount_usd: Decimal,
        amount_wei: int,
    ) -> dict[str, Any]:
        """
        Transfer USDC using Thirdweb REST API.
        
        Used for EIP-7702 compatible chains (Ethereum mainnet post-Pectra).
        """
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
                    "method": "thirdweb_api",
                    "chain_id": self.chain_id,
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
