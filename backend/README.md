# ReimburseAI Backend

> FastAPI backend for AI-powered expense reimbursement

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Supabase account
- API keys (see Environment Variables)

### Setup

```bash
cd backend

# Install uv (if not already installed)
pip install uv

# Create virtual environment
uv venv
.\.venv\Scripts\Activate.ps1  # Windows
# source .venv/bin/activate   # Linux/Mac

# Install dependencies
uv pip install -e .

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run server
uv run python run.py
```

Server runs at **http://localhost:8000**  
API docs at **http://localhost:8000/docs**

---

## 📂 Project Structure

```
backend/
├── app/
│   ├── api/           # REST endpoints
│   ├── services/      # Business logic
│   ├── schemas/       # Data models
│   ├── core/          # Security & utilities
│   └── db/            # Database connections
├── migrations/        # SQL migrations
├── tests/             # Test suite
└── run.py             # Entry point
```

---

## 🔑 Environment Variables

```env
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI
OPENAI_API_KEY=sk-...

# Blockchain
THIRDWEB_SECRET_KEY=your-secret-key
THIRDWEB_ENGINE_URL=https://engine.thirdweb.com

# Security
SECRET_KEY=your-random-secret-key
```

---

## 📡 Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/upload` | POST | Upload receipt |
| `/api/audit` | POST | AI audit receipt |
| `/api/companies` | POST | Create company |
| `/api/memberships/switch` | POST | Switch company |

Full API documentation: http://localhost:8000/docs

---

## 🗄️ Database Setup

Run migrations in Supabase SQL Editor:

1. `001_initial_schema.sql`
2. `002_storage_policies.sql`
3. `003_additional_tables_fixed.sql`
4. `004_billing_tables_fixed.sql`
5. `005_vault_admin_address.sql`
6. `006_fix_rls_policies.sql`
7. `007_update_ledger_schema.sql`
8. `008_waitlist_table.sql`
9. `009_multi_company_employees.sql`
10. `010_verification_mode.sql`
11. `011_multi_currency_support.sql`

---

## ✨ Features

- **AI Receipt Auditing** - Automated verification
- **Multi-Currency** - Support for global currencies
- **Multi-Company** - Employees work with multiple orgs
- **Verification Modes** - AI-only or human review
- **Blockchain Payments** - Instant stablecoin payouts
- **Enterprise Security** - Encryption, rate limiting

---

## 🧪 Testing

```bash
uv run pytest                    # Run all tests
uv run pytest --cov=app         # With coverage
uv run pytest tests/test_health.py -v  # Specific test
```

---

## 🚢 Deployment

### Docker

```bash
docker build -t reimburseai-backend .
docker run -p 8000:8000 --env-file .env reimburseai-backend
```

### Production Environment

```env
APP_ENV=production
DEBUG=false
USE_MAINNET=true
```

---

## 📄 License

MIT License
