# Reimburse.ai Backend

> The **brain** of the app - stores data, processes receipts, and connects everything.

## What This Does (Simple Version)

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   FRONTEND   │ ───▶ │   BACKEND    │ ───▶ │    WEB3      │
│  (What you   │      │  (This code) │      │  (Blockchain │
│    see)      │      │              │      │   payments)  │
└──────────────┘      └──────┬───────┘      └──────────────┘
                             │
                      ┌──────▼───────┐
                      │   DATABASE   │
                      │  (Supabase)  │
                      └──────────────┘
```

**In plain English:**
1. 📸 Employee uploads receipt → Backend saves it
2. 🤖 AI checks if receipt is valid → Backend tells Web3
3. 💰 Web3 sends USDC to employee → Backend records it

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Python

Make sure Python 3.11+ is installed:
```bash
python --version   # Should show 3.11 or higher
```

### Step 2: Setup Project

```bash
# Go to backend folder
cd backend

# Create virtual environment
python -m venv .venv

# Activate it (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -e .
```

### Step 3: Add Your Keys

```bash
# Copy example file
copy .env.example .env
```

Open `.env` and fill in:

| Key | What It Is | Get From |
|-----|-----------|----------|
| `SUPABASE_URL` | Database URL | [supabase.com](https://supabase.com) |
| `SUPABASE_SERVICE_ROLE_KEY` | Database key | Supabase → Settings → API |
| `THIRDWEB_SECRET_KEY` | Blockchain key | [thirdweb.com](https://thirdweb.com/dashboard) |
| `OPENAI_API_KEY` | AI key | [platform.openai.com](https://platform.openai.com) |

### Step 4: Run It!

```bash
python run.py
```

✅ Server runs at **http://localhost:8000**  
📖 API docs at **http://localhost:8000/docs**

---

## 📂 What's In Each Folder

```
backend/
├── app/
│   ├── api/           # 🌐 API endpoints (URLs the frontend calls)
│   ├── services/      # 🧠 Business logic (the actual work)
│   ├── schemas/       # 📋 Data shapes (what data looks like)
│   ├── db/            # 💾 Database connections
│   └── config.py      # ⚙️ Settings from .env file
├── migrations/        # 🗄️ Database setup scripts
├── tests/             # 🧪 Test files
└── run.py             # ▶️ Start the server
```

---

## 🔌 Main API Endpoints

| What | Endpoint | Method |
|------|----------|--------|
| Check server is alive | `/api/health` | GET |
| Upload receipt | `/api/upload` | POST |
| Get company info | `/api/companies/{id}` | GET |
| Deploy new vault | `/api/vaults/deploy` | POST |
| Check vault balance | `/api/vaults/balance/{company_id}` | GET |
| Process reimbursement | `/api/reimburse/process` | POST |

**See all 50+ endpoints:** http://localhost:8000/docs

---

## 🔗 How Parts Connect

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry
│   ├── config.py            # Environment configuration
│   ├── dependencies.py      # Dependency injection
│   │
│   ├── api/                 # API Layer
│   │   ├── router.py        # Main router
│   │   ├── audit.py         # x402 Auditor Agent ⭐
│   │   ├── treasury.py      # Treasury Payout Agent ⭐
│   │   ├── ledger.py        # Financial Ledger
│   │   ├── advance.py       # Employee Advances
│   │   ├── kyb.py           # KYB Verification
│   │   ├── whitelist.py     # Wallet Whitelist
│   │   ├── billing.py       # Usage Metering & Invoicing ⭐
│   │   ├── reimburse.py     # Full Reimbursement Flow ⭐
│   │   └── endpoints/       # Route handlers
│   │       ├── health.py    # Health checks
│   │       ├── upload.py    # POST /api/upload ⭐
│   │       ├── companies.py # Company CRUD
│   │       ├── employees.py # Employee CRUD
│   │       ├── receipts.py  # Receipt management
│   │       ├── policies.py  # Expense policies
│   │       └── vaults.py    # Vault deployment & linking ⭐
│   │
│   ├── core/                # Core utilities
│   │   ├── exceptions.py    # Custom exceptions
│   │   ├── security.py      # Auth & JWT
│   │   └── encryption.py    # PII Encryption (Fernet) ⭐
│   │
│   ├── db/                  # Database Layer
│   │   └── supabase.py      # Supabase client
│   │
│   ├── schemas/             # Pydantic models
│   │   ├── common.py
│   │   ├── company.py
│   │   ├── employee.py
│   │   ├── receipt.py
│   │   └── policy.py
│   │
│   └── services/            # Business Logic
│       ├── company.py
│       ├── employee.py
│       ├── receipt.py
│       ├── policy.py
│       ├── storage.py
│       ├── x402.py          # x402 Payment Protocol (Thirdweb Compatible) ⭐
│       ├── thirdweb.py      # Thirdweb Engine API Client ⭐
│       ├── audit.py         # AI Receipt Auditing ⭐
│       ├── ledger.py        # Financial Ledger ⭐
│       ├── advance.py       # Advance Management ⭐
│       ├── kyb.py           # KYB Verification ⭐
│       ├── whitelist.py     # Wallet Whitelist ⭐
│       ├── billing.py       # Usage Metering ⭐
│       └── vault.py         # Vault Deployment (Factory) ⭐
│
├── migrations/              # SQL migrations
│   ├── 001_initial_schema.sql
│   ├── 002_storage_policies.sql
│   ├── 003_additional_tables.sql  # Ledger, Advances, KYB, Whitelist ⭐
│   ├── 004_billing_tables.sql     # Usage records, Invoices ⭐
│   └── 005_vault_admin_address.sql # Vault admin tracking ⭐
│
├── tests/                   # Test suite
│   ├── conftest.py
│   ├── test_health.py
│   └── test_upload.py
│
├── .env.example             # Environment template
├── .gitignore
├── pyproject.toml           # UV/Python config
├── run.py                   # Dev server script
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- [UV Package Manager](https://github.com/astral-sh/uv)
- Supabase account

### 1. Install UV (if not already installed)

```powershell
# Windows (PowerShell)
irm https://astral.sh/uv/install.ps1 | iex

# Or with pip
pip install uv
```

### 2. Clone and Setup

```powershell
cd backend

# Create virtual environment and install dependencies
uv venv
.\.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

# Install dependencies
uv sync
```

### 3. Configure Environment

```powershell
# Copy the example env file
cp .env.example .env

# Edit .env with your Supabase credentials
```

Required environment variables:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Setup Database

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project (or use existing)
3. Go to **SQL Editor**
4. Run the migrations in order:
   - `migrations/001_initial_schema.sql`
   - `migrations/002_storage_policies.sql`

### 5. Run the Server

```powershell
# Development mode with hot reload
uv run python run.py

# Or directly with uvicorn
uv run uvicorn app.main:app --reload --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs (Swagger UI)
- **ReDoc**: http://localhost:8000/redoc

## 📡 API Endpoints

### Core Endpoints (for Dev 2 - Frontend)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | **Upload receipt** (main endpoint) |
| `GET` | `/api/receipts/{id}` | Get receipt details |
| `GET` | `/api/receipts/employee/{id}` | List employee receipts |
| `GET` | `/api/receipts/company/{id}/pending` | Get approval queue |

### Dual-Agent System (x402 + Thirdweb)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/audit` | **Agent A: AI receipt audit** (x402 gated) ⭐ |
| `GET` | `/api/audit/price` | Get current audit price |
| `POST` | `/api/treasury/payout` | **Agent B: USDC payout** (internal) ⭐ |
| `GET` | `/api/treasury/balance` | Check treasury balance |
| `GET` | `/api/treasury/transaction/{queue_id}` | Track payout status |

### x402 Payment Protocol (Thirdweb Compatible)

The audit endpoint uses the **x402 micropayment protocol** compatible with Thirdweb's SDK:

```
┌─────────┐      ┌─────────┐      ┌──────────────┐      ┌───────────────┐
│ Client  │      │ Backend │      │ Thirdweb     │      │ Blockchain    │
│ (React) │      │ (FastAPI)│     │ Facilitator  │      │ (Avalanche)   │
└────┬────┘      └────┬────┘      └──────┬───────┘      └───────┬───────┘
     │ POST /audit    │                   │                      │
     │───────────────>│                   │                      │
     │                │                   │                      │
     │ 402 + Payment  │                   │                      │
     │<───────────────│                   │                      │
     │                │                   │                      │
     │ User signs     │                   │                      │
     │ ERC-3009       │                   │                      │
     │                │                   │                      │
     │ POST /audit    │                   │                      │
     │ + X-Payment    │                   │                      │
     │───────────────>│ Settle via       │                      │
     │                │ facilitator API  │                      │
     │                │──────────────────>│ Execute transfer    │
     │                │                   │─────────────────────>│
     │ Audit result   │                   │                      │
     │<───────────────│                   │                      │
```

**402 Response Format:**
```json
{
  "x402Version": 1,
  "scheme": "exact",
  "network": "avalanche-fuji",
  "maxAmountRequired": "50000",
  "payTo": "0x2fAC...",
  "asset": "0x5425...",
  "description": "AI-powered receipt audit - $0.05"
}
```

**Price:** $0.05 USDC per audit

### Financial Ledger

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ledger` | Create ledger entry |
| `GET` | `/api/ledger/{id}` | Get ledger entry |
| `GET` | `/api/ledger/company/{id}` | Company transactions |
| `GET` | `/api/ledger/company/{id}/summary` | Financial summary |

### Employee Advances

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/advance/request` | Request an advance |
| `GET` | `/api/advance/config/{company_id}` | Get advance config |
| `POST` | `/api/advance/config/{company_id}` | Update advance config |
| `GET` | `/api/advance/employee/{id}` | Employee advance history |

### KYB Verification

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/kyb` | Submit KYB data |
| `GET` | `/api/kyb/{company_id}` | Get KYB status |
| `PUT` | `/api/kyb/{id}/status` | Admin: update status |
| `GET` | `/api/kyb/{company_id}/verified` | Check if verified |

### Wallet Whitelist

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/whitelist/check` | Check if wallet whitelisted |
| `POST` | `/api/whitelist` | Add wallet to whitelist |
| `DELETE` | `/api/whitelist` | Remove wallet |
| `GET` | `/api/whitelist/company/{id}` | Company whitelist |

### Company Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/companies` | Create company |
| `GET` | `/api/companies/{id}` | Get company |
| `GET` | `/api/companies/slug/{slug}` | Get by URL slug |
| `GET` | `/api/companies/{id}/stats` | Dashboard stats |

### Vault Integration (for Dev 1 - Web3)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/vaults/deploy` | **Deploy vault via Factory** ⭐ |
| `POST` | `/api/vaults/link` | Link existing vault to company |
| `GET` | `/api/vaults/company/{id}` | Get vault info |
| `GET` | `/api/vaults/balance/{company_id}` | Get vault USDC/AVAX balance |
| `GET` | `/api/vaults/permissions/{company_id}` | Verify operator permissions |

### Billing & Metering

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/billing/usage` | Record usage event |
| `GET` | `/api/billing/usage/{company_id}` | Get usage summary |
| `POST` | `/api/billing/invoice/{company_id}` | Generate invoice |
| `GET` | `/api/billing/invoices/{company_id}` | List invoices |

### Reimbursement Orchestration

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/reimburse/process` | **Full audit→payout flow** ⭐ |
| `POST` | `/api/reimburse/upload-and-process` | Upload + process in one call |
| `GET` | `/api/reimburse/status/{receipt_id}` | Get reimbursement status |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/ready` | Readiness check |

## 🔗 Integration Handshakes

### Dev 2 (Frontend) → Dev 3 (Backend)

The frontend calls `POST /api/upload` with:

```typescript
// Frontend code
const formData = new FormData();
formData.append('file', receiptFile);
formData.append('description', 'Team lunch');
formData.append('category', 'meals');

const response = await fetch('/api/upload', {
  method: 'POST',
  headers: {
    'X-Company-ID': companyId,
    'X-Employee-ID': employeeId,
  },
  body: formData,
});

const { receipt_id, status } = await response.json();
```

### Dev 1 (Web3) → Dev 3 (Backend)

After deploying a vault, call `POST /api/vaults/link`:

```typescript
// Web3 service code
const response = await fetch('/api/vaults/link', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': serviceApiKey,
  },
  body: JSON.stringify({
    company_id: 'uuid-here',
    vault_address: '0x1234...5678',
    chain_id: 43113, // Avalanche Fuji
    tx_hash: '0xabcd...efgh',
  }),
});
```

## 🔒 Row Level Security (RLS)

The database uses PostgreSQL RLS to ensure data isolation:

- **Company A cannot see Company B's data**
- Service role key bypasses RLS (backend only)
- Each table has tenant-scoped policies

Example RLS policy:
```sql
CREATE POLICY "Employees can view own receipts"
    ON receipts FOR SELECT
    USING (employee_id = auth.uid());
```

## 🧪 Testing

```powershell
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov=app

# Run specific test file
uv run pytest tests/test_health.py -v
```

## 📦 Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `companies` | Tenant organizations |
| `employees` | Company employees |
| `receipts` | Expense receipts |
| `policies` | Expense rules |
| `ledger_entries` | Transaction log |

### Key Relationships

```
companies (1) ──────── (*) employees
    │                        │
    │                        │
    └──── (*) receipts ──────┘
              │
              │
    ledger_entries
```

## 🛠️ Development

### Code Quality

```powershell
# Lint with Ruff
uv run ruff check .

# Format code
uv run ruff format .

# Type checking
uv run mypy app
```

### Adding New Endpoints

1. Create schema in `app/schemas/`
2. Add service logic in `app/services/`
3. Create endpoint in `app/api/endpoints/`
4. Register in `app/api/router.py`

## 🚢 Deployment

### Environment Variables for Production

```env
APP_ENV=production
DEBUG=false
SECRET_KEY=your-secure-production-key
ALLOWED_ORIGINS=https://reimburse.ai,https://app.reimburse.ai

# Blockchain - Set to true for Avalanche Mainnet
USE_MAINNET=true
# Automatically configures:
# - chain_id: 43114 (mainnet) vs 43113 (testnet)
# - chain_name: avalanche vs avalanche-fuji
# - usdc_token_address: mainnet vs testnet USDC

# Thirdweb Engine (for x402 payments)
THIRDWEB_ENGINE_URL=https://engine.thirdweb.com
THIRDWEB_SECRET_KEY=your-thirdweb-secret
THIRDWEB_COMPANY_WALLET_ADDRESS=0x...
THIRDWEB_AUDITOR_WALLET_ADDRESS=0x...  # Receives $0.05 USDC per audit

# OpenAI for AI Auditor
OPENAI_API_KEY=sk-...

# Treasury
TREASURY_SECRET_KEY=your-treasury-secret
```

### Docker (with UV)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install UV
RUN pip install uv

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-dev

# Copy application code
COPY app/ app/
COPY run.py .

EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Running with UV (recommended)

```bash
# Install UV if not already
pip install uv

# Sync dependencies
uv sync

# Run development server
uv run python run.py

# Or directly with uvicorn
uv run uvicorn app.main:app --reload --port 8000
```

## 📋 Phase Checklist

### Phase 1: SaaS Architecture & Vault
- [x] Database Schema with RLS
- [x] API Endpoints (`POST /api/upload`)
- [x] Company-Vault Linking (`POST /api/vaults/link`)
- [x] **Automated Vault Deployment** (`POST /api/vaults/deploy`) ⭐
- [x] **RBAC** (Operator vs Admin roles)

### Phase 2: Policy Engine & Credit Logic
- [x] Policy CRUD & Configuration
- [x] Policy-Aware AI Pipeline (GPT-4o)
- [x] Internal Ledger System
- [x] **Dynamic Billing/Metering** ⭐

### Phase 3: Security & Compliance
- [x] KYB/AML Integration
- [x] **PII Encryption** (Fernet) ⭐
- [x] Wallet Whitelist
- [x] **Mainnet Configuration** (`USE_MAINNET=true`) ⭐

### Phase 4: Multi-Company & Security (NEW)
- [x] **Multi-Company Employee Support** - Employees can work with multiple companies ⭐
- [x] **Cryptographic Audit Signatures** - All audit results are signed ⭐
- [x] **Rate Limiting** - Prevent abuse and brute force attacks ⭐
- [x] **Anomaly Detection** - Detect suspicious expense patterns ⭐
- [x] **Payout Verification** - Comprehensive security checks before payouts ⭐
- [x] **Security Logging** - Complete audit trail for compliance ⭐

---

## 🔐 Security System

### Overview

The security system protects against both AI Auditor attacks and Treasury attacks:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          SECURITY ARCHITECTURE                              │
│                                                                             │
│   ┌─────────────────┐        ┌─────────────────┐        ┌────────────────┐ │
│   │  AI AUDITOR     │        │  SECURITY       │        │   TREASURY     │ │
│   │                 │───────▶│  SERVICE        │───────▶│                │ │
│   │ Analyzes        │ Signed │                 │ Verified│ Sends          │ │
│   │ receipts        │ Result │ • Signatures    │ Auth   │ payments       │ │
│   │                 │        │ • Rate Limits   │        │                │ │
│   │ NO money        │        │ • Anomaly Check │        │ NO AI          │ │
│   │ access          │        │ • Verification  │        │ decisions      │ │
│   └─────────────────┘        └─────────────────┘        └────────────────┘ │
│                                                                             │
│   PROTECTIONS:                                                              │
│   ✓ Hacked AI cannot steal (no wallet access)                              │
│   ✓ Hacked Treasury cannot approve (needs signed audit)                    │
│   ✓ Rate limiting prevents brute force                                     │
│   ✓ Anomaly detection flags suspicious patterns                            │
│   ✓ High-value payouts require additional approval                         │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### Security Features

| Feature | Description | Endpoint |
|---------|-------------|----------|
| **Cryptographic Signatures** | All audit results are HMAC-signed with timestamp and nonce | `POST /api/security/audit/sign` |
| **Rate Limiting** | 10 audits/min, 5 payouts/min per company | `GET /api/security/rate-limit/{resource}/{id}` |
| **Anomaly Detection** | Velocity, amount deviation, merchant, time-based checks | Automatic during audit |
| **Payout Verification** | Signature validation, receipt status, daily limits | `POST /api/security/payout/verify` |
| **Security Logging** | All security events logged for compliance | Automatic |

### Security Thresholds

| Threshold | Value | Action |
|-----------|-------|--------|
| High-value expense | $500+ | Requires manager approval |
| Critical expense | $2,000+ | Requires multisig approval |
| Daily payout limit | $10,000 | Per company per day |
| Anomaly score | 0.7+ | Flagged for manual review |
| Max daily receipts | 20 | Per employee velocity check |

### Security API Endpoints

```bash
# Sign an audit result
POST /api/security/audit/sign
{
  "receipt_id": "uuid",
  "company_id": "uuid",
  "employee_id": "uuid",
  "amount": "150.00",
  "merchant": "Amazon",
  "category": "software",
  "audit_result": "approved",
  "confidence": 95.5
}

# Verify payout is secure
POST /api/security/payout/verify
{
  "receipt_id": "uuid",
  "company_id": "uuid",
  "employee_id": "uuid",
  "amount": "150.00",
  "recipient_wallet": "0x...",
  "vault_address": "0x...",
  "audit_signature": { ... }
}

# Check rate limit status
GET /api/security/rate-limit/audit/{company_id}

# Get security configuration
GET /api/security/config
```

---

## 👥 Multi-Company Employee Support

Employees can now work with multiple companies simultaneously:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     MULTI-COMPANY ARCHITECTURE                              │
│                                                                             │
│   ┌─────────────┐                                                          │
│   │  EMPLOYEE   │                                                          │
│   │  John Doe   │                                                          │
│   └──────┬──────┘                                                          │
│          │                                                                  │
│          ├─────────────────┬─────────────────┐                             │
│          ▼                 ▼                 ▼                              │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                     │
│   │  ACME Corp  │   │  Tech Inc   │   │  Startup Co │                     │
│   │  (Primary)  │   │  (Manager)  │   │  (Employee) │                     │
│   │             │   │             │   │             │                     │
│   │ Admin role  │   │ Manager role│   │ Employee    │                     │
│   │ Wallet: 0x1 │   │ Wallet: 0x2 │   │ Wallet: 0x1 │                     │
│   └─────────────┘   └─────────────┘   └─────────────┘                     │
│                                                                             │
│   Each membership has:                                                      │
│   • Separate role (admin/manager/employee)                                  │
│   • Optional different wallet per company                                   │
│   • Department and employee number                                          │
│   • Independent status (active/pending/inactive)                            │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### Multi-Company API Endpoints

```bash
# Get all companies an employee belongs to
GET /api/memberships/employee/{employee_id}/companies

# Switch active company context
POST /api/memberships/switch
{
  "company_id": "uuid",
  "set_as_primary": false
}

# Join a new company by code
POST /api/memberships/join
{
  "company_slug": "acme-corp",
  "wallet_address": "0x..."
}

# Leave a company
DELETE /api/memberships/leave/{company_id}

# Set primary company
PUT /api/memberships/set-primary/{company_id}
```

### Database Schema

New table `employee_company_memberships`:
```sql
CREATE TABLE employee_company_memberships (
    id UUID PRIMARY KEY,
    employee_id UUID REFERENCES employees(id),
    company_id UUID REFERENCES companies(id),
    role VARCHAR(50) DEFAULT 'employee',
    status employee_status DEFAULT 'pending',
    wallet_address VARCHAR(42),
    department VARCHAR(100),
    employee_number VARCHAR(50),
    is_primary BOOLEAN DEFAULT false,
    notifications_enabled BOOLEAN DEFAULT true,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, company_id)
);
```

## 🤝 Team Collaboration

| Dev | Role | Integration Point |
|-----|------|-------------------|
| Dev 1 | Web3 Lead | `POST /api/vaults/link` |
| Dev 2 | Frontend Lead | `POST /api/upload`, all `GET` endpoints |
| Dev 3 | Backend Lead | This codebase |

---

**Built with ❤️ for Reimburse.ai**
