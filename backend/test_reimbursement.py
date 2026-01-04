"""
Test script to upload a receipt and process reimbursement.
Uses the admin wallet 0x8eb3f851f597356A1BA8CB9Dbce4962f4b794940 (Suyash)
"""

import httpx
import asyncio
from pathlib import Path

API_BASE = "http://localhost:8000/api"

# Test configuration
COMPANY_ID = "e84a9f73-0d11-4971-a557-04c5a45aee50"
EMPLOYEE_ID = "3cf428e9-573b-4259-8623-c846691245a2"
# Admin wallets:
# Suyash: 0x8eb3f851f597356A1BA8CB9Dbce4962f4b794940
# Mark: 0x74efBD5F7B3cc0787B28a0814fECe6bb7Bb3928f
ADMIN_WALLET = "0x8eb3f851f597356A1BA8CB9Dbce4962f4b794940"  # Suyash's wallet

async def test_reimbursement_flow():
    """Test the full reimbursement flow with REAL USDC transfer."""
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        print("=" * 70)
        print("REIMBURSE.AI - REAL USDC Transfer Test")
        print("=" * 70)
        print(f"Admin Wallet: {ADMIN_WALLET} (Suyash)")
        print(f"Company ID: {COMPANY_ID}")
        print(f"Employee ID: {EMPLOYEE_ID}")
        print("=" * 70)
        
        # Step 1: Check health
        print("\n1. Checking API health...")
        r = await client.get(f"{API_BASE}/health")
        print(f"   ✅ Status: {r.json()['status']}")
        
        # Step 2: Verify employee exists
        print("\n2. Verifying employee...")
        r = await client.get(f"{API_BASE}/employees/wallet/{ADMIN_WALLET}")
        if r.status_code != 200:
            print(f"   ❌ Employee not found: {r.text}")
            return
        employee = r.json()
        print(f"   ✅ Employee: {employee['name']}")
        print(f"   ✅ Wallet: {employee['wallet_address']}")
        print(f"   ✅ Status: {employee['status']}")
        
        # Step 3: Verify whitelist
        print("\n3. Checking wallet whitelist...")
        r = await client.get(f"{API_BASE}/whitelist/check", params={
            "wallet_address": ADMIN_WALLET,
            "company_id": COMPANY_ID
        })
        whitelist = r.json()
        print(f"   {'✅' if whitelist['is_whitelisted'] else '❌'} Whitelisted: {whitelist['is_whitelisted']}")
        
        if not whitelist['is_whitelisted']:
            print("   ❌ ERROR: Wallet not whitelisted! Adding to whitelist...")
            r = await client.post(f"{API_BASE}/whitelist", json={
                "wallet_address": ADMIN_WALLET,
                "company_id": COMPANY_ID,
                "employee_id": EMPLOYEE_ID,
                "label": "Suyash Admin Wallet"
            })
            if r.status_code == 200:
                print("   ✅ Added to whitelist")
            else:
                print(f"   ❌ Failed to add to whitelist: {r.text}")
                return
        
        # Step 4: Create a small receipt image (under $1 USDC)
        print("\n4. Creating test receipt image...")
        receipt_path = Path(__file__).parent / "test_receipt_small.png"
        
        # Create a simple receipt image with PIL
        try:
            from PIL import Image, ImageDraw, ImageFont
            img = Image.new('RGB', (400, 500), color='white')
            draw = ImageDraw.Draw(img)
            
            # Receipt text for a small amount (under $1)
            receipt_lines = [
                "================================",
                "       CAFE EXPRESS",
                "   123 Main Street, City",
                "================================",
                "",
                f"Date: 2026-01-03",
                "Time: 10:30 AM",
                "",
                "--------------------------------",
                "Small Coffee        x1    $0.75",
                "--------------------------------",
                "",
                "Subtotal:               $0.75",
                "Tax (8%):               $0.06",
                "--------------------------------",
                "TOTAL:                  $0.81",
                "--------------------------------",
                "",
                "Payment: Card",
                "Auth: XXXX1234",
                "",
                "Thank you for your visit!",
                "================================",
            ]
            
            y_pos = 20
            for line in receipt_lines:
                draw.text((20, y_pos), line, fill='black')
                y_pos += 18
            
            img.save(receipt_path)
            print(f"   ✅ Created receipt: {receipt_path}")
            print(f"   📝 Receipt Amount: $0.81 (small coffee)")
        except ImportError:
            print("   ⚠️ PIL not available, using existing receipt")
        
        # Step 5: Upload and process receipt
        print("\n5. Uploading receipt and processing reimbursement...")
        print("   (This will trigger AI audit + REAL USDC transfer)")
        
        with open(receipt_path, "rb") as f:
            files = {"file": ("test_receipt.png", f, "image/png")}
            data = {
                "employee_id": EMPLOYEE_ID,
                "company_id": COMPANY_ID,
                "description": "Small coffee - $0.81",
                "category": "food"
            }
            
            try:
                r = await client.post(
                    f"{API_BASE}/reimburse/upload-and-process",
                    files=files,
                    data=data
                )
                
                print(f"\n   Response Status: {r.status_code}")
                
                if r.status_code != 200:
                    print(f"   ❌ ERROR: {r.text}")
                    return
                    
                result = r.json()
                print(f"\n   {'✅' if result.get('success') else '❌'} RESULT:")
                print(f"   - Receipt ID: {result.get('receipt_id')}")
                print(f"   - Status: {result.get('status')}")
                print(f"   - Amount: ${result.get('amount_usd', 0):.2f} USD")
                print(f"   - Decision: {result.get('decision_reason')}")
                
                if result.get('payout_queue_id'):
                    print(f"\n   💰 PAYOUT INITIATED!")
                    print(f"   - Queue ID: {result.get('payout_queue_id')}")
                    print(f"   - Check Thirdweb Dashboard for transaction status")
                
                if result.get('ledger_entry_id'):
                    print(f"   - Ledger Entry: {result.get('ledger_entry_id')}")
                    
            except httpx.ReadTimeout:
                print("   ⏱️ Request timed out - check backend logs")
            except Exception as e:
                print(f"   ❌ ERROR: {e}")
        
        print("\n" + "=" * 70)
        print("Test complete! Check Thirdweb dashboard for transaction status.")
        print("Snowtrace (Fuji): https://testnet.snowtrace.io/")
        print("=" * 70)


if __name__ == "__main__":
    asyncio.run(test_reimbursement_flow())
