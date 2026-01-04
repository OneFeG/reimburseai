# Security Policy - Reimburse AI

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

At Reimburse AI, we take security seriously. We appreciate your efforts to responsibly disclose your findings.

### How to Report

**Please DO NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **security@reimburse.ai**

Include the following information:
- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

- **Response Time**: We will acknowledge your email within 48 hours
- **Assessment**: We will assess the vulnerability and determine its impact
- **Timeline**: We aim to fix critical vulnerabilities within 7 days
- **Disclosure**: We will coordinate with you on disclosure timing

### Bug Bounty Program

We offer rewards for responsible disclosure of security vulnerabilities:

| Severity | Reward |
|----------|--------|
| Critical | Up to $75 |
| High     | Up to $50 |
| Medium   | Up to $25 |
| Low      | Up to $10 |

### Scope

In scope:
- reimburse.ai web application
- api.reimburse.ai backend API
- Smart contracts (vault, treasury)
- Authentication and authorization systems
- Payment processing (x402, USDC transfers)
- Data encryption and storage

Out of scope:
- Third-party services (Supabase, Thirdweb, OpenAI)
- Social engineering attacks
- Physical attacks
- Denial of service attacks

## Security Measures

### Application Security
- ✅ Row Level Security (RLS) on all database tables
- ✅ Input validation and sanitization
- ✅ Rate limiting on all API endpoints
- ✅ CORS policy enforcement
- ✅ HTTPS only (HSTS enabled)
- ✅ Content Security Policy (CSP)

### Authentication & Authorization
- ✅ Web3 wallet-based authentication (Thirdweb)
- ✅ Email verification with 2FA
- ✅ Session management with secure tokens
- ✅ Role-based access control (RBAC)

### Data Protection
- ✅ PII encryption at rest (Fernet AES-128)
- ✅ TLS 1.3 for data in transit
- ✅ Secure key management
- ✅ Data retention policies

### Blockchain Security
- ✅ Multi-signature treasury operations (high-value)
- ✅ Cryptographic audit signatures
- ✅ Wallet whitelisting
- ✅ Transaction monitoring

### Monitoring & Incident Response
- ✅ Real-time error tracking (Sentry)
- ✅ Security event logging
- ✅ Anomaly detection
- ✅ Incident response procedures

## Compliance

- GDPR compliant data handling
- SOC 2 Type II (in progress)
- Regular security audits
- Penetration testing (quarterly)

## Contact

For security concerns: security@reimburse.ai
For general inquiries: hello@reimburse.ai

---

Thank you for helping keep Reimburse AI and our users safe!
