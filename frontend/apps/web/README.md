# ReimburseAI Frontend

> **Modern, secure expense reimbursement interface** built with Next.js 16, React 18, and Thirdweb Web3 integration.

---

## 🎯 Overview

The ReimburseAI frontend is an Avalanche-inspired enterprise application that provides:

- **Employee Dashboard** - Submit receipts, track expenses, view payment history
- **Company Treasury** - Manage vault balances, view transactions, monitor spending
- **Web3 Integration** - Connect wallets via email, social login, or external wallets
- **AI-Powered Auditing** - Instant receipt analysis with x402 micropayments
- **Demo Mode** - Full walkthrough without wallet connection

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 16)                             │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                         PAGES                                       │ │
│  │                                                                     │ │
│  │  /                    Landing page with waitlist                    │ │
│  │  /sign-in             Authentication (wallet + demo mode)           │ │
│  │  /sign-up             New user registration                         │ │
│  │  /dashboard           Main employee dashboard                       │ │
│  │  /dashboard/submit    Receipt submission                            │ │
│  │  /dashboard/expenses  Expense management                            │ │
│  │  /dashboard/history   Payment history                               │ │
│  │  /dashboard/treasury  Company vault management                      │ │
│  │  /dashboard/settings  User preferences                              │ │
│  │  /demo                Interactive demo walkthrough                  │ │
│  │  /docs                Technical documentation                       │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                              │                                           │
│                              │ API Calls                                 │
│                              ▼                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                       BACKEND (FastAPI)                             │ │
│  │                                                                     │ │
│  │  /api/upload          Store receipts                                │ │
│  │  /api/audit           AI analysis ($0.50 via x402)                  │ │
│  │  /api/reimburse       Process payments                              │ │
│  │  /api/treasury        Vault operations                              │ │
│  │  /api/ledger          Transaction history                           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                              │                                           │
│                              │ Blockchain Ops                            │
│                              ▼                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                       WEB3 (Thirdweb)                               │ │
│  │                                                                     │ │
│  │  Vault Deployment     Company USDC vaults                           │ │
│  │  USDC Transfers       Instant reimbursements                        │ │
│  │  x402 Payments        Pay-per-audit micropayments                   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
frontend/apps/web/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # Landing page
│   │   ├── layout.tsx                # Root layout with providers
│   │   ├── globals.css               # Tailwind + custom styles
│   │   │
│   │   ├── sign-in/
│   │   │   └── page.tsx              # Sign in (wallet/demo)
│   │   ├── sign-up/
│   │   │   └── page.tsx              # Registration
│   │   │
│   │   ├── dashboard/
│   │   │   ├── page.tsx              # Dashboard overview
│   │   │   ├── submit/page.tsx       # Submit receipt
│   │   │   ├── expenses/page.tsx     # Manage expenses
│   │   │   ├── history/page.tsx      # Payment history
│   │   │   ├── treasury/page.tsx     # Company treasury
│   │   │   └── settings/page.tsx     # User settings
│   │   │
│   │   ├── demo/
│   │   │   └── page.tsx              # Interactive demo
│   │   │
│   │   ├── docs/
│   │   │   └── page.tsx              # Documentation
│   │   │
│   │   └── api/                      # API routes (proxy)
│   │
│   ├── components/
│   │   ├── landing/                  # Landing page sections
│   │   │   ├── hero.tsx              # Hero section
│   │   │   ├── hero-background.tsx   # Animated background
│   │   │   ├── features.tsx          # Features grid
│   │   │   ├── how-it-works.tsx      # Step-by-step flow
│   │   │   ├── benefits.tsx          # Benefits section
│   │   │   ├── technology.tsx        # Tech stack
│   │   │   ├── waitlist.tsx          # Email signup
│   │   │   └── faq.tsx               # FAQ accordion
│   │   │
│   │   ├── layout/
│   │   │   ├── header.tsx            # Navigation header
│   │   │   └── footer.tsx            # Site footer
│   │   │
│   │   └── ui/
│   │       └── logo.tsx              # ReimburseAI logo
│   │
│   ├── lib/
│   │   ├── providers.tsx             # React context providers
│   │   ├── smooth-scroll.tsx         # Scroll behavior
│   │   └── thirdweb.ts               # Thirdweb configuration
│   │
│   └── types/                        # TypeScript definitions
│
├── public/                           # Static assets
├── tailwind.config.ts                # Tailwind configuration
├── next.config.ts                    # Next.js configuration
├── tsconfig.json                     # TypeScript configuration
└── package.json                      # Dependencies
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** - Required for Next.js 16
- **npm** - Package manager
- **Backend running** - FastAPI at localhost:8000

### Installation

```bash
# Navigate to frontend
cd frontend/apps/web

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at **http://localhost:3000**

### Environment Variables

Create `.env.local` in the web directory:

```env
# Thirdweb Configuration
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your-client-id

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Chain Configuration
NEXT_PUBLIC_CHAIN_ID=43113
NEXT_PUBLIC_USDC_ADDRESS=0x5425890298aed601595a70AB815c96711a31Bc65
```

---

## 🔗 System Connections

### Backend API Integration

The frontend communicates with the FastAPI backend for all operations:

```typescript
// Example: Submit receipt
const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,  // Receipt image + metadata
  headers: {
    'Authorization': `Bearer ${walletAddress}`,
  },
});

// Example: Request audit (with x402 payment)
const auditResponse = await fetch('/api/audit', {
  method: 'POST',
  headers: {
    'X-PAYMENT': paymentHeader,  // Base64-encoded payment proof
  },
  body: JSON.stringify({ receipt_id: receiptId }),
});
```

### Web3 Integration (Thirdweb)

The frontend uses Thirdweb for wallet management and blockchain operations:

```typescript
// Wallet connection options
const wallets = [
  inAppWallet({
    auth: {
      options: ["email", "google", "apple", "passkey"],
    },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("io.rabby"),
];

// Connect to Avalanche Fuji
const chain = defineChain({
  id: 43113,
  name: "Avalanche Fuji",
  rpc: "https://api.avax-test.network/ext/bc/C/rpc",
});
```

### x402 Payment Flow

For AI audits, the frontend handles micropayments via x402:

```
┌─────────────────────────────────────────────────────────────────┐
│                     x402 PAYMENT FLOW                            │
│                                                                  │
│  1. User clicks "Audit Receipt"                                  │
│                    │                                             │
│                    ▼                                             │
│  2. Backend returns 402 Payment Required                         │
│     { amount: "500000", recipient: "0x..." }                      │
│                    │                                             │
│                    ▼                                             │
│  3. Frontend prompts user to sign payment                        │
│     (Thirdweb handles the UX)                                    │
│                    │                                             │
│                    ▼                                             │
│  4. Payment signed and sent via X-PAYMENT header                 │
│                    │                                             │
│                    ▼                                             │
│  5. Audit result returned                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Design System

### Colors (Avalanche-Inspired)

```css
/* Primary - Avalanche Red */
--primary: #E84142;
--primary-hover: #d13a3b;
--primary-light: rgba(232, 65, 66, 0.1);

/* Background Gradients */
--bg-dark: #0a0a0a;
--bg-gradient: linear-gradient(to bottom right, #0a0a0a, #1a1a2e);

/* Accent Colors */
--accent-purple: #8B5CF6;
--accent-cyan: #06B6D4;
--accent-green: #10B981;

/* Glass Effect */
--glass-bg: rgba(255, 255, 255, 0.05);
--glass-border: rgba(255, 255, 255, 0.1);
```

### Typography

```css
/* Headings */
font-family: 'Inter', sans-serif;
font-weight: 700;

/* Body */
font-family: 'Inter', sans-serif;
font-weight: 400;

/* Code */
font-family: 'JetBrains Mono', monospace;
```

### Components

The design follows these principles:

- **Glass morphism** - Translucent cards with blur effects
- **Subtle gradients** - Red to purple accent gradients
- **Grid backgrounds** - Subtle dot patterns for depth
- **Smooth animations** - Hover states and transitions

---

## 📱 Pages Overview

### Landing Page (`/`)

- **Hero** - Main value proposition with CTA
- **Features** - 6 key features in responsive grid
- **How It Works** - 4-step process visualization
- **Benefits** - Employee/Company dual benefits
- **Technology** - Tech stack showcase
- **Waitlist** - Email signup form
- **FAQ** - Common questions

### Dashboard (`/dashboard`)

- **Overview** - Stats cards, recent activity
- **Submit** - Drag-and-drop receipt upload
- **Expenses** - Expense list with status badges
- **History** - Payment transaction history
- **Treasury** - Vault balance and deposits
- **Settings** - User preferences

### Demo Mode

Accessible without wallet connection:

1. Click "Try Demo" on sign-in page
2. Explore full dashboard functionality
3. See simulated transactions
4. No real money involved

---

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION OPTIONS                        │
│                                                                  │
│  ┌───────────────────┐  ┌───────────────────┐                   │
│  │   WALLET LOGIN    │  │    DEMO MODE      │                   │
│  │                   │  │                   │                   │
│  │  • Email          │  │  • No wallet      │                   │
│  │  • Google         │  │  • Mock data      │                   │
│  │  • Apple          │  │  • Full UI        │                   │
│  │  • MetaMask       │  │  • No payments    │                   │
│  │  • Coinbase       │  │                   │                   │
│  │  • Rabby          │  │                   │                   │
│  └───────────────────┘  └───────────────────┘                   │
│                                                                  │
│  After authentication:                                           │
│  → Store wallet/demo state in context                           │
│  → Redirect to /dashboard                                        │
│  → Load user's company data                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Development

### Running Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Type checking
npm run type-check
```

### Code Quality

```bash
# Linting
npm run lint

# Format
npm run format

# All checks
npm run check
```

### Build for Production

```bash
# Build
npm run build

# Preview production build
npm start
```

---

## 📦 Dependencies

### Core

| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.1.1 | React framework |
| react | 18.3.1 | UI library |
| typescript | 5.x | Type safety |
| tailwindcss | 4.x | Styling |

### Web3

| Package | Version | Purpose |
|---------|---------|---------|
| thirdweb | 5.115.1 | Wallet connection |
| viem | 2.x | Ethereum utilities |

### UI

| Package | Version | Purpose |
|---------|---------|---------|
| lucide-react | latest | Icons |
| framer-motion | latest | Animations |

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### Environment Variables for Production

```env
# Required
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=prod-client-id
NEXT_PUBLIC_API_URL=https://api.reimburse.ai
NEXT_PUBLIC_CHAIN_ID=43114  # Mainnet

# Optional
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

---

## 🔧 Configuration

### Next.js Config (`next.config.ts`)

```typescript
const nextConfig = {
  experimental: {
    turbo: {},  // Turbopack enabled
  },
  images: {
    domains: ['your-storage-domain.com'],
  },
};
```

### Tailwind Config

Custom theme extends Avalanche branding:

```typescript
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#E84142',
        hover: '#d13a3b',
      },
    },
  },
}
```

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Hydration errors | Check client/server component boundaries |
| Wallet not connecting | Verify Thirdweb client ID |
| API calls failing | Ensure backend is running on :8000 |
| Styles not loading | Run `pnpm dev` again |
| Type errors | Run `pnpm type-check` |

---

## 📚 Resources

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Thirdweb React SDK](https://portal.thirdweb.com/react)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Avalanche Documentation](https://docs.avax.network/)

---

## 📄 License

MIT License - See [LICENSE](../../../LICENSE) for details.
