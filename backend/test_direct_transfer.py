"""
Test script for direct USDC transfer using web3.py.
Bypasses Thirdweb's EIP-7702 bundler which doesn't work on Avalanche Fuji.

Prerequisites:
1. Add TREASURY_PRIVATE_KEY to .env
2. Fund the wallet with AVAX (for gas) and USDC (for transfers)
"""

import asyncio
from decimal import Decimal
from dotenv import load_dotenv

load_dotenv()

from app.config import settings
from app.services.thirdweb import thirdweb_service, ThirdwebError
from web3 import Web3


async def main():
    print("=" * 70)
    print("DIRECT USDC TRANSFER TEST")
    print("=" * 70)
    
    # Check configuration
    print("\n1. Checking Configuration...")
    print(f"   Treasury Private Key configured: {bool(settings.treasury_private_key)}")
    print(f"   Company Wallet: {settings.thirdweb_company_wallet_address}")
    print(f"   Chain ID: {settings.actual_chain_id}")
    print(f"   USDC Address: {settings.usdc_token_address}")
    
    if not settings.treasury_private_key:
        print("\n❌ ERROR: TREASURY_PRIVATE_KEY not configured!")
        print("   Add to .env: TREASURY_PRIVATE_KEY=0x...")
        return
    
    # Get sender address from private key
    w3 = Web3(Web3.HTTPProvider("https://api.avax-test.network/ext/bc/C/rpc"))
    account = w3.eth.account.from_key(settings.treasury_private_key)
    sender_address = account.address
    
    print(f"\n2. Wallet derived from private key:")
    print(f"   Address: {sender_address}")
    
    # Check balances
    print("\n3. Checking Balances...")
    
    # AVAX balance
    avax_balance = w3.eth.get_balance(sender_address)
    avax_balance_eth = w3.from_wei(avax_balance, 'ether')
    print(f"   AVAX Balance: {avax_balance_eth:.6f} AVAX")
    
    if avax_balance == 0:
        print("\n❌ ERROR: No AVAX for gas fees!")
        print("   Get testnet AVAX: https://faucet.avax.network/")
        return
    
    # USDC balance
    usdc_abi = [
        {
            "constant": True,
            "inputs": [{"name": "_owner", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"name": "balance", "type": "uint256"}],
            "type": "function"
        }
    ]
    usdc_contract = w3.eth.contract(
        address=Web3.to_checksum_address(settings.usdc_token_address),
        abi=usdc_abi
    )
    usdc_balance = usdc_contract.functions.balanceOf(sender_address).call()
    usdc_balance_usd = usdc_balance / 1_000_000
    print(f"   USDC Balance: ${usdc_balance_usd:.2f} USDC")
    
    if usdc_balance == 0:
        print("\n❌ ERROR: No USDC to transfer!")
        print("   Transfer USDC to this wallet first.")
        return
    
    # Test recipient (your admin wallet)
    recipient = "0x8eb3f851f597356A1BA8CB9Dbce4962f4b794940"
    test_amount = Decimal("0.10")  # $0.10 test transfer
    
    print(f"\n4. Test Transfer:")
    print(f"   From: {sender_address}")
    print(f"   To: {recipient}")
    print(f"   Amount: ${test_amount} USDC")
    
    # Confirm
    confirm = input("\n   Proceed with transfer? (yes/no): ")
    if confirm.lower() != 'yes':
        print("   Transfer cancelled.")
        return
    
    print("\n5. Executing Transfer...")
    try:
        result = await thirdweb_service.transfer_usdc_direct(recipient, test_amount)
        
        print("\n" + "=" * 70)
        print("✅ TRANSFER SUCCESSFUL!")
        print("=" * 70)
        print(f"   Transaction Hash: {result['transaction_hash']}")
        print(f"   Amount: ${result['amount_usd']} USDC")
        print(f"   Block: {result.get('block_number', 'N/A')}")
        print(f"   Gas Used: {result.get('gas_used', 'N/A')}")
        print(f"\n   View on Snowtrace:")
        print(f"   https://testnet.snowtrace.io/tx/{result['transaction_hash']}")
        
    except ThirdwebError as e:
        print(f"\n❌ Transfer failed: {e}")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")


if __name__ == "__main__":
    asyncio.run(main())
