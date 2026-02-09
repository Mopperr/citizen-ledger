# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **security@citizenledger.org** (or create a private security advisory on GitHub)

### What to Include

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the issue
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- **24 hours**: Initial acknowledgment
- **72 hours**: Preliminary assessment
- **7 days**: Detailed response with remediation plan
- **90 days**: Public disclosure (coordinated with reporter)

### Bug Bounty

We will establish a formal bug bounty program post-mainnet launch. Until then, responsible disclosure will be recognized in our security hall of fame and may be eligible for retroactive rewards.

## Security Measures

### Smart Contracts

- All contracts undergo internal review before deployment
- External audits planned before mainnet
- Deterministic builds ensure deployed code matches source
- Upgrade proposals require governance approval + 7-day timelock

### Infrastructure

- Multi-sig admin keys (3-of-5)
- Rate limiting on all public endpoints
- Monitoring and alerting for anomalous activity

### Code Review

- All changes require PR review
- CI/CD pipeline enforces tests and linting
- Branch protection on `main`

## Known Issues

None currently. Check [GitHub Issues](https://github.com/Mopperr/citizen-ledger/issues?q=is%3Aissue+label%3Asecurity) for updates.

## Audit Reports

| Date | Auditor | Scope | Report |
|------|---------|-------|--------|
| TBD  | TBD     | Smart Contracts | Pending |

## Contact

- Email: security@citizenledger.org
- GitHub Security Advisories: [Create Advisory](https://github.com/Mopperr/citizen-ledger/security/advisories/new)
