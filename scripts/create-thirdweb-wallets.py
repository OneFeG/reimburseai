#!/usr/bin/env python3
"""
Create Thirdweb Server Wallets for ReimburseAI

This script creates:
1. Treasury Wallet - Signs payout transactions
2. Auditor Wallet - Receives audit fees ($0.05/audit)

Run: python scripts/create-thirdweb-wallets.py
"""

import os
import httpx
import asyncio

# Get secret key from environment
THIRDWEB_SECRET_KEY = os.getenv("THIRDWEB_SECRET_KEY")

if not THIRDWEB_SECRET_KEY:
    print("❌ THIRDWEB_SECRET_KEY not found in environment!")
    print()
    print("Get your key from: https://thirdweb.com/dashboard/settings/api-keys")
    print()
    print("Then run:")
    print("  $env:THIRDWEB_SECRET_KEY = 'your-secret-key'")
    print("  python scripts/create-thirdweb-wallets.py")
    exit(1)

ENGINE_URL = "https://engine.thirdweb.com"


async def create_server_wallet(label: str) -> dict:
    """Create a new server wallet via Thirdweb Engine API."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{ENGINE_URL}/backend-wallet/create",
            headers={
                "Authorization": f"Bearer {THIRDWEB_SECRET_KEY}",
                "Content-Type": "application/json",
            },
            json={"label": label},
            timeout=30.0,
        )
        
        if response.status_code not in (200, 201):
            print(f"❌ Failed to create wallet '{label}'")
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
        
        return response.json().get("result", {})


async def get_existing_wallets() -> list:
    """Get list of existing server wallets."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{ENGINE_URL}/backend-wallet/get-all",
            headers={
                "Authorization": f"Bearer {THIRDWEB_SECRET_KEY}",
            },
            timeout=30.0,
        )
        
        if response.status_code == 200:
            return response.json().get("result", [])
        return []


async def main():
    print()
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║        THIRDWEB SERVER WALLET SETUP                          ║")
    print("╚══════════════════════════════════════════════════════════════╝")
    print()
    
    # Check existing wallets
    print("🔍 Checking existing wallets...")
    existing = await get_existing_wallets()
    
    if existing:
        print(f"   Found {len(existing)} existing wallet(s):")
        for w in existing:
            print(f"   • {w.get('label', 'unnamed')}: {w.get('address')}")
        print()
    
    # Find or create Treasury wallet
    treasury = next((w for w in existing if "treasury" in w.get("label", "").lower()), None)
    if not treasury:
        print("📦 Creating Treasury Wallet...")
        treasury = await create_server_wallet("reimburse-treasury")
        if treasury:
            print(f"   ✅ Created: {treasury.get('address')}")
    else:
        print(f"✅ Treasury Wallet exists: {treasury.get('address')}")
    
    # Find or create Auditor wallet
    auditor = next((w for w in existing if "auditor" in w.get("label", "").lower()), None)
    if not auditor:
        print("📦 Creating Auditor Wallet...")
        auditor = await create_server_wallet("reimburse-auditor")
        if auditor:
            print(f"   ✅ Created: {auditor.get('address')}")
    else:
        print(f"✅ Auditor Wallet exists: {auditor.get('address')}")
    
    # Output for .env
    print()
    print("═" * 60)
    print("📋 ADD THESE TO YOUR backend/.env FILE:")
    print("═" * 60)
    print()
    
    if treasury:
        print(f"THIRDWEB_COMPANY_WALLET_ADDRESS={treasury.get('address')}")
    if auditor:
        print(f"THIRDWEB_AGENT_A_WALLET_ADDRESS={auditor.get('address')}")
    
    print()
    print("═" * 60)
    print("🎁 FUND YOUR WALLETS WITH TEST TOKENS:")
    print("═" * 60)
    print()
    print("1. Get test AVAX (for gas):")
    print("   https://core.app/tools/testnet-faucet/")
    if treasury:
        print(f"   Enter: {treasury.get('address')}")
    print()
    print("2. Get test USDC (for payments):")
    print("   https://faucet.circle.com/")
    print("   Select: Avalanche Fuji")
    if treasury:
        print(f"   Enter: {treasury.get('address')}")
    print()


if __name__ == "__main__":
    asyncio.run(main())
