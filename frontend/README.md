# ReimburseAI Frontend

> The **user interface** - Next.js 15 web app with Thirdweb authentication (email, social, wallets).

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd frontend/apps/web
npm install
```

### 2. Configure Environment

The `.env.local` file is already set up with:
- Backend API URL: `http://localhost:8000/api`
- Thirdweb Client ID: Already configured
- Network: Fuji (testnet)

### 3. Start Development Server

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000)

---

## 🔐 Authentication (Thirdweb In-App Wallets)

ReimburseAI supports multiple authentication methods via Thirdweb:

```
┌─────────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION OPTIONS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   📧 EMAIL LOGIN                                                 │
│   • Enter email, receive OTP code                                │
│   • No password needed                                           │
│   • Creates embedded wallet automatically                        │
│                                                                  │
│   🔗 SOCIAL LOGIN                                                │
│   • Google, Apple, Facebook                                      │
│   • One-click authentication                                     │
│   • Creates embedded wallet automatically                        │
│                                                                  │
│   👛 EXTERNAL WALLETS                                            │
│   • MetaMask, Coinbase Wallet, Rainbow                          │
│   • WalletConnect for mobile wallets                             │
│   • Uses your existing wallet                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### How It Works

1. **User signs in** → Email OTP / Google / MetaMask
2. **Wallet created/connected** → Gets wallet address
3. **Backend lookup** → `GET /employees/wallet/{address}`
4. **If found** → Dashboard with company context
5. **If new** → Registration flow (create/join company)

---

## 💰 x402 Micropayments (Thirdweb Compatible)

The frontend implements the **x402 payment protocol** for pay-per-audit, compatible with Thirdweb's SDK.

### How It Works

```
1. Client calls POST /api/audit
2. Server returns 402 + payment requirements
3. Frontend parses X-Payment-Required header
4. User signs ERC-3009 authorization (gasless)
5. Frontend retries with X-Payment header
6. Server settles via Thirdweb facilitator
```

### Using the Hook (Recommended)

```typescript
import { useX402Payment } from '@/hooks';

function AuditButton({ receiptId }: { receiptId: string }) {
  const { fetchWithPayment, isPaying, error, auditFee } = useX402Payment({
    onPaymentRequired: (requirements) => console.log('Payment:', requirements),
    onPaymentSuccess: (result) => console.log('Paid via:', result.method),
  });

  const handleAudit = async () => {
    try {
      const response = await fetchWithPayment('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipt_id: receiptId }),
      });
      const result = await response.json();
      console.log('Audit result:', result);
    } catch (err) {
      console.error('Audit failed:', err);
    }
  };

  return (
    <button onClick={handleAudit} disabled={isPaying}>
      {isPaying ? 'Processing...' : `Audit (${auditFee})`}
    </button>
  );
}
```

### Direct Function Usage

```typescript
import { fetchWithPayment, createPayment } from '@/lib/x402';
import { useActiveAccount } from 'thirdweb/react';

// Automatic payment handling
const account = useActiveAccount();
const response = await fetchWithPayment('/api/audit', {
  method: 'POST',
  body: JSON.stringify({ receipt_id: '...' }),
}, account);

// Manual payment creation
const payment = await createPayment(account, requirements);
// payment.paymentHeader → Use in X-Payment header
// payment.method → 'erc3009' (gasless) or 'transfer'
```

### Payment Methods

| Method | Gas Paid By | When Used |
|--------|-------------|----------|
| **ERC-3009** (default) | Thirdweb | User signs, facilitator settles |
| **Direct Transfer** (fallback) | User | If ERC-3009 fails |

**Cost:** $0.50 USDC per audit

---

## 🔗 System Connections

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 15)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   [Thirdweb SDK v5]       [API Client]      [x402 Service]       │
│        │                       │                  │              │
│        │ In-App Wallet         │ REST API         │ Micropay     │
│        │ + Social Auth         │                  │              │
│        ▼                       ▼                  ▼              │
│   ┌──────────┐           ┌──────────┐      ┌──────────┐         │
│   │ Avalanche │          │ Backend  │      │ Auditor  │         │
│   │  Fuji     │          │ FastAPI  │      │ Agent    │         │
│   └──────────┘           └──────────┘      └──────────┘         │
│                                │                                 │
│                                ▼                                 │
│                          ┌──────────┐                            │
│                          │ Supabase │                            │
│                          │    DB    │                            │
│                          └──────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
frontend/apps/web/src/
├── app/
│   ├── (auth)/           # Auth pages (sign-in, sign-up)
│   │   ├── sign-in/      # Email/Social/Wallet login
│   │   └── sign-up/      # Company registration
│   ├── (app)/            # Protected app pages
│   │   ├── dashboard/    # Main dashboard
│   │   ├── expenses/     # Receipt list & details
│   │   ├── upload/       # Upload new receipt
│   │   ├── approvals/    # Manager approval queue
│   │   ├── ledger/       # Financial transaction history ⭐ Phase 2
│   │   ├── settings/     # Policy configuration ⭐ Phase 2
│   │   └── kyb/          # KYB verification ⭐ Phase 3
│   └── layout.tsx        # Root layout with Providers
├── components/
│   ├── brand/            # Logo, branding
│   ├── layout/           # Navbar, Sidebar, Shell
│   └── providers.tsx     # Thirdweb + Auth providers
├── context/
│   └── auth-context.tsx  # Auth state management
└── lib/
    ├── api/              # Backend API client
    │   ├── client.ts     # Base API client (GET, POST, PUT, DELETE)
    │   ├── receipts.ts   # Receipt operations
    │   ├── companies.ts  # Company operations
    │   ├── employees.ts  # Employee operations
    │   ├── vaults.ts     # Vault operations
    │   ├── policies.ts   # Policy CRUD ⭐ Phase 2
    │   ├── ledger.ts     # Ledger queries ⭐ Phase 2
    │   └── kyb.ts        # KYB submission ⭐ Phase 3
    ├── thirdweb.ts       # Thirdweb config + In-App Wallets
    ├── x402.ts           # x402 payment protocol (Thirdweb compatible) ⭐
    └── utils.ts          # Helper functions
└── hooks/
    ├── index.ts          # Hook exports
    └── use-x402-payment.ts  # React hook for x402 payments ⭐
```

---

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTH FLOW DIAGRAM                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   User visits /sign-in                                          │
│          │                                                       │
│          ▼                                                       │
│   ┌─────────────────────────────────┐                           │
│   │   Select Login Method:          │                           │
│   │   • Email (OTP)                 │                           │
│   │   • Google / Apple / Facebook   │                           │
│   │   • MetaMask / Coinbase         │                           │
│   └─────────────────────────────────┘                           │
│          │                                                       │
│          ▼                                                       │
│   Thirdweb creates/connects wallet                              │
│          │                                                       │
│          ▼                                                       │
│   GET /employees/wallet/{address}                               │
│          │                                                       │
│          ├─── Found ───▶ Set context → /dashboard               │
│          │                                                       │
│          └─── Not found ───▶ Show "Register/Join" prompt        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🌐 API Endpoints Used

| Frontend Action | Backend Endpoint | Phase |
|----------------|------------------|-------|
| Login (get user) | `GET /employees/wallet/{address}` | 1 |
| Get company | `GET /companies/{id}` | 1 |
| Get stats | `GET /companies/{id}/stats` | 1 |
| Upload receipt | `POST /upload` | 1 |
| List receipts | `GET /receipts/company/{id}` | 1 |
| Get receipt | `GET /receipts/{id}` | 1 |
| Get image URL | `GET /receipts/{id}/image-url` | 1 |
| Vault balance | `GET /vaults/balance/{id}` | 1 |
| **Approval queue** | `GET /receipts/company/{id}/pending` | 2 |
| **Update receipt** | `PATCH /receipts/{id}` | 2 |
| **Get policies** | `GET /policies/company/{id}` | 2 |
| **Update policy** | `PUT /policies/{id}` | 2 |
| **Ledger entries** | `GET /ledger/company/{id}` | 2 |
| **Ledger summary** | `GET /ledger/company/{id}/summary` | 2 |
| **KYB status** | `GET /kyb/{company_id}` | 3 |
| **Submit KYB** | `POST /kyb` | 3 |
| **Audit (x402)** | `POST /audit` | 2 |

---

## 📱 Pages

| Page | Route | Description | Phase |
|------|-------|-------------|-------|
| Sign In | `/sign-in` | Email/Social/Wallet login | 1 |
| Sign Up | `/sign-up` | Company registration | 1 |
| Dashboard | `/dashboard` | Stats & recent receipts | 1 |
| Upload | `/upload` | Upload new receipt | 1 |
| Expenses | `/expenses` | All receipts + filters | 1 |
| Approvals | `/approvals` | Manager approval queue | 2 |
| **Ledger** | `/ledger` | Financial transaction history | 2 |
| **Settings** | `/settings` | Policy configuration (admin) | 2 |
| **Verification** | `/kyb` | KYB status & submission | 3 |

---

## 🧪 Development Tips

### Run Frontend + Backend Together

```bash
# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2: Frontend
cd frontend/apps/web
npm run dev
```

### Test Authentication Methods

1. **Email Login:** Use any email, OTP will be sent
2. **Google Login:** Click Google icon, OAuth flow
3. **MetaMask:** Click MetaMask icon, confirm connection
4. Get test AVAX from [Avalanche Faucet](https://core.app/tools/testnet-faucet/)

---

## 📋 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000/api` |
| `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` | Thirdweb Client ID | (required) |
| `NEXT_PUBLIC_NETWORK` | Network: `fuji` or `mainnet` | `fuji` |
| `NEXT_PUBLIC_AUDITOR_WALLET` | Auditor address for x402 payments | (required for x402) |
| `NEXT_PUBLIC_USDC_ADDRESS` | USDC token address | Auto-set per network |

### Production Environment

```bash
# .env.production
NEXT_PUBLIC_API_URL=https://api.reimburse.ai
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your-client-id
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_AUDITOR_WALLET=0x...
```
