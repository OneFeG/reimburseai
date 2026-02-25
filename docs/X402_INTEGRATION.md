# x402 Payment Protocol Integration

## Overview

ReimburseAI uses the **x402 HTTP payment protocol** to gate the AI audit service. This implementation is compatible with **Thirdweb's official x402 SDK**.

## How It Works

### Protocol Flow (ERC-3009 - Gasless)

```
┌─────────┐      ┌─────────┐      ┌──────────────┐      ┌───────────────┐
│ Client  │      │ Backend │      │ Thirdweb     │      │ Blockchain    │
│ (React) │      │ (FastAPI)│     │ Facilitator  │      │ (Avalanche)   │
└────┬────┘      └────┬────┘      └──────┬───────┘      └───────┬───────┘
     │                │                   │                      │
     │ 1. POST /audit │                   │                      │
     │───────────────>│                   │                      │
     │                │                   │                      │
     │ 2. 402 + Requirements              │                      │
     │<───────────────│                   │                      │
     │                │                   │                      │
     │ 3. User signs ERC-3009 auth        │                      │
     │ (gasless - just signature)         │                      │
     │                │                   │                      │
     │ 4. POST /audit + X-Payment header  │                      │
     │───────────────>│                   │                      │
     │                │                   │                      │
     │                │ 5. Verify payment │                      │
     │                │                   │                      │
     │                │ 6. Process audit  │                      │
     │                │                   │                      │
     │                │ 7. Settle via     │                      │
     │                │ facilitator API   │                      │
     │                │──────────────────>│                      │
     │                │                   │ 8. Execute          │
     │                │                   │ transferWithAuth    │
     │                │                   │─────────────────────>│
     │                │                   │                      │
     │                │<──────────────────│ 9. Tx receipt       │
     │                │                   │                      │
     │ 10. Audit result                   │                      │
     │<───────────────│                   │                      │
```

### Key Benefits

1. **Gasless for Users**: Users only sign a message (ERC-3009 authorization), they don't pay gas
2. **Thirdweb Facilitator**: Thirdweb's infrastructure handles the on-chain transaction
3. **Automatic Retry**: Frontend SDK automatically handles 402 → payment → retry flow
4. **USDC Payments**: Uses USDC for stable pricing ($0.05 per audit)

## Implementation Files

### Backend

| File | Purpose |
|------|---------|
| `backend/app/services/x402.py` | X402Service class with verify/settle methods |
| `backend/app/api/audit.py` | Audit endpoint with x402 gating |

### Frontend

| File | Purpose |
|------|---------|
| `frontend/apps/web/src/lib/x402.ts` | Payment creation and fetchWithPayment utility |
| `frontend/apps/web/src/hooks/use-x402-payment.ts` | React hook for components |
| `frontend/apps/web/src/lib/thirdweb.ts` | Thirdweb client and x402 config |

## Usage Examples

### Frontend - Using the Hook

```tsx
import { useX402Payment } from '@/hooks';

function AuditButton({ receiptId }: { receiptId: string }) {
  const { fetchWithPayment, isPaying, error, auditFee } = useX402Payment({
    onPaymentRequired: (requirements) => {
      console.log('Payment required:', requirements);
    },
    onPaymentSuccess: (result) => {
      console.log('Payment method:', result.method);
    },
  });

  const handleAudit = async () => {
    try {
      const response = await fetchWithPayment('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipt_id: receiptId }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Audit result:', result);
      }
    } catch (err) {
      console.error('Audit failed:', err);
    }
  };

  return (
    <button onClick={handleAudit} disabled={isPaying}>
      {isPaying ? 'Processing...' : `Audit Receipt (${auditFee})`}
    </button>
  );
}
```

### Frontend - Direct Function

```tsx
import { fetchWithPayment } from '@/lib/x402';
import { useActiveAccount } from 'thirdweb/react';

function MyComponent() {
  const account = useActiveAccount();
  
  const callAuditAPI = async () => {
    const response = await fetchWithPayment(
      'http://localhost:8000/api/audit',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipt_id: 'xxx' }),
      },
      account, // Will auto-handle payment
    );
    
    return response.json();
  };
}
```

### Backend - Protecting an Endpoint

```python
from app.services.x402 import x402_service, X402PaymentError

@router.post("/my-paid-endpoint")
async def my_endpoint(
    request: Request,
    x_payment: str | None = Header(None, alias="X-Payment"),
):
    # Verify payment
    try:
        payment = await x402_service.verify_payment(x_payment)
    except X402PaymentError:
        requirements = x402_service.generate_payment_requirements(
            resource=str(request.url),
            description="My paid service",
        )
        return Response(
            status_code=402,
            content=json.dumps({**requirements, "error": "payment_required"}),
            headers=x402_service.generate_402_response_headers(requirements),
        )
    
    # Do work...
    result = do_something()
    
    # Settle payment
    await x402_service.settle_via_facilitator(
        payment_header=x_payment,
        resource_url=str(request.url),
    )
    
    return result
```

## Configuration

### Environment Variables

```env
# Thirdweb Configuration
THIRDWEB_CLIENT_ID=your-client-id
THIRDWEB_SECRET_KEY=your-secret-key

# Wallet Addresses
THIRDWEB_AGENT_A_WALLET_ADDRESS=0x...  # Auditor wallet (receives payments)
THIRDWEB_AGENT_B_WALLET_ADDRESS=0x...  # Treasury wallet

# Network
AVALANCHE_NETWORK=fuji  # or mainnet
USDC_TOKEN_ADDRESS=0x5425890298aed601595a70AB815c96711a31Bc65  # Fuji USDC
```

### Frontend Config (thirdweb.ts)

```typescript
export const X402_CONFIG = {
  AUDIT_FEE_USD: 0.05,
  AUDIT_FEE_WEI: BigInt(50000), // $0.05 in USDC (6 decimals)
  AUDITOR_WALLET: '0x2fAC7C9858e07eC8CaaAD17Ff358238BdC95dDeD',
};
```

## Payment Schemes

### Exact Scheme
- User pays exactly the requested amount
- Used for fixed-price services like audits
- Server specifies `scheme: "exact"` in requirements

### Upto Scheme  
- User authorizes up to a maximum amount
- Server can charge any amount up to the max
- Useful for variable-cost services
- Server specifies `scheme: "upto"` in requirements

## Error Handling

### 402 Response Format

```json
{
  "x402Version": 1,
  "scheme": "exact",
  "network": "avalanche-fuji",
  "maxAmountRequired": "50000",
  "resource": "http://localhost:8000/api/audit",
  "description": "AI-powered receipt audit service - $0.05 per audit",
  "payTo": "0x2fAC7C9858e07eC8CaaAD17Ff358238BdC95dDeD",
  "maxTimeoutSeconds": 300,
  "asset": "0x5425890298aed601595a70AB815c96711a31Bc65",
  "error": "payment_required",
  "message": "Payment required to access this resource"
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Missing X-Payment header` | No payment provided | Frontend should auto-retry with payment |
| `Insufficient payment` | Amount too low | Check `maxAmountRequired` in requirements |
| `Payment authorization expired` | Signature too old | Generate new signature |
| `Payment recipient mismatch` | Wrong `payTo` address | Use address from requirements |

## Testing

### Manual Test Flow

1. Start backend: `cd backend && uvicorn app.main:app --reload`
2. Start frontend: `cd frontend/apps/web && pnpm dev`
3. Connect wallet in the app
4. Upload a receipt
5. Click audit - should see 402 → payment signing → success

### Using curl

```bash
# Get price
curl http://localhost:8000/api/audit/price

# Try without payment (will get 402)
curl -X POST http://localhost:8000/api/audit \
  -H "Content-Type: application/json" \
  -d '{"receipt_id": "xxx"}'

# With payment header
curl -X POST http://localhost:8000/api/audit \
  -H "Content-Type: application/json" \
  -H "X-Payment: <base64-encoded-proof>" \
  -d '{"receipt_id": "xxx"}'
```

## Security Considerations

1. **Signature Verification**: All ERC-3009 signatures are verified on-chain by Thirdweb
2. **Nonce Uniqueness**: Each payment has a unique nonce to prevent replay
3. **Time Bounds**: Signatures have `validAfter` and `validBefore` bounds
4. **Amount Validation**: Backend verifies payment amount matches requirements
5. **Recipient Check**: Payment must be to the correct auditor wallet

## Troubleshooting

### Payment Not Working

1. Check wallet is connected
2. Check USDC balance (need $0.05+)
3. Check network (must be Avalanche Fuji for testnet)
4. Check browser console for errors
5. Verify Thirdweb API keys are configured

### Settlement Failing

1. Check `THIRDWEB_SECRET_KEY` is set
2. Check facilitator API is reachable
3. Falls back to local settlement if facilitator unavailable

### 402 Not Being Returned

1. Check endpoint has x402 gating code
2. Check payment header is being parsed correctly
3. Verify `X402Service` is imported and used
