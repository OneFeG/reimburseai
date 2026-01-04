"""
Test script for the full reimbursement flow with USDC payouts.

Prerequisites:
1. The treasury wallet needs AVAX for gas fees
   - Wallet: 0xF6071cB48C3394482dC30d3da74A3C1adCcB032c
   - Faucet: https://faucet.avax.network/
   
2. The treasury wallet needs USDC for transfers
   - Currently has 1.0 USDC (transferred previously)

3. Backend must be running: uv run python run.py
"""

import asyncio
import sys
from decimal import Decimal
from pathlib import Path

# Add the backend directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

from web3 import Web3
from app.config import settings
from app.services.thirdweb import thirdweb_service, ThirdwebError


async def check_balances():
    """Check all relevant wallet balances."""
    w3 = Web3(Web3.HTTPProvider('https://api.avax-test.network/ext/bc/C/rpc'))
    
    usdc_abi = [{
        'constant': True,
        'inputs': [{'name': '_owner', 'type': 'address'}],
        'name': 'balanceOf',
        'outputs': [{'name': 'balance', 'type': 'uint256'}],
        'type': 'function'
    }]
    usdc = w3.eth.contract(
        address=Web3.to_checksum_address(settings.usdc_token_address),
        abi=usdc_abi
    )
    
    print("=" * 70)
    print("WALLET BALANCES")
    print("=" * 70)
    
    # Treasury wallet (from private key)
    if settings.treasury_private_key:
        account = w3.eth.account.from_key(settings.treasury_private_key)
        sender = account.address
        avax = w3.eth.get_balance(sender)
        usdc_bal = usdc.functions.balanceOf(sender).call()
        
        print(f"\n📦 Treasury Wallet (Direct Transfers):")
        print(f"   Address: {sender}")
        print(f"   AVAX: {w3.from_wei(avax, 'ether'):.6f}")
        print(f"   USDC: ${usdc_bal / 1_000_000:.2f}")
        
        if avax == 0:
            print("\n   ⚠️  WARNING: No AVAX for gas!")
            print("   Fund at: https://faucet.avax.network/")
            return False
    else:
        print("\n❌ No TREASURY_PRIVATE_KEY configured")
        return False
    
    # Thirdweb company wallet
    company_avax = w3.eth.get_balance(settings.thirdweb_company_wallet_address)
    company_usdc = usdc.functions.balanceOf(settings.thirdweb_company_wallet_address).call()
    
    print(f"\n🏢 Thirdweb Company Wallet:")
    print(f"   Address: {settings.thirdweb_company_wallet_address}")
    print(f"   AVAX: {w3.from_wei(company_avax, 'ether'):.6f}")
    print(f"   USDC: ${company_usdc / 1_000_000:.2f}")
    
    # Recipient wallet (admin)
    recipient = "0x8eb3f851f597356A1BA8CB9Dbce4962f4b794940"
    recipient_usdc = usdc.functions.balanceOf(recipient).call()
    
    print(f"\n👤 Recipient (Suyash Admin):")
    print(f"   Address: {recipient}")
    print(f"   USDC: ${recipient_usdc / 1_000_000:.2f}")
    
    print("=" * 70)
    return True


async def test_transfer():
    """Test a small USDC transfer."""
    print("\n" + "=" * 70)
    print("TESTING USDC TRANSFER")
    print("=" * 70)
    
    recipient = "0x8eb3f851f597356A1BA8CB9Dbce4962f4b794940"
    amount = Decimal("0.05")  # $0.05 test
    
    print(f"\n💸 Transfer Details:")
    print(f"   To: {recipient}")
    print(f"   Amount: ${amount} USDC")
    
    try:
        result = await thirdweb_service.transfer_usdc(
            to_address=recipient,
            amount_usd=amount,
        )
        
        print("\n✅ TRANSFER SUCCESSFUL!")
        print(f"   Transaction Hash: {result.get('transaction_hash', 'N/A')}")
        print(f"   Amount: ${result.get('amount_usd', 'N/A')} USDC")
        
        if result.get('transaction_hash'):
            print(f"\n   View on Snowtrace:")
            print(f"   https://testnet.snowtrace.io/tx/{result['transaction_hash']}")
        
        return True
        
    except ThirdwebError as e:
        print(f"\n❌ Transfer failed: {e}")
        return False


async def main():
    print("\n" + "🚀" * 35)
    print("   REIMBURSE.AI - USDC TRANSFER TEST")
    print("🚀" * 35)
    
    # Check balances first
    can_transfer = await check_balances()
    
    if not can_transfer:
        print("\n❌ Cannot proceed - please fund the treasury wallet with AVAX")
        return
    
    # Confirm before transfer
    print("\n" + "-" * 70)
    response = input("Proceed with test transfer of $0.05 USDC? (yes/no): ")
    
    if response.lower() != 'yes':
        print("Transfer cancelled.")
        return
    
    # Execute transfer
    success = await test_transfer()
    
    if success:
        print("\n" + "=" * 70)
        print("✅ TEST COMPLETED SUCCESSFULLY!")
        print("=" * 70)
        print("\nThe direct web3 transfer is working.")
        print("You can now test the full reimbursement flow.")
    else:
        print("\n" + "=" * 70)
        print("❌ TEST FAILED")
        print("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())
