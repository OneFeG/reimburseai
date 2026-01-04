"""
Thirdweb Service for blockchain operations.

Handles USDC transfers and wallet management.

IMPORTANT: Thirdweb's public REST API (api.thirdweb.com) ONLY supports EIP-7702
bundler mode, which most chains (including Avalanche Fuji) do NOT support.
The API ignores the executionOptions.type parameter.

CHAIN SUPPORT:
- For chains WITH EIP-7702 support (Ethereum mainnet post-Pectra, Base, etc.):
  Uses Thirdweb REST API with EIP-7702 bundler (gasless, no private key needed)
  
- For chains WITHOUT EIP-7702 support (Avalanche Fuji, Polygon, Arbitrum, etc.):
  Uses DIRECT web3.py transfer - requires:
  1. TREASURY_PRIVATE_KEY environment variable
  2. Treasury wallet funded with native gas token (AVAX for Avalanche)
  
The service automatically selects the correct method based on chain.
"""

import logging
from decimal import Decimal
from typing import Any

import httpx
from web3 import Web3

from app.config import settings

logger = logging.getLogger(__name__)

# Chains that DO NOT support EIP-7702 (need ERC-4337 mode)
# As of Jan 2026, most chains except Ethereum post-Pectra don't support 7702
CHAINS_WITHOUT_EIP7702 = {
    43113,  # Avalanche Fuji Testnet
    43114,  # Avalanche Mainnet
    137,    # Polygon Mainnet
    80001,  # Polygon Mumbai (deprecated but listed)
    80002,  # Polygon Amoy
    42161,  # Arbitrum One
    421614, # Arbitrum Sepolia
    10,     # Optimism
    11155420, # Optimism Sepolia
    56,     # BNB Chain
    97,     # BNB Chain Testnet
}


class ThirdwebError(Exception):
    """Custom exception for Thirdweb operations."""

    pass


class ThirdwebService:
    """
    Service for interacting with Thirdweb REST API for blockchain operations.

    Uses Thirdweb server wallets for USDC transfers.
    Server wallets handle gas fees and signing automatically.
    
    Supports two execution modes:
    1. EIP-7702: Default for chains with native 7702 support
    2. ERC-4337: For chains without EIP-7702 (uses smart account bundler)
    """

    USDC_DECIMALS = 6
    # Thirdweb REST API base URL
    THIRDWEB_API_URL = "https://api.thirdweb.com"
    
    # ERC-4337 EntryPoint addresses (used for smart account execution)
    # v0.6 is widely deployed, v0.7 is newer
    ENTRYPOINT_V06 = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
    ENTRYPOINT_V07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032"
    
    # ERC20 ABI for transfer function
    ERC20_ABI = [
        {
            "constant": False,
            "inputs": [
                {"name": "_to", "type": "address"},
                {"name": "_value", "type": "uint256"}
            ],
            "name": "transfer",
            "outputs": [{"name": "", "type": "bool"}],
            "type": "function"
        },
        {
            "constant": True,
            "inputs": [{"name": "_owner", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"name": "balance", "type": "uint256"}],
            "type": "function"
        }
    ]

    def __init__(self):
        self.secret_key = settings.thirdweb_secret_key
        self.company_wallet = settings.thirdweb_company_wallet_address
        self.agent_a_wallet = settings.thirdweb_agent_a_wallet_address
        self.treasury_private_key = settings.treasury_private_key

        # Network configuration from settings
        self.chain_id = settings.actual_chain_id
        self.chain_name = settings.chain_name
        self.usdc_token_address = settings.usdc_token_address
        
        # Determine execution mode based on chain support
        self.use_erc4337 = self.chain_id in CHAINS_WITHOUT_EIP7702
        
        # Web3 connection for direct transactions (fallback)
        rpc_url = "https://api.avax-test.network/ext/bc/C/rpc" if self.chain_id == 43113 else "https://api.avax.network/ext/bc/C/rpc"
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        
        logger.info(f"ThirdwebService initialized:")
        logger.info(f"  Company wallet: {self.company_wallet}")
        logger.info(f"  Chain ID: {self.chain_id}")
        logger.info(f"  USDC: {self.usdc_token_address}")
        logger.info(f"  Web3 connected: {self.w3.is_connected()}")
        logger.info(f"  Execution mode: {'ERC-4337' if self.use_erc4337 else 'EIP-7702'}")
        logger.info(f"  Direct transfer fallback: {bool(self.treasury_private_key)}")

    def _get_headers(self) -> dict[str, str]:
        """Get authorization headers for Thirdweb REST API."""
        return {
            "x-secret-key": self.secret_key,
            "Content-Type": "application/json",
        }

    def _encode_transfer_data(self, to_address: str, amount_wei: int) -> str:
        """
        Encode ERC20 transfer function call data.
        
        transfer(address to, uint256 amount)
        Function selector: 0xa9059cbb
        """
        # Function selector for transfer(address,uint256)
        selector = "a9059cbb"
        # Pad address to 32 bytes (remove 0x, left pad with zeros)
        to_padded = to_address.lower().replace("0x", "").zfill(64)
        # Convert amount to hex and pad to 32 bytes
        amount_hex = hex(amount_wei)[2:].zfill(64)
        
        return f"0x{selector}{to_padded}{amount_hex}"

    async def transfer_usdc_direct(
        self,
        to_address: str,
        amount_usd: Decimal,
    ) -> dict[str, Any]:
        """
        Transfer USDC using direct web3.py transaction (bypasses Thirdweb bundler).
        
        This method is needed because Thirdweb's EIP-7702 bundler doesn't work
        on Avalanche Fuji testnet.

        Args:
            to_address: Recipient wallet address
            amount_usd: Amount in USD (will be converted to USDC wei)

        Returns:
            Dict with transaction details

        Raises:
            ThirdwebError: If transfer fails
        """
        if not self.treasury_private_key:
            raise ThirdwebError(
                "TREASURY_PRIVATE_KEY not configured. "
                "Direct transfers require a private key."
            )
        
        # Convert USD to USDC wei (6 decimals)
        amount_wei = int(amount_usd * (10**self.USDC_DECIMALS))

        logger.info(f"=" * 60)
        logger.info(f"USDC DIRECT TRANSFER (web3.py)")
        logger.info(f"=" * 60)
        logger.info(f"Amount: {amount_usd} USD ({amount_wei} wei)")
        logger.info(f"To: {to_address}")
        logger.info(f"From wallet: {self.company_wallet}")
        logger.info(f"USDC contract: {self.usdc_token_address}")
        logger.info(f"Chain ID: {self.chain_id}")

        try:
            # Get the sender address from private key
            account = self.w3.eth.account.from_key(self.treasury_private_key)
            sender_address = account.address
            
            logger.info(f"Sender address (from private key): {sender_address}")
            
            # Create USDC contract instance
            usdc_contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(self.usdc_token_address),
                abi=self.ERC20_ABI
            )
            
            # Get current nonce
            nonce = self.w3.eth.get_transaction_count(sender_address)
            logger.info(f"Nonce: {nonce}")
            
            # Get gas price
            gas_price = self.w3.eth.gas_price
            logger.info(f"Gas price: {gas_price} wei")
            
            # Build the transfer transaction
            transfer_txn = usdc_contract.functions.transfer(
                Web3.to_checksum_address(to_address),
                amount_wei
            ).build_transaction({
                'chainId': self.chain_id,
                'gas': 100000,  # ERC20 transfers typically use ~65k gas
                'gasPrice': gas_price,
                'nonce': nonce,
            })
            
            logger.info(f"Transaction built: {transfer_txn}")
            
            # Sign the transaction
            signed_txn = self.w3.eth.account.sign_transaction(
                transfer_txn, 
                private_key=self.treasury_private_key
            )
            
            logger.info(f"Transaction signed")
            
            # Send the transaction
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
            tx_hash_hex = tx_hash.hex()
            
            logger.info(f"=" * 60)
            logger.info(f"USDC TRANSFER SUBMITTED!")
            logger.info(f"Transaction Hash: {tx_hash_hex}")
            logger.info(f"=" * 60)
            
            # Wait for transaction receipt (with timeout)
            logger.info("Waiting for transaction confirmation...")
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            success = receipt['status'] == 1
            
            if success:
                logger.info(f"=" * 60)
                logger.info(f"USDC TRANSFER CONFIRMED!")
                logger.info(f"Block: {receipt['blockNumber']}")
                logger.info(f"Gas Used: {receipt['gasUsed']}")
                logger.info(f"=" * 60)
            else:
                logger.error(f"Transaction failed! Receipt: {receipt}")
                raise ThirdwebError("Transaction reverted on-chain")
            
            return {
                "success": success,
                "transaction_hash": tx_hash_hex,
                "to_address": to_address,
                "amount_usd": float(amount_usd),
                "amount_wei": amount_wei,
                "block_number": receipt['blockNumber'],
                "gas_used": receipt['gasUsed'],
            }

        except Exception as e:
            logger.error(f"Direct transfer failed: {e}")
            raise ThirdwebError(f"Direct USDC transfer failed: {str(e)}")

    async def transfer_usdc(
        self,
        to_address: str,
        amount_usd: Decimal,
    ) -> dict[str, Any]:
        """
        Transfer USDC from company wallet to an employee wallet.

        IMPORTANT: Thirdweb's public REST API (api.thirdweb.com) defaults to EIP-7702
        bundler which does NOT support most chains (including Avalanche Fuji).
        The API ignores executionOptions.type: "ERC4337" parameter.
        
        For chains without EIP-7702 support (most chains as of Jan 2026):
        - Uses direct web3.py transfer (requires TREASURY_PRIVATE_KEY with AVAX for gas)
        
        For chains WITH EIP-7702 support (Ethereum mainnet post-Pectra):
        - Uses Thirdweb REST API with default EIP-7702 mode

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

        logger.info(f"=" * 60)
        logger.info(f"USDC TRANSFER INITIATED")
        logger.info(f"=" * 60)
        logger.info(f"Amount: {amount_usd} USD ({amount_wei} wei)")
        logger.info(f"To: {to_address}")
        logger.info(f"From wallet: {self.company_wallet}")
        logger.info(f"USDC contract: {self.usdc_token_address}")
        logger.info(f"Chain ID: {self.chain_id}")
        logger.info(f"EIP-7702 supported: {not self.use_erc4337}")
        
        # For chains WITHOUT EIP-7702 support, use direct web3 transfer
        # Thirdweb's public API does NOT support forcing ERC-4337 mode
        if self.use_erc4337:
            if self.treasury_private_key:
                logger.info("Chain doesn't support EIP-7702 - using direct web3 transfer")
                return await self.transfer_usdc_direct(to_address, amount_usd)
            else:
                raise ThirdwebError(
                    f"Chain {self.chain_id} doesn't support EIP-7702 and "
                    f"TREASURY_PRIVATE_KEY is not configured for direct transfers. "
                    f"Please either: 1) Set TREASURY_PRIVATE_KEY and fund wallet with AVAX, "
                    f"or 2) Switch to a chain with EIP-7702 support."
                )
        
        # For chains WITH EIP-7702 support, use Thirdweb API
        try:
            result = await self._transfer_via_thirdweb_api(to_address, amount_usd, amount_wei)
            return result
        except ThirdwebError as e:
            # If API fails, fall back to direct transfer if available
            if self.treasury_private_key:
                logger.warning(f"Thirdweb API failed ({e}), falling back to direct transfer...")
                return await self.transfer_usdc_direct(to_address, amount_usd)
            else:
                raise ThirdwebError(
                    f"Thirdweb API failed and no TREASURY_PRIVATE_KEY configured for fallback. "
                    f"Original error: {e}"
                )

    async def _transfer_via_thirdweb_api(
        self,
        to_address: str,
        amount_usd: Decimal,
        amount_wei: int,
    ) -> dict[str, Any]:
        """
        Execute transfer via Thirdweb REST API.
        
        Uses /v1/contracts/write endpoint.
        
        NOTE: This method only works on chains with EIP-7702 support.
        The Thirdweb public API does NOT support forcing ERC-4337 mode -
        the executionOptions.type parameter is ignored. For non-EIP-7702 chains,
        use transfer_usdc_direct() instead.
        """
        try:
            async with httpx.AsyncClient() as client:
                # Use Thirdweb REST API v1/contracts/write endpoint
                endpoint = f"{self.THIRDWEB_API_URL}/v1/contracts/write"
                
                logger.info(f"API Endpoint: {endpoint}")
                
                # Build the payload - Thirdweb API defaults to EIP-7702 mode
                # The executionOptions parameter is NOT supported by the public API
                payload = {
                    "chainId": self.chain_id,
                    "from": self.company_wallet,
                    "calls": [
                        {
                            "contractAddress": self.usdc_token_address,
                            "method": "function transfer(address to, uint256 amount)",
                            "params": [to_address, str(amount_wei)],
                        }
                    ],
                }
                
                logger.info(f"Payload: {payload}")

                response = await client.post(
                    endpoint,
                    headers=self._get_headers(),
                    json=payload,
                    timeout=60.0,
                )

                logger.info(f"Response status: {response.status_code}")
                response_text = response.text[:1000] if response.text else 'empty'
                logger.info(f"Response body: {response_text}")

                if response.status_code not in (200, 201, 202):
                    try:
                        error_data = response.json() if response.content else {}
                        error_msg = error_data.get('error', error_data.get('message', str(error_data)))
                    except Exception:
                        error_msg = response.text[:500] if response.text else f"HTTP {response.status_code}"
                    raise ThirdwebError(f"USDC transfer failed: {error_msg}")

                try:
                    result = response.json()
                except Exception as e:
                    logger.error(f"Failed to parse response: {response.text[:500]}")
                    raise ThirdwebError(f"Invalid response from Thirdweb: {str(e)}")

                # Extract transaction ID from result
                # API returns: {"result": {"transactionIds": ["uuid-here"]}}
                result_data = result.get("result", {})
                transaction_ids = result_data.get("transactionIds", [])
                queue_id = transaction_ids[0] if transaction_ids else result_data.get("queueId")

                logger.info(f"=" * 60)
                logger.info(f"USDC TRANSFER QUEUED SUCCESSFULLY")
                logger.info(f"Transaction ID: {queue_id}")
                logger.info(f"=" * 60)

                return {
                    "success": True,
                    "queue_id": queue_id,
                    "to_address": to_address,
                    "amount_usd": float(amount_usd),
                    "amount_wei": amount_wei,
                    "execution_mode": "EIP-7702",
                }

        except httpx.RequestError as e:
            logger.error(f"Thirdweb transfer request failed: {e}")
            raise ThirdwebError(f"Transfer request failed: {str(e)}")

    async def get_usdc_balance(
        self,
        wallet_address: str | None = None,
    ) -> dict[str, Any]:
        """
        Get USDC balance for a wallet using Thirdweb Engine API.

        Args:
            wallet_address: Wallet to check (defaults to company wallet)

        Returns:
            Dict with balance information
        """
        address = wallet_address or self.company_wallet

        try:
            async with httpx.AsyncClient() as client:
                # Use Thirdweb Engine API to read balance
                endpoint = f"{self.engine_url}/contract/{self.chain_id}/{self.usdc_token_address}/read"
                
                response = await client.get(
                    endpoint,
                    headers=self._get_headers(),
                    params={
                        "functionName": "balanceOf",
                        "args": address,
                    },
                    timeout=30.0,
                )

                if response.status_code != 200:
                    try:
                        error_data = response.json() if response.content else {}
                        error_msg = error_data.get('error', {}).get('message', 'Unknown error')
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
        Check the status of a queued transaction using Thirdweb Engine.

        Args:
            queue_id: The queue ID returned from transfer operations

        Returns:
            Dict with transaction status
        """
        try:
            async with httpx.AsyncClient() as client:
                endpoint = f"{self.engine_url}/transaction/status/{queue_id}"
                
                response = await client.get(
                    endpoint,
                    headers=self._get_headers(),
                    timeout=30.0,
                )

                if response.status_code != 200:
                    return {
                        "queue_id": queue_id,
                        "status": "unknown",
                        "chain_id": self.chain_id,
                    }

                result = response.json()
                tx_result = result.get("result", {})
                
                return {
                    "queue_id": queue_id,
                    "status": tx_result.get("status", "pending"),
                    "transaction_hash": tx_result.get("transactionHash"),
                    "chain_id": self.chain_id,
                    "mined_at": tx_result.get("minedAt"),
                    "error": tx_result.get("errorMessage"),
                }

        except Exception as e:
            logger.warning(f"Could not fetch transaction status: {e}")
            return {
                "queue_id": queue_id,
                "status": "unknown",
                "chain_id": self.chain_id,
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
