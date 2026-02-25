# Demo Scripts

This folder contains scripts to test the ReimburseAI system end-to-end.

## Prerequisites

1. **Backend running** at `http://localhost:8000`
2. **Environment variables** set (or using defaults):
   - `API_BASE_URL` (default: `http://localhost:8000/api`)
   - `TREASURY_SECRET_KEY` (default: `change-me-treasury-secret`)

## Full Flow Demo

Tests the complete reimbursement flow:

```bash
cd demo
pip install httpx
python demo_full_flow.py
```

### What It Tests:

```
┌──────────────────────────────────────────────────────────────────────┐
│                    FULL REIMBURSEMENT FLOW                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Step 0: Health Check                                                │
│     └─▶ Verify backend is running                                    │
│                                                                      │
│  Step 1: Create Company                                              │
│     └─▶ POST /api/companies                                          │
│                                                                      │
│  Step 2: Create Employee                                             │
│     └─▶ POST /api/employees                                          │
│                                                                      │
│  Step 3: Whitelist Employee Wallet                                   │
│     └─▶ POST /api/whitelist                                          │
│                                                                      │
│  Step 4: Create Expense Policy                                       │
│     └─▶ POST /api/policies                                           │
│     └─▶ $100 limit, travel/meals/supplies categories                 │
│                                                                      │
│  Step 5: Upload Receipt                                              │
│     └─▶ POST /api/upload                                             │
│     └─▶ Test receipt image                                           │
│                                                                      │
│  Step 6: Process Reimbursement                                       │
│     └─▶ POST /api/reimburse/process                                  │
│     └─▶ This triggers:                                               │
│         ├─▶ Agent A: AI Auditor (GPT-4o Vision)                      │
│         ├─▶ x402: $0.05 USDC micropayment for audit                  │
│         ├─▶ Agent B: Treasury payout (if approved)                   │
│         └─▶ Ledger entry creation                                    │
│                                                                      │
│  Step 7: Verify Ledger                                               │
│     └─▶ GET /api/ledger/company/{id}                                 │
│                                                                      │
│  Step 8: Check Billing                                               │
│     └─▶ GET /api/billing/usage/{id}                                  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Expected Output (Success):

```
══════════════════════════════════════════════════════════════════════
  REIMBURSE.AI - FULL SYSTEM DEMO
══════════════════════════════════════════════════════════════════════

  API: http://localhost:8000/api
  Time: 2025-12-28T...

┌────────────────────────────────────────────────────────────────────┐
│  STEP 0: Health Check                                              │
└────────────────────────────────────────────────────────────────────┘
  ✅ SUCCESS
     • status: API is healthy

... more steps ...

══════════════════════════════════════════════════════════════════════
  DEMO SUMMARY
══════════════════════════════════════════════════════════════════════

  ✅ Health Check
  ✅ Create Company
  ✅ Create Employee
  ✅ Whitelist Wallet
  ✅ Create Policy
  ✅ Upload Receipt
  ✅ Process Reimbursement
  ✅ Verify Ledger
  ✅ Check Billing

  Total: 9 passed, 0 failed

  🎉 All tests passed! System is ready for production.
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| `Connection refused` | Start the backend: `cd backend && python run.py` |
| `Module not found: httpx` | Install: `pip install httpx` |
| `Audit failed` | Check OpenAI API key in `.env` |
| `Payout failed` | Check Thirdweb keys and vault has USDC |
