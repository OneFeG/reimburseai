# ReimburseAI 🧾💰

> **AI-powered expense reimbursement with instant USDC payments on Avalanche**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with Thirdweb](https://img.shields.io/badge/Built%20with-Thirdweb-purple)](https://thirdweb.com)
[![Powered by Avalanche](https://img.shields.io/badge/Powered%20by-Avalanche-red)](https://avax.network)

---

## 🎯 What is ReimburseAI?

ReimburseAI is a complete expense reimbursement platform that uses:

- **AI Vision** to analyze receipts and verify expenses
- **Blockchain** for instant, transparent USDC payments
- **Smart Contracts** for secure company vaults
- **x402 Protocol** for pay-per-audit micropayments

**Result:** Employees submit receipts → AI verifies → Get paid in USDC in seconds, not weeks.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REIMBURSEAI ARCHITECTURE                           │
│                                                                              │
│                         ┌───────────────────────┐                           │
│                         │      FRONTEND         │                           │
│                         │    (Next.js 16)       │                           │
│                         │                       │                           │
│                         │  • Landing page       │                           │
│                         │  • Dashboard          │                           │
│                         │  • Multi-company      │                           │
│                         │  • Wallet connect     │                           │
│                         └───────────┬───────────┘                           │
│                                     │                                        │
│                                     │ REST API                               │
│                                     ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                            BACKEND (FastAPI)                          │  │
│  │                                                                       │  │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────────────┐ │  │
│  │  │  AI AUDITOR │   │  SECURITY   │   │       TREASURY              │ │  │
│  │  │             │   │   SERVICE   │   │                             │ │  │
│  │  │ GPT-4o      │──▶│             │──▶│ Thirdweb Server Wallet      │ │  │
│  │  │ Vision      │   │ • Signatures│   │ USDC Payments               │ │  │
│  │  │ Analysis    │   │ • Rate Limit│   │                             │ │  │
│  │  │             │   │ • Anomaly   │   │ NO AI decisions             │ │  │
│  │  │ NO money    │   │ • Verify    │   │ (needs signed audit)        │ │  │
│  │  │ access      │   │             │   │                             │ │  │
│  │  └─────────────┘   └─────────────┘   └─────────────────────────────┘ │  │
│  │                                                                       │  │
│  │  Database: Supabase (PostgreSQL + RLS)                               │  │
│  │  Storage: Supabase Storage (encrypted receipts)                      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                     │                                        │
│                                     │ Web3 Operations                        │
│                                     ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         WEB3 (Thirdweb SDK)                           │  │
│  │                                                                       │  │
│  │  ┌─────────────────┐   ┌─────────────────┐   ┌──────────────────┐   │  │
│  │  │  VAULT FACTORY  │   │  USDC SERVICE   │   │  x402 PAYMENTS   │   │  │
│  │  │                 │   │                 │   │                  │   │  │
│  │  │  │ Deploy company  │   │ Transfer USDC   │   │ $0.50 per audit  │   │  │
│  │  │ vaults          │   │ Check balances  │   │ micropayments    │   │  │
│  │  └─────────────────┘   └─────────────────┘   └──────────────────┘   │  │
│  │                                                                       │  │
│  │  Network: Avalanche (Fuji Testnet / C-Chain Mainnet)                 │  │
│  │  Token: USDC (Circle's native stablecoin)                            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
reimburse.ai/
├── frontend/                   # Next.js 16 web application
│   └── apps/web/
│       ├── src/
│       │   ├── app/            # Pages and routes
│       │   ├── components/     # React components
│       │   ├── context/        # Auth context
│       │   └── lib/            # Utilities
│       └── README.md           # Frontend documentation
│
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/                # REST endpoints
│   │   ├── services/           # Business logic
│   │   ├── schemas/            # Pydantic models
│   │   └── db/                 # Database
│   ├── migrations/             # SQL migrations
│   └── README.md               # Backend documentation
│
├── Web3/                       # Blockchain integration
│   ├── src/
│   │   ├── vault/              # Smart contract interactions
│   │   ├── treasury/           # Payment service
│   │   ├── usdc/               # USDC operations
│   │   └── x402/               # Micropayments
│   └── README.md               # Web3 documentation
│
├── docs/                       # Additional documentation
├── demo/                       # Demo scripts
├── scripts/                    # Utility scripts
│
└── README.md                   # This file
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** - For frontend and Web3
- **Python 3.11+** - For backend
- **pnpm** - Package manager (recommended)
- **Supabase account** - Database
- **Thirdweb account** - Web3 infrastructure
- **OpenAI API key** - AI auditing

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/reimburse-ai.git
cd reimburse-ai
```

### 2. Start the Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1  # Windows
# source .venv/bin/activate   # Linux/Mac

# Install dependencies
pip install -e .

# Copy environment file
cp .env.example .env
# Edit .env with your credentials

# Run migrations (in Supabase SQL Editor)
# migrations/001_initial_schema.sql
# migrations/002_storage_policies.sql
# ... (all migration files)

# Start server
python run.py
```

Backend runs at: http://localhost:8000

### 3. Start the Frontend

```bash
cd frontend/apps/web

# Install dependencies
pnpm install

# Create environment file
cp .env.example .env.local
# Edit .env.local with your credentials

# Start dev server
pnpm dev
```

Frontend runs at: http://localhost:3000

### 4. Setup Web3 (Optional for development)

```bash
cd Web3

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with Thirdweb credentials

# Run setup script
npx tsx scripts/setup-testnet.ts
```

---

## 🔑 Environment Variables

### Backend (.env)

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Thirdweb
THIRDWEB_SECRET_KEY=your-secret-key
THIRDWEB_ENGINE_URL=https://engine.thirdweb.com
THIRDWEB_COMPANY_WALLET_ADDRESS=0x...
THIRDWEB_AUDITOR_WALLET_ADDRESS=0x...

# OpenAI
OPENAI_API_KEY=sk-...

# Security
SECRET_KEY=your-random-secret-key
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your-client-id
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CHAIN_ID=43113
```

---

## 🔐 Security Features

ReimburseAI implements multiple layers of security:

### 1. Separation of Duties
- **AI Auditor** - Analyzes receipts, NO access to money
- **Treasury** - Sends payments, CANNOT approve (needs signed audit)

### 2. Cryptographic Signatures
- All audit results are HMAC-SHA256 signed
- Timestamps and nonces prevent replay attacks
- Signatures expire after 5 minutes

### 3. Rate Limiting
- 10 audits per minute per company
- 5 payouts per minute per company
- Prevents brute force attacks

### 4. Anomaly Detection
- Velocity checks (too many receipts?)
- Amount deviation (unusually high?)
- Merchant patterns (new vendor?)
- Time anomalies (3 AM submission?)

### 5. Payout Verification
- Daily limits ($10,000/company)
- High-value approval ($500+)
- Critical value multisig ($2,000+)

---

## 👥 Multi-Company Support

Employees can work with multiple companies:

```
┌─────────────┐
│  EMPLOYEE   │
│  John Doe   │
└──────┬──────┘
       │
       ├─────────────────┬─────────────────┐
       ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  ACME Corp  │   │  Tech Inc   │   │  Startup Co │
│  (Primary)  │   │  (Manager)  │   │  (Employee) │
│  Admin role │   │ Manager role│   │ Regular     │
└─────────────┘   └─────────────┘   └─────────────┘
```

Features:
- Switch between companies with one click
- Different roles per company
- Separate wallet addresses (optional)
- Independent expense tracking

---

## 💰 x402 Micropayments

AI audits cost $0.50 USDC, paid via the x402 protocol:

```
Client                Backend               Blockchain
  │                     │                      │
  │ POST /api/audit     │                      │
  │────────────────────▶│                      │
  │                     │                      │
  │ 402 Payment Required│                      │
  │◀────────────────────│                      │
  │                     │                      │
  │ Sign & pay $0.50    │                      │
  │─────────────────────│─────────────────────▶│
  │                     │                      │
  │ POST + X-PAYMENT    │                      │
  │────────────────────▶│                      │
  │                     │                      │
  │ Audit result        │                      │
  │◀────────────────────│                      │
```

---

## 🌐 Networks

| Network | Purpose | Chain ID | USDC Address |
|---------|---------|----------|--------------|
| **Avalanche Fuji** | Testnet | 43113 | `0x5425890298aed601595a70AB815c96711a31Bc65` |
| **Avalanche C-Chain** | Mainnet | 43114 | `0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E` |

---

## 📡 API Reference

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/upload` | POST | Upload receipt |
| `/api/audit` | POST | AI audit (x402 gated) |
| `/api/treasury/payout` | POST | Process payment |
| `/api/vaults/deploy` | POST | Deploy company vault |
| `/api/memberships/switch` | POST | Switch company context |
| `/api/security/audit/sign` | POST | Sign audit result |

Full API documentation: http://localhost:8000/docs

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest
pytest --cov=app  # With coverage
```

### Frontend Tests

```bash
cd frontend/apps/web
pnpm test
pnpm test:e2e
```

---

## 🚢 Deployment

### Docker Compose

```bash
docker-compose up -d
```

### Manual Deployment

1. **Backend**: Deploy to any Python host (Railway, Render, etc.)
2. **Frontend**: Deploy to Vercel (recommended)
3. **Database**: Supabase (managed PostgreSQL)
4. **Web3**: Thirdweb Engine (managed infrastructure)

See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) for detailed instructions.

---

## 📚 Documentation

- [Frontend README](frontend/apps/web/README.md) - Frontend setup and components
- [Backend README](backend/README.md) - Backend API and services
- [Web3 README](Web3/README.md) - Blockchain integration
- [x402 Integration](docs/X402_INTEGRATION.md) - Micropayment protocol

---

## 🛣️ Roadmap

- [x] Core expense submission flow
- [x] AI receipt auditing (GPT-4o Vision)
- [x] USDC payments via Thirdweb
- [x] x402 micropayment protocol
- [x] Multi-company employee support
- [x] Comprehensive security system
- [ ] Mobile app (React Native)
- [ ] Invoice generation
- [ ] Advanced analytics
- [ ] Multi-chain support

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Thirdweb](https://thirdweb.com) - Web3 infrastructure
- [Avalanche](https://avax.network) - Blockchain network
- [OpenAI](https://openai.com) - AI capabilities
- [Supabase](https://supabase.com) - Database and storage
- [Vercel](https://vercel.com) - Frontend hosting

---

**Built with ❤️ for the future of expense management**
