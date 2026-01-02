# ReimburseAI 🧾💰

> **AI-powered expense reimbursement with instant stablecoin payments**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🎯 What is ReimburseAI?

ReimburseAI is a modern expense management platform that transforms how companies handle reimbursements:

- **AI-Powered Auditing** - Receipts are verified automatically in seconds
- **Instant Payments** - Approved expenses are paid in stablecoins immediately
- **Multi-Currency Support** - Submit receipts in any currency, auto-converted
- **Full Company Control** - Choose AI-only or human-in-the-loop verification
- **Blockchain Audit Trail** - Complete transparency for every transaction

**Result:** Submit receipt → AI verifies → Get paid instantly. Days become seconds.

---

## ✨ Key Features

### For Employees
- 📸 **Snap & Submit** - Take a photo, upload, done
- 🌍 **Any Currency** - Submit receipts in USD, EUR, GBP, INR, or any currency
- ⚡ **Instant Payments** - No more waiting weeks for reimbursement
- 🏢 **Multi-Company** - Work with multiple organizations from one account

### For Companies
- 🤖 **AI Auditing** - Advanced fraud detection and policy compliance
- 🎛️ **Verification Control** - Autonomous AI or human-in-the-loop modes
- 💱 **Multi-Currency** - Set your base currency, all receipts auto-convert
- 📊 **Complete Audit Trail** - Every transaction recorded on blockchain
- 🔒 **Enterprise Security** - Bank-grade encryption and access controls

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- npm

### Development Setup

```bash
# Clone repository
git clone https://github.com/your-org/reimburse-ai.git
cd reimburse-ai

# Backend
cd backend
pip install uv
uv venv
.\.venv\Scripts\Activate.ps1  # Windows
uv pip install -e .
cp .env.example .env
uv run python run.py

# Frontend (new terminal)
cd frontend/apps/web
npm install
cp .env.example .env.local
npm run dev
```

- Backend: http://localhost:8000
- Frontend: http://localhost:3000

---

## 📂 Project Structure

```
reimburse.ai/
├── frontend/          # Next.js web application
├── backend/           # Python FastAPI backend
├── Web3/              # Blockchain integration
```

---

## 🔐 Security

ReimburseAI implements enterprise-grade security:

- **Separation of Duties** - AI auditor and treasury are isolated systems
- **Cryptographic Verification** - All audit results are cryptographically signed
- **Rate Limiting** - Protection against abuse and attacks
- **Anomaly Detection** - Intelligent fraud detection algorithms
- **Configurable Limits** - Set daily limits and approval thresholds

---

## 💼 Multi-Company Support

Employees can work with multiple organizations:

- Switch between companies with one click
- Different roles per company (Admin, Manager, Employee)
- Independent expense tracking per organization
- Optional separate wallet addresses per company

---

## 🌍 Multi-Currency

Global expense management made simple:

- **Submit in Any Currency** - USD, EUR, GBP, INR, JPY, and more
- **Auto-Conversion** - Receipts automatically converted to company's base stablecoin
- **Exchange Rate Tracking** - Full audit trail of conversion rates
- **Multiple Stablecoins** - USDC, EURC, USDT, DAI support

---

## 🎛️ Verification Modes

Companies control how receipts are verified:

| Mode | Description |
|------|-------------|
| **Autonomous** | AI handles everything automatically |
| **Human Review** | All receipts require human approval |
| **Hybrid** | AI for routine, human for flagged items |
| **High-Value** | Human review above threshold |

---

## 🚢 Deployment


```bash
# Docker deployment
docker-compose up -d
```

---

## 📚 Documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md) - How to contribute
- [SECURITY.md](./SECURITY.md) - Security policies

---

## 🛣️ Roadmap

- [x] AI receipt auditing
- [x] Instant stablecoin payments
- [x] Multi-company support
- [x] Multi-currency support
- [x] Flexible verification modes
- [ ] Mobile app (React Native)
- [ ] Invoice generation
- [ ] Advanced analytics dashboard
- [ ] Multi-chain expansion

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

**Built with ❤️ for the future of expense management**

🌐 [reimburseai.app](https://www.reimburseai.app)
