# ReimburseAI Frontend

> Modern expense management interface built with Next.js 15 and React

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm or pnpm
- Backend API running

### Installation

```bash
cd frontend/apps/web
npm install
npm run dev
```

App runs at **http://localhost:3000**

---

## 🔑 Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your-client-id
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📂 Project Structure

```
src/
├── app/                    # Next.js pages
│   ├── page.tsx            # Landing page
│   ├── sign-in/            # Authentication
│   ├── dashboard/          # Main app
│   └── demo/               # Demo mode
├── components/
│   ├── landing/            # Marketing sections
│   ├── layout/             # Header/footer
│   └── ui/                 # Shared components
└── lib/
    └── providers.tsx       # React context
```

---

## 📱 Features

- **Dashboard** - Submit receipts, track expenses
- **Multi-Company** - Switch between organizations
- **Verification Control** - AI-only or human review mode
- **Multi-Currency** - Submit in any currency
- **Demo Mode** - Try without wallet

---

## 🎨 Design

- Avalanche-inspired color palette
- Glass morphism effects
- Responsive mobile-first design
- Dark mode by default

---

## 🧪 Development

```bash
npm run dev      # Development
npm run build    # Production build
npm run lint     # Lint code
npm test         # Run tests
```

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
vercel
```

### Production Environment

```env
NEXT_PUBLIC_API_URL=https://api.reimburseai.app
```

---

## 📄 License

MIT License
