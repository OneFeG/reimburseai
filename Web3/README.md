# ReimburseAI Web3 Package

> The **blockchain part** - handles USDC payments on Avalanche network.

---

## 🎯 What This Package Does (Simple Explanation)

**ReimburseAI is an expense reimbursement system.** This Web3 package handles all the money stuff:

- Creates secure "vaults" for companies to store USDC
- Sends payments to employees when receipts are approved
- Everything is on the blockchain = transparent and instant

---

## 🔄 The Complete Flow (How Everything Works)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                        THE REIMBURSEMENT FLOW                            │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  STEP 1: Company Signs Up                                        │    │
│  │  ─────────────────────────                                        │    │
│  │  → We deploy a VAULT (smart contract) for them                    │    │
│  │  → Company admin gets control to deposit/withdraw                 │    │
│  │  → Our app gets permission to pay employees (only!)               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                           │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  STEP 2: Company Deposits USDC                                    │    │
│  │  ────────────────────────────                                     │    │
│  │  → Company sends USDC to their vault address                      │    │
│  │  → Funds are safe (only admin can withdraw)                       │    │
│  │  → Our app can ONLY send to approved employees                    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                           │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  STEP 3: Employee Submits Receipt                                 │    │
│  │  ────────────────────────────────                                 │    │
│  │  → Employee uploads receipt photo on the app                      │    │
│  │  → AI analyzes it (checks amount, vendor, policy compliance)     │    │
│  │  → If approved → triggers payment                                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                           │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  STEP 4: Instant Payment                                          │    │
│  │  ───────────────────────                                          │    │
│  │  → Our Treasury Wallet signs the transaction                      │    │
│  │  → USDC goes from Vault → Employee's wallet                       │    │
│  │  → Done in seconds, not days!                                     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Key Components Explained

### 1. Company Vault (The Money Safe)

```
┌────────────────────────────────────────────────────────────┐
│                                                             │
│   COMPANY VAULT                                             │
│   Address: 0x96047A744Ab8818F5Ee99339b1Aa38A3F3F47527      │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  💰 USDC Balance: $XXX.XX                            │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   WHO CAN DO WHAT:                                          │
│   ─────────────────                                         │
│   👔 Company Admin (owner):                                 │
│      ✅ Deposit USDC                                        │
│      ✅ Withdraw USDC                                       │
│      ✅ View balance                                        │
│      ✅ Add/remove operators                                │
│                                                             │
│   🤖 Our App (operator):                                    │
│      ✅ Send USDC to employees                              │
│      ❌ Cannot withdraw to other wallets                    │
│      ❌ Cannot change settings                              │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

**Think of it like:** A company safe where only the company can take money out, but they've authorized our app to pay employees from it.

---

### 2. Server Wallets (Our App's Hands)

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│   TREASURY SERVER WALLET                                     │
│   Address: 0x9D86Af1Fe77969caD642c926CA81447399c1606C       │
│                                                              │
│   PURPOSE: Signs all payment transactions                    │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  This wallet:                                        │   │
│   │  • Has "Operator" role on all company vaults         │   │
│   │  • Can trigger payments when AI approves receipts    │   │
│   │  • CANNOT withdraw funds to itself                   │   │
│   │  • Keys are managed securely by Thirdweb             │   │
│   └─────────────────────────────────────────────────────┘   │
│                              │                               │
│                              │ Signs transactions            │
│                              ▼                               │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  VAULT ──────USDC────────▶ EMPLOYEE WALLET          │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                                                              │
│   AUDITOR SERVER WALLET                                      │
│   Address: 0x2fAC7C9858e07eC8CaaAD17Ff358238BdC95dDeD       │
│                                                              │
│   PURPOSE: Receives the $0.50 audit fee per receipt         │
│                                                              │
│   (This is how we monetize - each AI audit costs $0.50)     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. How They All Connect

```
                    ┌─────────────────────────────────────────┐
                    │              FRONTEND APP                │
                    │         (What employees see)             │
                    │                                          │
                    │  📸 Upload Receipt → 🔄 View Status      │
                    └─────────────────────────────────────────┘
                                       │
                                       │ API calls
                                       ▼
                    ┌─────────────────────────────────────────┐
                    │              BACKEND API                 │
                    │         (FastAPI + Supabase)             │
                    │                                          │
                    │  • Stores receipts in database           │
                    │  • Runs AI audit (GPT-4 Vision)          │
                    │  • Calls Web3 package for payments       │
                    └─────────────────────────────────────────┘
                                       │
                                       │ Payment request
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           WEB3 PACKAGE (This!)                            │
│                                                                           │
│   ┌─────────────────┐    signs tx    ┌─────────────────────────────────┐ │
│   │ Treasury Wallet │───────────────▶│         Company Vault           │ │
│   │  (Operator)     │                │                                 │ │
│   └─────────────────┘                │  Sends USDC to employee wallet  │ │
│                                      └─────────────────────────────────┘ │
│                                                     │                     │
│                                                     ▼                     │
│                                      ┌─────────────────────────────────┐ │
│                                      │     Employee Wallet (MetaMask)   │ │
│                                      │                                  │ │
│                                      │     💰 Receives USDC instantly   │ │
│                                      └─────────────────────────────────┘ │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## � x402 Micropayment Protocol (Thirdweb)

The x402 module handles pay-per-audit micropayments using Thirdweb:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   x402 PAYMENT FLOW                                              │
│   ═════════════════                                              │
│                                                                  │
│   1. Client requests audit                                       │
│                    │                                             │
│                    ▼                                             │
│   2. Backend returns 402 Payment Required                        │
│      {                                                           │
│        "amount": "500000",  // $0.50 USDC (6 decimals)            │
│        "recipient": "0x...",  // Auditor wallet                  │
│        "network": "avalanche-fuji"                               │
│      }                                                           │
│                    │                                             │
│                    ▼                                             │
│   3. Client creates payment via Thirdweb                         │
│      - Uses connected wallet (email/social/external)             │
│      - Signs USDC transfer transaction                           │
│                    │                                             │
│                    ▼                                             │
│   4. Client sends X-PAYMENT header                               │
│      - Base64-encoded payment proof                              │
│      - Contains tx hash + signature                              │
│                    │                                             │
│                    ▼                                             │
│   5. Backend verifies via Thirdweb Engine                        │
│      - Checks transaction on-chain                               │
│      - Validates amount & recipient                              │
│                    │                                             │
│                    ▼                                             │
│   6. Returns audit result                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### x402 Usage (TypeScript)

```typescript
import { X402PaymentService } from './x402';

// Initialize service
const x402 = new X402PaymentService(client, 'avalanche-fuji');

// Create payment
const payment = await x402.createPayment(
  wallet,
  requirements.recipient,
  requirements.amount
);

// Send with payment header
fetch('/api/audit', {
  headers: {
    'X-PAYMENT': payment.paymentHeader,  // Base64 proof
  },
});
```

---

## 🔐 Security Model (Why It's Safe)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  🔒 SEPARATION OF DUTIES                                         │
│  ════════════════════════                                        │
│                                                                  │
│  The AI (Auditor) and the Money (Treasury) are SEPARATE:        │
│                                                                  │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │   AI AUDITOR     │         │    TREASURY      │              │
│  │                  │         │                  │              │
│  │  Decides if      │         │  Only moves      │              │
│  │  receipt is OK   │────────▶│  money when AI   │              │
│  │                  │  proof  │  says OK         │              │
│  │  Has NO access   │         │                  │              │
│  │  to money        │         │  Cannot decide   │              │
│  │                  │         │  on its own      │              │
│  └──────────────────┘         └──────────────────┘              │
│                                                                  │
│  WHY THIS MATTERS:                                               │
│  • Hacked AI can't steal money (has no wallet access)           │
│  • Hacked Treasury can't approve fake receipts (needs AI proof) │
│  • Both must agree = double security                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 🛡️ Advanced Security Features (NEW)

The backend security system includes comprehensive protection measures that integrate with the Web3 layer:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SECURITY PROTECTION LAYERS                            │
│                                                                              │
│  LAYER 1: CRYPTOGRAPHIC SIGNATURES                                          │
│  ═══════════════════════════════════                                        │
│  • All audit results are HMAC-SHA256 signed                                 │
│  • Signatures include timestamp + nonce (prevents replay attacks)           │
│  • Signatures expire after 5 minutes                                        │
│  • Treasury verifies signature before any payout                            │
│                                                                              │
│  LAYER 2: RATE LIMITING                                                      │
│  ══════════════════════                                                      │
│  • 10 audits per minute per company                                         │
│  • 5 payouts per minute per company                                         │
│  • Prevents brute force and abuse                                           │
│                                                                              │
│  LAYER 3: ANOMALY DETECTION                                                  │
│  ══════════════════════════                                                  │
│  • Velocity check: Too many receipts in 24 hours?                           │
│  • Amount deviation: Is this 5x the employee's average?                     │
│  • Merchant check: New vendor for this category?                            │
│  • Time check: Submitted at 3 AM on a Saturday?                             │
│                                                                              │
│  LAYER 4: PAYOUT VERIFICATION                                                │
│  ════════════════════════════                                                │
│  • Verify audit signature is valid                                          │
│  • Verify receipt exists and is approved                                    │
│  • Check daily payout limits ($10,000/company/day)                          │
│  • Flag high-value ($500+) for manager approval                             │
│  • Flag critical-value ($2,000+) for multisig                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Security Thresholds

| Threshold | Value | Action |
|-----------|-------|--------|
| High-value expense | $500+ | Requires manager approval |
| Critical expense | $2,000+ | Requires multisig approval |
| Daily payout limit | $10,000 | Per company per day |
| Anomaly score | 0.7+ | Flagged for manual review |
| Max daily receipts | 20 | Per employee velocity check |

---

## 🚀 Quick Start (Run This Package)

### Step 1: Install Node.js

Make sure Node.js 20+ is installed:
```bash
node --version   # Should show v20 or higher
```

### Step 2: Install Dependencies

```bash
# Go to Web3 folder
cd Web3

# Install packages
npm install
```

### Step 3: Get Your Thirdweb Keys 🔑

1. Go to [thirdweb.com/dashboard](https://thirdweb.com/dashboard)
2. Sign up / Sign in
3. Go to **Settings** → **API Keys**
4. Create a new API key
5. Copy both **Client ID** and **Secret Key**

### Step 4: Add Your Keys

```bash
# Copy example file
copy .env.example .env   # Windows
cp .env.example .env     # Mac/Linux
```

Open `.env` file and fill in:

```env
# Paste your keys here
THIRDWEB_CLIENT_ID=your-client-id-here
THIRDWEB_SECRET_KEY=your-secret-key-here

# Leave this as 'fuji' for testing
NETWORK=fuji
```

### Step 5: Run Setup Script

```bash
npx tsx scripts/setup-testnet.ts
```

This will:
- ✅ Verify your API keys work
- ✅ Create your server wallet
- ✅ Show you where to get test tokens

### Step 6: Get Free Test Tokens 🎁

You need fake money for testing:

1. **Get test AVAX** (for gas fees):
   - Go to: https://core.app/tools/testnet-faucet/
   - Enter your wallet address (from Step 5)
   - Click "Request AVAX"

2. **Get test USDC** (for payments):
   - Go to: https://faucet.circle.com/
   - Select "Avalanche Fuji"
   - Enter your wallet address
   - Click "Get Tokens"

### Step 7: Deploy Your First Vault

```bash
npx tsx scripts/deploy-vault.ts
```

Follow the prompts to:
- Enter company name
- Enter admin wallet address
- Deploy the vault!

---

## 📂 Folder Structure

```
Web3/
├── src/
│   ├── vault/        # 🏦 Creates & manages company vaults
│   │   └── factory.ts    # Deploy new vaults
│   │
│   ├── treasury/     # 💳 Payment orchestration
│   │   └── service.ts    # Process reimbursements
│   │
│   ├── usdc/         # 💵 USDC token operations
│   │   └── service.ts    # Transfer, balance checks
│   │
│   ├── x402/         # 💰 x402 Micropayment Protocol (Thirdweb) ⭐
│   │   ├── service.ts    # Payment creation & verification
│   │   └── index.ts      # Module exports
│   │
│   ├── permissions/  # 🔐 Access control
│   │   └── service.ts    # Manage operator roles
│   │
│   ├── wallet/       # 👛 Server wallet management
│   │   └── server-wallet.ts  # Treasury & Auditor wallets
│   │
│   ├── api/          # 🔌 API handlers for backend
│   │   └── handlers.ts   # HTTP endpoint handlers
│   │
│   └── config/       # ⚙️ Configuration
│       └── index.ts      # Environment variables
│
├── scripts/          # ▶️ Runnable scripts
│   ├── setup-testnet.ts   # Initial setup
│   ├── deploy-vault.ts    # Deploy company vault
│   └── test-payment.ts    # Test payment flow
│
├── .env.example      # 📋 Example environment file
├── .env              # 🔑 Your secret keys (NEVER commit!)
├── package.json      # 📦 Dependencies
└── tsconfig.json     # ⚙️ TypeScript config
```

---

## 📋 All Addresses Reference

### 🌐 Current Testnet Deployment (Avalanche Fuji)

| Type | Name | Address | Purpose |
|------|------|---------|---------|
| 🏦 **Vault** | Test Company Vault | `0x96047A744Ab8818F5Ee99339b1Aa38A3F3F47527` | Holds company's USDC |
| 👛 **Wallet** | Treasury Server | `0x9D86Af1Fe77969caD642c926CA81447399c1606C` | Signs payment transactions |
| 👛 **Wallet** | Auditor Server | `0x2fAC7C9858e07eC8CaaAD17Ff358238BdC95dDeD` | Receives audit fees |
| 🪙 **Token** | USDC (Testnet) | `0x5425890298aed601595a70AB815c96711a31Bc65` | Test USDC token |

### 🔗 Explorer Links

- [Test Vault on Snowtrace](https://testnet.snowtrace.io/address/0x96047A744Ab8818F5Ee99339b1Aa38A3F3F47527)
- [Treasury Wallet on Snowtrace](https://testnet.snowtrace.io/address/0x9D86Af1Fe77969caD642c926CA81447399c1606C)
- [USDC Token on Snowtrace](https://testnet.snowtrace.io/address/0x5425890298aed601595a70AB815c96711a31Bc65)

---

## 🧪 Testing Commands

### 1. Setup Testnet (Run First!)
```bash
cd E:\reimburse.ai\Web3
npm run setup:testnet
```

### 2. Deploy a New Vault
```bash
npx tsx scripts/deploy-vault.ts --company-id="acme-corp" --company-name="Acme Corporation" --admin="0xYOUR_WALLET"
```

### 3. Test a Payment
```bash
npx tsx scripts/test-payment.ts --vault="0x96047A744Ab8818F5Ee99339b1Aa38A3F3F47527" --employee="0xEMPLOYEE_WALLET" --amount="5.00"
```

---

## ⚠️ Important Notes

### Before Testing Payments

**The vault needs USDC first!**

1. **Fund the vault with test USDC:**
   - Go to: https://faucet.circle.com/
   - Select: **Avalanche Fuji**
   - Enter vault address: `0x96047A744Ab8818F5Ee99339b1Aa38A3F3F47527`
   - Wait 1-2 minutes

2. **Treasury wallet needs AVAX for gas:**
   - Go to: https://core.app/tools/testnet-faucet/
   - Enter: `0x9D86Af1Fe77969caD642c926CA81447399c1606C`
   - Wait 1-2 minutes

### Security Reminders

- 🔴 **NEVER** commit `.env` file to git
- 🔴 **NEVER** share your `THIRDWEB_SECRET_KEY`
- 🟡 Test on Fuji testnet first, ALWAYS
- 🟡 Double-check addresses before mainnet deployment

---

## 🌐 Networks

| Network | When To Use | Chain ID | USDC Address |
|---------|------------|----------|--------------|
| **Fuji** (Testnet) | Development & Testing | 43113 | `0x5425890298aed601595a70AB815c96711a31Bc65` |
| **Mainnet** | Production (real money!) | 43114 | `0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E` |

**To switch to mainnet:** Change `USE_MAINNET=true` in `.env`

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Insufficient funds" | Fund the vault with USDC from Circle faucet |
| "Transaction failed" | Treasury wallet needs AVAX for gas fees |
| "Unauthorized" | Check that Treasury wallet has Operator role on vault |
| "Invalid address" | Make sure address starts with `0x` and is 42 characters |

---

## 📚 Learn More

- [Thirdweb Docs](https://portal.thirdweb.com/)
- [Avalanche Docs](https://docs.avax.network/)
- [USDC on Avalanche](https://developers.circle.com/stablecoins/docs/usdc-on-main-networks)
