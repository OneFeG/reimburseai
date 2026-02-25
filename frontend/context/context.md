# Reimburse.ai B2B SaaS – System Context

## Product Vision
- Automate receipt auditing and reimbursements for companies
- Provide instant, transparent payouts to employees when receipts are valid
- Enable configurable policies, KYB/credit controls, and optional liquidity advances for cash timing gaps

## Stakeholders & Personas
- Company Admin: sets policies, reviews ledger, manages KYB and advance config
- Finance Ops: monitors reimbursements, reconciles payouts, exports data
- Employee: uploads receipts, views approval and payout status
- Platform Operator: manages wallets, pricing, observability, and compliance

## Core Capabilities
- Receipt upload, image parsing, and audit decision with AI
- Pay-per-audit billing via x402 (flat fee per audit)
- USDC payouts from company server wallet to employee wallet
- Configurable policy engine (caps, categories, vendor whitelist, receipt age)
- Optional liquidity advances with limits, fees, and ledger entries
- Dashboards for employees and company admins

## High-Level Architecture
- Frontend (Next.js) for employee and admin dashboards
- API layer (App Router endpoints) for uploads, audit, payouts, policy, ledger, KYB
- AI SDK for model inference and structured output (merchant/date/totals/items/anomalies)
- x402 payment gating for audit fees (pre-verification and settlement to merchant wallet)
- Thirdweb Engine for on-chain payouts (USDC) from company server wallet
- Storage and database (to be added for B2B production): receipts, audit results, policies, tenants, ledger

## Primary Flows
- Upload → Audit → Payout
  - Employee uploads an image
  - Gateway calls Auditor behind x402 payment gate
  - Auditor verifies payment cap, runs model, charges flat fee, returns decision
  - If valid, gateway triggers Treasury to send USDC to the employee
  - UI shows approval/rejection and payout transaction hash
- Admin Configuration
  - Set policy caps/categories/vendors/days
  - Configure advance limits/fees/enabled
  - Monitor balances, ledger entries, KYB status
- Advance Decisioning (optional)
  - Admin enables advance facility with credit limit and fee
  - System decides per-amount eligibility and logs ledger entries

## Endpoints (Responsibilities)
- `/api/treasure/receipts`: Upload gateway; forwards image to Auditor via x402; triggers payout on success; records receipt history
- `/api/auditor`: Audit service; verifies payment cap; analyzes image with AI; settles flat audit fee; returns `reimbursementValid` and `decisionReason`
- `/api/treasure`: Treasury payout; sends USDC from company server wallet to employee wallet; returns `transactionHash`
- `/api/policies`: Company policy store (amount cap, allowed categories, vendor whitelist, max days old)
- `/api/advance`: Advance decisions for requested amounts
- `/api/advance/config`: CRUD for advance configuration (limits, fees, enabled)
- `/api/ledger`: In-memory ledger (advance/company entries) for demo; replace with DB in SaaS
- `/api/kyb`: Company KYB status/config placeholder
- `/api/treasure/employees`: Demo employees list

## Wallet Roles & Payments
- Company Server Wallet (payer & cashier)
  - Pays the x402 audit fee (designated as `from` in x402 fetch)
  - Sends USDC payouts to employees via Thirdweb Engine
- Agent A Facilitator Server Wallet
  - Used by the x402 facilitator to orchestrate settlement mechanics
- Agent A Merchant Wallet (recipient)
  - Receives the flat audit fee from the company
- Company Merchant Wallet
  - Reserved for company income flows (not used in current demo)

## Pricing & Settlement
- Audit fee: flat $0.50 per audit (USDC, 6 decimals → 500,000 base units)
- Payout amount: pay audited `total` in USDC (roadmap), currently a fixed demo amount
- x402 steps:
  - Pre-verification: verify signed payment cap before running AI
  - Settlement: pay flat audit fee to merchant wallet via facilitator
- Treasury payout:
  - Authenticated call enqueues a USDC transfer; waits for `transactionHash`

## Policy Engine (Current + Roadmap)
- Current: Auditor enforces a simple hackathon rule (e.g., under $100, date in 2025)
- Roadmap: Make `/api/policies` authoritative; auditor reads and enforces dynamic rules:
  - `amountCapUsd`
  - `allowedCategories`
  - `vendorWhitelist`
  - `maxDaysOld`

## Data Model (Initial)
- Tenant: company org, billing config, KYB status
- Employee: id, name, wallet, org linkage
- Receipt: id, tenant, employee, file metadata, audit result, payout status, tx hash
- Policy: per-tenant caps/categories/vendors/age limits
- Ledger: entries recording advances, payouts, fees, settlements
- AdvanceConfig: credit limit, utilization, fee bps, enabled

## Security & Compliance
- Payout endpoint requires secret key header; only internal calls can trigger payouts
- Payment gating avoids unauthorized or unbounded audit calls
- Separate wallets for payer, facilitator, and merchant reduce risk
- Future: encrypt PII, RBAC, audit logs, data retention policies, DPA compliance, AML/KYB integrations

## Environments
- Development: testnet (Avalanche Fuji) + demo USDC token
- Production: mainnet; provision funded server wallets; set merchant wallets; strict observability and error handling

## Operations & Observability
- Logs: audit decisions, payout tx hashes, fee settlements
- Metrics: approval rate, anomaly rate, reimbursement time, payout success, fees
- Alerts: failed payouts, settlement errors, KYB gating triggers

## Roadmap (B2B SaaS)
Phase 1: SaaS Architecture & Vault Implementation (Weeks 1–2)

Objective: Establish the secure, multi-tenant infrastructure using a self-custodial Smart Contract Vault model.

Key Activities:

- Automated Vault Deployment: Implement a Factory Contract using the Thirdweb SDK to programmatically deploy a unique, self-custodial Treasury Vault for each onboarding company.

- Role-Based Access Control (RBAC): Configure smart contract permissions to assign the "Operator" role to the application (restricted to payment execution only) while retaining "Admin" privileges (fund withdrawal) for the client.

- Multi-Tenant Backend: Develop the database schema to segregate data across multiple organizations, ensuring strict isolation of receipts, employee records, and transaction history.

- Employee Submission Interface: Deploy the Next.js frontend allowing employees to upload receipts and view status without requiring direct wallet interaction.

Phase 2: Policy Engine & Credit Logic (Weeks 3–4)

Objective: Implement configurable corporate policies and the internal ledger for credit features.

Key Activities:

- Administrative Interface: Build the dashboard for Finance Managers to configure spending limits, approved merchant categories, and employee allowlists.

- Policy-Aware AI Pipeline: Integrate company-specific rules into the Auditor Agent's system prompt to enforce custom compliance standards (e.g., flagging alcohol or weekend expenses).

- Internal Ledger System: Develop the accounting logic to record, categorize, and archive all expense transactions, ensuring accurate financial reconciliation and verified audit trails for clients.

- Dynamic Billing System: Implement the metering logic to calculate service fees based on audit volume and credit utilization.

Phase 3: Security, Compliance & Mainnet Launch (Month 2)

Objective: Finalize security measures and deploy to the Avalanche C-Chain production environment.

Key Activities:

- KYB/AML Integration: Integrate third-party identity verification services to validate business entities prior to Vault deployment.

- Security Review: Conduct internal audits of the Thirdweb permission configurations and "Operator" logic to ensure funds cannot be misappropriated.

- Data Encryption: Implement encryption standards for sensitive employee Personally Identifiable Information (PII) within the database.

- Production Deployment: Deploy the Factory and Agent contracts to the Avalanche C-Chain Mainnet and onboard the initial pilot cohort.

Phase 4: Scaling & Advanced Features (Future Outlook)

Objective: Expand platform capabilities with financial credit services and enhanced AI security layers.

Key Activities:

- Receipts Advance (Liquidity): Research and architect a credit facility model to enable "instant settlement" for companies, effectively acting as a "Buy Now, Pay Later" for corporate expenses.

- AI Fraud Detection: Develop advanced computer vision models to detect manipulated or fabricated receipts (e.g., Photoshop detection, metadata analysis) beyond standard text validation.

- Cross-Chain Expansion: Explore deploying Vault Factories on other EVM-compatible chains to support multi-chain treasury management.

- ERP Integrations: Design API connectors for major accounting software (e.g., QuickBooks, Xero) to automate general ledger syncing.

## Constraints & Assumptions
- USDC used as settlement/payout currency; can be configurable by tenant
- Wallet addresses must exist and be funded on the chosen chain
- Auditor must verify payment caps before inference; settlement must succeed to return decisions
- Image evidence should be stored durably with retention policies in production

## Glossary
- Auditor: AI-powered service that validates receipts and returns decisions
- x402: Payment gating and settlement protocol for HTTP endpoints
- Server Wallet: Custodial wallet controlled by backend (EOA or smart account)
- Facilitator: Orchestrator for settlement using designated server wallet
- Merchant Wallet: Recipient of audit fee payments
- Policy: Company rules governing reimbursement eligibility