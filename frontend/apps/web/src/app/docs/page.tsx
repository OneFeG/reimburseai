"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Book,
  Code,
  Zap,
  Shield,
  Wallet,
  ArrowLeft,
  Search,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

const sections = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Zap,
    items: [
      { id: "introduction", title: "Introduction" },
      { id: "quick-start", title: "Quick Start Guide" },
      { id: "concepts", title: "Core Concepts" },
    ],
  },
  {
    id: "api-reference",
    title: "API Reference",
    icon: Code,
    items: [
      { id: "authentication", title: "Authentication" },
      { id: "receipts", title: "Receipts API" },
      { id: "audit", title: "Audit API" },
      { id: "x402", title: "x402 Protocol" },
    ],
  },
  {
    id: "guides",
    title: "Guides",
    icon: Book,
    items: [
      { id: "company-setup", title: "Company Setup" },
      { id: "employee-onboarding", title: "Employee Onboarding" },
      { id: "policy-configuration", title: "Policy Configuration" },
    ],
  },
  {
    id: "security",
    title: "Security",
    icon: Shield,
    items: [
      { id: "encryption", title: "Data Encryption" },
      { id: "wallet-security", title: "Wallet Security" },
      { id: "compliance", title: "Compliance" },
    ],
  },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("introduction");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-navy-900/80 backdrop-blur-xl border-b border-white/5">
        <div className="container-custom flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-8" />
            </Link>
            <span className="text-white/30">|</span>
            <span className="text-white font-medium">Documentation</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search docs..."
                className="w-64 pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50"
              />
            </div>
            <a
              href="https://github.com/reimburseai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      <div className="container-custom">
        <div className="flex">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto py-8 pr-8 border-r border-white/5">
            <nav className="space-y-6">
              {sections.map((section) => (
                <div key={section.id}>
                  <div className="flex items-center gap-2 text-white/40 text-xs font-medium uppercase tracking-wider mb-3">
                    <section.icon className="w-4 h-4" />
                    {section.title}
                  </div>
                  <ul className="space-y-1">
                    {section.items.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => setActiveSection(item.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            activeSection === item.id
                              ? "bg-cyan-400/10 text-cyan-400"
                              : "text-white/50 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {item.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 py-8 lg:pl-8 min-w-0">
            <div className="max-w-3xl">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-white/40 mb-8">
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span>Documentation</span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-white">Introduction</span>
              </div>

              {/* Content */}
              <article className="prose prose-invert max-w-none">
                <h1 className="text-4xl font-bold text-white mb-4">
                  Welcome to Reimburse AI
                </h1>
                <p className="text-lg text-white/60 mb-8">
                  Reimburse AI is an AI-powered expense management platform that automates
                  receipt auditing and enables instant USDC payouts on Avalanche.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <QuickLink
                    title="Quick Start"
                    description="Get up and running in 5 minutes"
                    href="#quick-start"
                    icon={Zap}
                  />
                  <QuickLink
                    title="API Reference"
                    description="Explore our REST API endpoints"
                    href="#api-reference"
                    icon={Code}
                  />
                </div>

                <h2 className="text-2xl font-bold text-white mt-12 mb-4">
                  Core Features
                </h2>
                <ul className="space-y-4 text-white/60">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-cyan-400/20 text-cyan-400 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      <strong className="text-white">AI Receipt Auditing:</strong> GPT-4o Vision
                      extracts vendor, amount, date, and validates against your expense policy.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-cyan-400/20 text-cyan-400 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      <strong className="text-white">Instant USDC Payouts:</strong> Approved expenses
                      are paid out in seconds on Avalanche blockchain.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-cyan-400/20 text-cyan-400 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      <strong className="text-white">x402 Protocol:</strong> HTTP-native payment
                      protocol for pay-per-use API access.
                    </span>
                  </li>
                </ul>

                <h2 className="text-2xl font-bold text-white mt-12 mb-4">
                  Quick Example
                </h2>
                <p className="text-white/60 mb-4">
                  Submit an expense and trigger an AI audit with a simple API call:
                </p>

                <CodeBlock
                  id="example-1"
                  language="bash"
                  code={`# Upload a receipt
curl -X POST https://api.reimburseai.app/receipts/upload \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@receipt.jpg" \\
  -F "employee_id=emp_123"

# Response
{
  "receipt_id": "rec_abc123",
  "status": "uploaded",
  "audit_status": "pending"
}`}
                  onCopy={copyCode}
                  isCopied={copiedCode === "example-1"}
                />

                <CodeBlock
                  id="example-2"
                  language="bash"
                  code={`# Trigger AI audit
curl -X POST https://api.reimburseai.app/audit/receipt \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"receipt_id": "rec_abc123"}'

# Response
{
  "receipt_id": "rec_abc123",
  "audit_result": {
    "vendor": "United Airlines",
    "amount": 450.00,
    "date": "2024-01-15",
    "category": "Travel",
    "approved": true,
    "confidence": 0.97
  },
  "payout_status": "completed",
  "tx_hash": "0xabc123..."
}`}
                  onCopy={copyCode}
                  isCopied={copiedCode === "example-2"}
                />

                <h2 className="text-2xl font-bold text-white mt-12 mb-4">
                  x402 Protocol
                </h2>
                <p className="text-white/60 mb-4">
                  The x402 protocol enables HTTP-native micropayments. Each API request can be
                  paid for with USDC using ERC-3009 signatures:
                </p>

                <CodeBlock
                  id="example-3"
                  language="bash"
                  code={`# Make a paid API request with x402
curl -X POST https://api.reimburseai.app/audit/receipt \\
  -H "X-Payment: eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9..." \\
  -H "Content-Type: application/json" \\
  -d '{"receipt_id": "rec_abc123"}'

# The X-Payment header contains:
# - ERC-3009 authorization signature
# - Payment amount (0.50 USDC per audit)
# - Nonce for replay protection`}
                  onCopy={copyCode}
                  isCopied={copiedCode === "example-3"}
                />

                <h2 className="text-2xl font-bold text-white mt-12 mb-4">
                  Next Steps
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  <Link
                    href="#"
                    className="p-4 rounded-xl border border-white/10 hover:border-cyan-400/30 hover:bg-white/[0.02] transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium mb-1">
                          Set up your company
                        </h3>
                        <p className="text-white/40 text-sm">
                          Configure policies, invite employees, and fund your treasury
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-cyan-400 transition-colors" />
                    </div>
                  </Link>
                  <Link
                    href="#"
                    className="p-4 rounded-xl border border-white/10 hover:border-cyan-400/30 hover:bg-white/[0.02] transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium mb-1">
                          Explore the API
                        </h3>
                        <p className="text-white/40 text-sm">
                          Full reference documentation for all endpoints
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-cyan-400 transition-colors" />
                    </div>
                  </Link>
                </div>
              </article>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: any;
}) {
  return (
    <a
      href={href}
      className="p-4 rounded-xl border border-white/10 hover:border-cyan-400/30 hover:bg-white/[0.02] transition-all group"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-cyan-400" />
        </div>
        <h3 className="text-white font-medium">{title}</h3>
      </div>
      <p className="text-white/40 text-sm">{description}</p>
    </a>
  );
}

function CodeBlock({
  id,
  language,
  code,
  onCopy,
  isCopied,
}: {
  id: string;
  language: string;
  code: string;
  onCopy: (code: string, id: string) => void;
  isCopied: boolean;
}) {
  return (
    <div className="relative my-6 rounded-xl bg-navy-800/50 border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <span className="text-xs text-white/30 font-mono">{language}</span>
        <button
          onClick={() => onCopy(code, id)}
          className="flex items-center gap-1 text-xs text-white/30 hover:text-white transition-colors"
        >
          {isCopied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm text-white/70 font-mono">{code}</code>
      </pre>
    </div>
  );
}
