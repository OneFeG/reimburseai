"use client";

import { useState, useEffect } from "react";
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
  Settings,
  Users,
  FileText,
  Lock,
  Key,
  CheckCircle,
  AlertTriangle,
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
                <span className="text-white capitalize">{activeSection.replace("-", " ")}</span>
              </div>

              {/* Dynamic Content */}
              <article className="prose prose-invert max-w-none">
                {renderContent(activeSection, copyCode, copiedCode)}
              </article>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// Content renderer based on active section
function renderContent(
  section: string,
  copyCode: (code: string, id: string) => void,
  copiedCode: string | null
) {
  switch (section) {
    case "introduction":
      return <IntroductionContent copyCode={copyCode} copiedCode={copiedCode} />;
    case "quick-start":
      return <QuickStartContent copyCode={copyCode} copiedCode={copiedCode} />;
    case "concepts":
      return <CoreConceptsContent />;
    case "authentication":
      return <AuthenticationContent copyCode={copyCode} copiedCode={copiedCode} />;
    case "receipts":
      return <ReceiptsAPIContent copyCode={copyCode} copiedCode={copiedCode} />;
    case "audit":
      return <AuditAPIContent copyCode={copyCode} copiedCode={copiedCode} />;
    case "x402":
      return <X402Content copyCode={copyCode} copiedCode={copiedCode} />;
    case "company-setup":
      return <CompanySetupContent />;
    case "employee-onboarding":
      return <EmployeeOnboardingContent />;
    case "policy-configuration":
      return <PolicyConfigurationContent />;
    case "encryption":
      return <EncryptionContent />;
    case "wallet-security":
      return <WalletSecurityContent />;
    case "compliance":
      return <ComplianceContent />;
    default:
      return <IntroductionContent copyCode={copyCode} copiedCode={copiedCode} />;
  }
}

// Introduction Content
function IntroductionContent({
  copyCode,
  copiedCode,
}: {
  copyCode: (code: string, id: string) => void;
  copiedCode: string | null;
}) {
  return (
    <>
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
        <li className="flex items-start gap-3">
          <span className="w-6 h-6 rounded-full bg-cyan-400/20 text-cyan-400 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
            4
          </span>
          <span>
            <strong className="text-white">Verification Modes:</strong> Choose between
            autonomous AI processing or human verification for receipt approvals.
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
        id="intro-example-1"
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
        isCopied={copiedCode === "intro-example-1"}
      />
    </>
  );
}

// Quick Start Content
function QuickStartContent({
  copyCode,
  copiedCode,
}: {
  copyCode: (code: string, id: string) => void;
  copiedCode: string | null;
}) {
  return (
    <>
      <h1 className="text-4xl font-bold text-white mb-4">Quick Start Guide</h1>
      <p className="text-lg text-white/60 mb-8">
        Get your company set up and processing receipts in under 5 minutes.
      </p>

      <div className="p-4 rounded-xl bg-cyan-400/10 border border-cyan-400/20 mb-8">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <p className="text-white/80 text-sm">
            <strong className="text-cyan-400">Prerequisites:</strong> You&apos;ll need a wallet address and some test USDC on Avalanche Fuji for testing.
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Step 1: Create Your Company</h2>
      <p className="text-white/60 mb-4">
        Sign up with your wallet and register your company:
      </p>
      <CodeBlock
        id="qs-step1"
        language="bash"
        code={`curl -X POST https://api.reimburseai.app/companies \\
  -H "Authorization: Bearer YOUR_WALLET_SIGNATURE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Acme Corp",
    "email": "admin@acme.com",
    "slug": "acme-corp"
  }'`}
        onCopy={copyCode}
        isCopied={copiedCode === "qs-step1"}
      />

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Step 2: Configure Your Policy</h2>
      <p className="text-white/60 mb-4">
        Set up expense limits and verification mode:
      </p>
      <CodeBlock
        id="qs-step2"
        language="bash"
        code={`curl -X POST https://api.reimburseai.app/policies \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "company_id": "your_company_id",
    "verification_mode": "autonomous",
    "daily_receipt_limit": 10,
    "amount_cap_usd": 500,
    "allowed_categories": ["travel", "meals", "software"]
  }'`}
        onCopy={copyCode}
        isCopied={copiedCode === "qs-step2"}
      />

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Step 3: Add Employees</h2>
      <p className="text-white/60 mb-4">
        Invite employees to submit expenses:
      </p>
      <CodeBlock
        id="qs-step3"
        language="bash"
        code={`curl -X POST https://api.reimburseai.app/employees \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "company_id": "your_company_id",
    "email": "employee@acme.com",
    "name": "John Doe",
    "wallet_address": "0x..."
  }'`}
        onCopy={copyCode}
        isCopied={copiedCode === "qs-step3"}
      />

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Step 4: Submit a Receipt</h2>
      <p className="text-white/60 mb-4">
        Upload a receipt for automatic processing:
      </p>
      <CodeBlock
        id="qs-step4"
        language="bash"
        code={`curl -X POST https://api.reimburseai.app/reimburse/upload-and-process \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@receipt.jpg" \\
  -F "employee_id=emp_123" \\
  -F "company_id=your_company_id" \\
  -F "description=Lunch meeting with client"`}
        onCopy={copyCode}
        isCopied={copiedCode === "qs-step4"}
      />

      <div className="p-4 rounded-xl bg-emerald-400/10 border border-emerald-400/20 mt-8">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-white/80 text-sm">
            <strong className="text-emerald-400">Success!</strong> Your receipt will be processed by AI and, if approved, payment will be sent automatically to the employee&apos;s wallet.
          </p>
        </div>
      </div>
    </>
  );
}

// Core Concepts Content
function CoreConceptsContent() {
  return (
    <>
      <h1 className="text-4xl font-bold text-white mb-4">Core Concepts</h1>
      <p className="text-lg text-white/60 mb-8">
        Understand the key concepts behind Reimburse AI.
      </p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Verification Modes</h2>
      <p className="text-white/60 mb-4">
        Companies can choose how receipts are verified and processed:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-5 rounded-xl bg-cyan-400/5 border border-cyan-400/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-400/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-white font-semibold">Autonomous Mode</h3>
          </div>
          <p className="text-white/60 text-sm">
            AI processes receipts instantly. Approved expenses are paid automatically without human intervention.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-white/50">
            <li>• Instant processing</li>
            <li>• AI-powered validation</li>
            <li>• Automatic payouts</li>
          </ul>
        </div>
        
        <div className="p-5 rounded-xl bg-purple-400/5 border border-purple-400/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-400/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-white font-semibold">Human Verification</h3>
          </div>
          <p className="text-white/60 text-sm">
            All receipts require manual review. Best for organizations needing full control over approvals.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-white/50">
            <li>• Manual review queue</li>
            <li>• Full approval control</li>
            <li>• Audit trail</li>
          </ul>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Daily Receipt Limits</h2>
      <p className="text-white/60 mb-4">
        Companies set a maximum number of receipts each employee can upload per day. This helps:
      </p>
      <ul className="space-y-2 text-white/60 mb-4">
        <li className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          Prevent abuse and fraud
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          Control API costs
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          Manage review workload (human verification mode)
        </li>
      </ul>
      <p className="text-white/60">
        Default limit is <strong className="text-white">3 receipts/day</strong> for human verification mode and <strong className="text-white">10 receipts/day</strong> for autonomous mode.
      </p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Treasury Vaults</h2>
      <p className="text-white/60 mb-4">
        Each company gets a dedicated Treasury Vault smart contract on Avalanche. The vault:
      </p>
      <ul className="space-y-2 text-white/60">
        <li className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          Holds company USDC funds
        </li>
        <li className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          Enables instant employee payouts
        </li>
        <li className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          Self-custodial - only company can withdraw
        </li>
      </ul>
    </>
  );
}

// Authentication Content
function AuthenticationContent({
  copyCode,
  copiedCode,
}: {
  copyCode: (code: string, id: string) => void;
  copiedCode: string | null;
}) {
  return (
    <>
      <h1 className="text-4xl font-bold text-white mb-4">Authentication</h1>
      <p className="text-lg text-white/60 mb-8">
        Learn how to authenticate with the Reimburse AI API.
      </p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">API Keys</h2>
      <p className="text-white/60 mb-4">
        All API requests require an API key passed in the Authorization header:
      </p>
      <CodeBlock
        id="auth-1"
        language="bash"
        code={`curl -X GET https://api.reimburseai.app/receipts \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
        onCopy={copyCode}
        isCopied={copiedCode === "auth-1"}
      />

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Wallet Authentication</h2>
      <p className="text-white/60 mb-4">
        For wallet-based authentication, sign a message with your private key:
      </p>
      <CodeBlock
        id="auth-2"
        language="javascript"
        code={`import { signMessage } from "viem/accounts";

const message = \`Sign in to Reimburse AI\\nTimestamp: \${Date.now()}\`;
const signature = await signMessage({ message, privateKey });

// Include signature in request
fetch("https://api.reimburseai.app/auth/verify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message, signature, address })
});`}
        onCopy={copyCode}
        isCopied={copiedCode === "auth-2"}
      />
    </>
  );
}

// Receipts API Content
function ReceiptsAPIContent({
  copyCode,
  copiedCode,
}: {
  copyCode: (code: string, id: string) => void;
  copiedCode: string | null;
}) {
  return (
    <>
      <h1 className="text-4xl font-bold text-white mb-4">Receipts API</h1>
      <p className="text-lg text-white/60 mb-8">
        Upload, retrieve, and manage expense receipts.
      </p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Upload Receipt</h2>
      <p className="text-white/60 mb-2">
        <code className="text-cyan-400">POST /reimburse/upload-and-process</code>
      </p>
      <p className="text-white/60 mb-4">
        Upload a receipt image and immediately process for reimbursement:
      </p>
      <CodeBlock
        id="receipts-1"
        language="bash"
        code={`curl -X POST https://api.reimburseai.app/reimburse/upload-and-process \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@receipt.jpg" \\
  -F "employee_id=emp_123" \\
  -F "company_id=comp_456" \\
  -F "description=Team lunch" \\
  -F "category=meals"

# Response
{
  "success": true,
  "receipt_id": "rec_abc123",
  "status": "paid",
  "amount_usd": 45.50,
  "decision_reason": "Receipt approved - within policy limits",
  "payout_queue_id": "queue_xyz789"
}`}
        onCopy={copyCode}
        isCopied={copiedCode === "receipts-1"}
      />

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Check Daily Limit</h2>
      <p className="text-white/60 mb-2">
        <code className="text-cyan-400">GET /reimburse/daily-limit/&#123;company_id&#125;/&#123;employee_id&#125;</code>
      </p>
      <p className="text-white/60 mb-4">
        Check how many receipts an employee can still upload today:
      </p>
      <CodeBlock
        id="receipts-2"
        language="bash"
        code={`curl -X GET https://api.reimburseai.app/reimburse/daily-limit/comp_456/emp_123 \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Response
{
  "company_id": "comp_456",
  "employee_id": "emp_123",
  "can_upload": true,
  "current_count": 2,
  "daily_limit": 10,
  "remaining_uploads": 8,
  "verification_mode": "autonomous",
  "requires_human_review": false
}`}
        onCopy={copyCode}
        isCopied={copiedCode === "receipts-2"}
      />

      <div className="p-4 rounded-xl bg-amber-400/10 border border-amber-400/20 mt-8">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-white/80 text-sm">
            <strong className="text-amber-400">Rate Limiting:</strong> When the daily limit is reached, 
            uploads will return a 429 status code. The limit resets at midnight UTC.
          </p>
        </div>
      </div>
    </>
  );
}

// Audit API Content
function AuditAPIContent({
  copyCode,
  copiedCode,
}: {
  copyCode: (code: string, id: string) => void;
  copiedCode: string | null;
}) {
  return (
    <>
      <h1 className="text-4xl font-bold text-white mb-4">Audit API</h1>
      <p className="text-lg text-white/60 mb-8">
        AI-powered receipt auditing and validation.
      </p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Process Reimbursement</h2>
      <p className="text-white/60 mb-2">
        <code className="text-cyan-400">POST /reimburse/process</code>
      </p>
      <p className="text-white/60 mb-4">
        Trigger AI audit on an already-uploaded receipt:
      </p>
      <CodeBlock
        id="audit-1"
        language="bash"
        code={`curl -X POST https://api.reimburseai.app/reimburse/process \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "receipt_id": "rec_abc123",
    "employee_id": "emp_123",
    "company_id": "comp_456"
  }'

# Response (Autonomous Mode - Approved)
{
  "success": true,
  "receipt_id": "rec_abc123",
  "status": "paid",
  "amount_usd": 45.50,
  "decision_reason": "Valid receipt within policy limits",
  "payout_queue_id": "queue_xyz789",
  "ledger_entry_id": "led_abc123"
}

# Response (Human Verification Mode)
{
  "success": true,
  "receipt_id": "rec_abc123",
  "status": "pending_review",
  "amount_usd": null,
  "decision_reason": "Receipt submitted for human review"
}`}
        onCopy={copyCode}
        isCopied={copiedCode === "audit-1"}
      />

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">AI Audit Results</h2>
      <p className="text-white/60 mb-4">
        The AI auditor extracts and validates the following data:
      </p>
      <ul className="space-y-2 text-white/60">
        <li><strong className="text-white">Vendor:</strong> Merchant name extracted from receipt</li>
        <li><strong className="text-white">Amount:</strong> Total amount in USD</li>
        <li><strong className="text-white">Date:</strong> Transaction date</li>
        <li><strong className="text-white">Category:</strong> Expense category (travel, meals, etc.)</li>
        <li><strong className="text-white">Confidence:</strong> AI confidence score (0-100%)</li>
        <li><strong className="text-white">Anomalies:</strong> Any detected issues (duplicates, alterations)</li>
      </ul>
    </>
  );
}

// x402 Content
function X402Content({
  copyCode,
  copiedCode,
}: {
  copyCode: (code: string, id: string) => void;
  copiedCode: string | null;
}) {
  return (
    <>
      <h1 className="text-4xl font-bold text-white mb-4">x402 Protocol</h1>
      <p className="text-lg text-white/60 mb-8">
        HTTP-native micropayments for pay-per-use API access.
      </p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Overview</h2>
      <p className="text-white/60 mb-4">
        The x402 protocol enables HTTP-native micropayments using ERC-3009 signatures. 
        Each API request can be paid for with USDC without requiring on-chain transactions.
      </p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Making a Paid Request</h2>
      <CodeBlock
        id="x402-1"
        language="bash"
        code={`# Include the X-Payment header with your payment signature
curl -X POST https://api.reimburseai.app/audit/receipt \\
  -H "X-Payment: eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9..." \\
  -H "Content-Type: application/json" \\
  -d '{"receipt_id": "rec_abc123"}'

# The X-Payment header contains:
# - ERC-3009 authorization signature
# - Payment amount (0.50 USDC per audit)
# - Nonce for replay protection`}
        onCopy={copyCode}
        isCopied={copiedCode === "x402-1"}
      />

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Pricing</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 text-white">Endpoint</th>
              <th className="text-left py-3 text-white">Cost</th>
            </tr>
          </thead>
          <tbody className="text-white/60">
            <tr className="border-b border-white/5">
              <td className="py-3">Receipt Audit</td>
              <td className="py-3">0.50 USDC</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-3">Fraud Detection</td>
              <td className="py-3">0.25 USDC</td>
            </tr>
            <tr>
              <td className="py-3">Receipt Upload</td>
              <td className="py-3">Free</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

// Company Setup Content
function CompanySetupContent() {
  return (
    <>
      <h1 className="text-4xl font-bold text-white mb-4">Company Setup</h1>
      <p className="text-lg text-white/60 mb-8">
        Complete guide to setting up your company on Reimburse AI.
      </p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Register Your Company</h2>
      <p className="text-white/60 mb-4">
        Create your company account by connecting your wallet and providing basic information:
      </p>
      <ul className="space-y-2 text-white/60 mb-6">
        <li>• Company name and email</li>
        <li>• Unique slug for your company URL</li>
        <li>• Admin wallet address</li>
      </ul>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Deploy Treasury Vault</h2>
      <p className="text-white/60 mb-4">
        A dedicated smart contract vault will be deployed for your company on Avalanche. This vault:
      </p>
      <ul className="space-y-2 text-white/60 mb-6">
        <li>• Holds your company&apos;s USDC funds</li>
        <li>• Enables instant employee payouts</li>
        <li>• Is fully self-custodial - only you can withdraw</li>
      </ul>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Configure Policy</h2>
      <p className="text-white/60 mb-4">
        Set up your expense policy including:
      </p>
      <ul className="space-y-2 text-white/60">
        <li>• <strong className="text-white">Verification Mode:</strong> Autonomous or Human Verification</li>
        <li>• <strong className="text-white">Daily Receipt Limit:</strong> Max uploads per employee per day</li>
        <li>• <strong className="text-white">Amount Caps:</strong> Per-receipt and monthly limits</li>
        <li>• <strong className="text-white">Allowed Categories:</strong> Travel, meals, software, etc.</li>
      </ul>
    </>
  );
}

// Employee Onboarding Content
function EmployeeOnboardingContent() {
  return (
    <>
      <h1 className="text-4xl font-bold text-white mb-4">Employee Onboarding</h1>
      <p className="text-lg text-white/60 mb-8">
        Guide for onboarding employees to submit expenses.
      </p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Adding Employees</h2>
      <p className="text-white/60 mb-4">
        Company admins can add employees through the dashboard or API:
      </p>
      <ul className="space-y-2 text-white/60 mb-6">
        <li>• Employee name and email</li>
        <li>• Department (optional)</li>
        <li>• Wallet address for receiving payouts</li>
      </ul>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Wallet Whitelisting</h2>
      <p className="text-white/60 mb-4">
        For security, employee wallets must be whitelisted before receiving payouts. This ensures:
      </p>
      <ul className="space-y-2 text-white/60 mb-6">
        <li>• Only authorized wallets can receive funds</li>
        <li>• Admins have full control over who can be paid</li>
        <li>• Instant revocation if needed</li>
      </ul>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Submitting Expenses</h2>
      <p className="text-white/60 mb-4">
        Employees can submit expenses by:
      </p>
      <ol className="space-y-2 text-white/60">
        <li>1. Taking a photo of the receipt</li>
        <li>2. Uploading through the dashboard or mobile app</li>
        <li>3. Adding description and category</li>
        <li>4. AI automatically processes and validates</li>
        <li>5. Payment sent to wallet (autonomous mode) or queued for review</li>
      </ol>
    </>
  );
}

// Policy Configuration Content
function PolicyConfigurationContent() {
  return (
    <>
      <h1 className="text-4xl font-bold text-white mb-4">Policy Configuration</h1>
      <p className="text-lg text-white/60 mb-8">
        Configure expense policies and verification modes for your organization.
      </p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Verification Modes</h2>
      
      <div className="space-y-4 mb-8">
        <div className="p-5 rounded-xl bg-cyan-400/5 border border-cyan-400/20">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            Autonomous Mode
          </h3>
          <p className="text-white/60 text-sm mb-3">
            AI processes and approves receipts automatically. Payments are instant.
          </p>
          <p className="text-white/50 text-xs">
            <strong>Best for:</strong> Companies that trust AI decisions and want fastest payouts.
          </p>
        </div>
        
        <div className="p-5 rounded-xl bg-purple-400/5 border border-purple-400/20">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Human Verification Mode
          </h3>
          <p className="text-white/60 text-sm mb-3">
            All receipts go to a review queue. Finance team must approve before payout.
          </p>
          <p className="text-white/50 text-xs">
            <strong>Best for:</strong> Companies requiring manual approval workflows.
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Daily Receipt Limits</h2>
      <p className="text-white/60 mb-4">
        Set the maximum number of receipts each employee can upload per day:
      </p>
      <ul className="space-y-2 text-white/60 mb-4">
        <li>• Default: <strong className="text-white">3/day</strong> (human verification) or <strong className="text-white">10/day</strong> (autonomous)</li>
        <li>• Range: 1 to 50 receipts per day</li>
        <li>• Resets at midnight UTC</li>
      </ul>

      <div className="p-4 rounded-xl bg-amber-400/10 border border-amber-400/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-white/80 text-sm">
            When limit is reached, employees receive a 429 error and cannot upload until the next day.
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Amount Limits</h2>
      <p className="text-white/60">
        Configure spending limits:
      </p>
      <ul className="space-y-2 text-white/60 mt-4">
        <li>• <strong className="text-white">Per-receipt cap:</strong> Maximum amount for a single expense</li>
        <li>• <strong className="text-white">Monthly cap:</strong> Maximum total per employee per month</li>
        <li>• <strong className="text-white">Auto-approve under:</strong> Automatically approve small expenses</li>
      </ul>
    </>
  );
}

// Encryption Content
function EncryptionContent() {
  return (
    <>
      <h1 className="text-4xl font-bold text-white mb-4">Data Encryption</h1>
      <p className="text-lg text-white/60 mb-8">
        How we protect your sensitive data.
      </p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">At-Rest Encryption</h2>
      <p className="text-white/60 mb-4">
        All data stored in our databases is encrypted using AES-256:
      </p>
      <ul className="space-y-2 text-white/60">
        <li>• Receipt images encrypted before storage</li>
        <li>• Employee PII encrypted in database</li>
        <li>• API keys hashed with bcrypt</li>
      </ul>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">In-Transit Encryption</h2>
      <p className="text-white/60 mb-4">
        All API communications use TLS 1.3:
      </p>
      <ul className="space-y-2 text-white/60">
        <li>• HTTPS enforced on all endpoints</li>
        <li>• Certificate pinning available for mobile apps</li>
        <li>• Perfect forward secrecy enabled</li>
      </ul>
    </>
  );
}

// Wallet Security Content
function WalletSecurityContent() {
  return (
    <>
      <h1 className="text-4xl font-bold text-white mb-4">Wallet Security</h1>
      <p className="text-lg text-white/60 mb-8">
        Best practices for securing your wallets.
      </p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Treasury Vault Security</h2>
      <ul className="space-y-2 text-white/60">
        <li>• Smart contracts audited by security firms</li>
        <li>• Role-based access control (RBAC)</li>
        <li>• Admin-only withdrawal capability</li>
        <li>• Multi-sig support available</li>
      </ul>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Employee Wallet Whitelisting</h2>
      <p className="text-white/60 mb-4">
        Employee wallets must be whitelisted by company admins before receiving payouts:
      </p>
      <ul className="space-y-2 text-white/60">
        <li>• Prevents unauthorized payouts</li>
        <li>• Instant revocation if employee leaves</li>
        <li>• Re-verification before each transfer</li>
      </ul>
    </>
  );
}

// Compliance Content
function ComplianceContent() {
  return (
    <>
      <h1 className="text-4xl font-bold text-white mb-4">Compliance</h1>
      <p className="text-lg text-white/60 mb-8">
        Our compliance standards and certifications.
      </p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">KYB Verification</h2>
      <p className="text-white/60 mb-4">
        Companies undergo Know Your Business (KYB) verification before vault deployment:
      </p>
      <ul className="space-y-2 text-white/60">
        <li>• Business registration verification</li>
        <li>• Beneficial owner identification</li>
        <li>• AML/CFT screening</li>
      </ul>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Audit Trail</h2>
      <p className="text-white/60 mb-4">
        Complete audit trail for all transactions:
      </p>
      <ul className="space-y-2 text-white/60">
        <li>• Every action logged with timestamps</li>
        <li>• On-chain transaction records</li>
        <li>• AI audit signatures for tamper detection</li>
        <li>• Export capabilities for auditors</li>
      </ul>
    </>
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
