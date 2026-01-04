"""Test ERC-4337 execution mode via Thirdweb API."""
import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()


async def test_erc4337():
    secret_key = os.getenv("THIRDWEB_SECRET_KEY")
    company_wallet = os.getenv("THIRDWEB_COMPANY_WALLET_ADDRESS")

    print(f"Company wallet: {company_wallet}")
    print(f"Secret key present: {bool(secret_key)}")

    if not company_wallet:
        print("No company wallet address found!")
        return

    # Test ERC-4337 with correct wallet
    payload = {
        "from": company_wallet,
        "chainId": 43113,
        "calls": [
            {
                "contractAddress": "0x5425890298aed601595a70AB815c96711a31Bc65",
                "method": "function transfer(address to, uint256 amount)",
                "params": [
                    "0x8eb3f851f597356A1BA8CB9Dbce4962f4b794940",
                    "10000",
                ],
            }
        ],
        "executionOptions": {
            "type": "ERC4337",
            "sponsorGas": True,
        },
    }

    print(f"Sending request with ERC4337 type...")
    print(f"Payload executionOptions: {payload['executionOptions']}")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.thirdweb.com/v1/contracts/write",
            headers={
                "x-secret-key": secret_key,
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=30.0,
        )
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")

        if resp.status_code in (200, 201, 202):
            result = resp.json()
            tx_ids = result.get("result", {}).get("transactionIds", [])
            if tx_ids:
                queue_id = tx_ids[0]
                print(f"\nTransaction queued: {queue_id}")
                print("Waiting 5 seconds to check status...")
                await asyncio.sleep(5)

                status_resp = await client.get(
                    f"https://api.thirdweb.com/v1/transactions/{queue_id}",
                    headers={"x-secret-key": secret_key},
                )
                status_data = status_resp.json()
                result_data = status_data.get("result", {})
                exec_params = result_data.get("executionParams", {})
                status = result_data.get("status")
                error = result_data.get("errorMessage", "")

                print(f"Status: {status}")
                print(f"Execution type used: {exec_params.get('type')}")
                if error:
                    print(f"Error: {error}")


if __name__ == "__main__":
    asyncio.run(test_erc4337())
