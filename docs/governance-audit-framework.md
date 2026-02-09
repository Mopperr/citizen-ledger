# Governance Audit Framework

> Citizen Ledger — Ensuring accountability and continuous improvement in on-chain governance.

---

## 1  Purpose

This framework defines periodic audit and review processes for all governance activities on Citizen Ledger. Audits ensure:

1. **Accountability** — Elected committees and funded projects deliver on commitments
2. **Transparency** — All governance actions are publicly reviewable
3. **Compliance** — On-chain parameters match documented policies
4. **Improvement** — Systematic feedback loop for governance parameter tuning

---

## 2  Audit Types

| Type | Scope | Frequency | Auditor |
|------|-------|-----------|---------|
| Proposal Audit | Individual proposals | After execution | Governance Committee |
| Treasury Audit | All treasury transactions | Monthly | Treasury Committee + External |
| Committee Audit | Committee activities + spending | Quarterly | Rotating peer committee |
| Smart Contract Audit | Contract code + state | Before each upgrade | External security firm |
| Parameter Audit | All governance parameters | Quarterly | Technical Advisory Board |
| Grant Program Audit | All active grants | Quarterly | Grant Review Committee |
| Full System Audit | End-to-end governance review | Annually | External auditor + community |

---

## 3  Proposal Audit Process

### 3.1  Scope

Every executed governance proposal is audited within 30 days of execution:

| Check | Description | Pass Criteria |
|-------|-------------|---------------|
| Execution fidelity | Did the on-chain execution match the proposal description? | 100 % match |
| Timeline compliance | Was the proposal executed within the stated timeframe? | Within 7 days of timelock expiry |
| Budget accuracy | Did actual spend match proposed budget (±10 %)? | Within tolerance |
| Outcome verification | Were stated goals achieved or in progress? | Evidence submitted |
| Side effects | Were there unintended consequences? | None, or documented mitigations |

### 3.2  Process

```
1. Proposal executes on-chain
    ↓
2. Automated audit bot creates audit ticket (within 24h)
    ↓
3. Assigned auditor reviews execution tx + state changes
    ↓
4. Auditor publishes findings on-chain (within 14 days)
    ↓
5. If discrepancy found → flagged for committee review
    ↓
6. Committee issues resolution or remediation proposal
    ↓
7. Audit report archived on IPFS + indexed on-chain
```

### 3.3  Audit Report Template

```json
{
  "audit_type": "proposal",
  "proposal_id": 42,
  "auditor": "citizen1...",
  "audit_date": "2025-03-15",
  "execution_hash": "0xABC...",
  "checks": {
    "execution_fidelity": { "pass": true, "notes": "" },
    "timeline_compliance": { "pass": true, "notes": "" },
    "budget_accuracy": { "pass": true, "actual": 95000, "proposed": 100000 },
    "outcome_verification": { "pass": true, "evidence_cid": "QmXYZ..." },
    "side_effects": { "pass": true, "notes": "None observed" }
  },
  "overall_pass": true,
  "recommendations": [],
  "ipfs_cid": "Qm..."
}
```

---

## 4  Treasury Audit

### 4.1  Monthly Treasury Review

| Check | Description |
|-------|-------------|
| Balance reconciliation | On-chain balance matches expected (inflows - outflows) |
| Authorization review | Every outflow has a matching approved proposal |
| Category compliance | Spending matches approved budget category allocations |
| Anomaly detection | Flag any single transaction > 5 % of treasury |
| Reserve adequacy | Treasury maintains ≥ 6 months operating reserve |

### 4.2  Automated Checks (via Indexer)

```sql
-- Flag unauthorized outflows
SELECT tx_hash, amount, recipient, block_height
FROM treasury_transactions
WHERE direction = 'outflow'
AND proposal_id IS NULL;

-- Budget category variance
SELECT category,
       SUM(amount) as actual_spend,
       budget_allocation,
       ABS(SUM(amount) - budget_allocation) / budget_allocation * 100 as variance_pct
FROM treasury_transactions t
JOIN budget_allocations b ON t.category = b.category
WHERE t.month = CURRENT_DATE - INTERVAL '1 month'
GROUP BY category, budget_allocation
HAVING variance_pct > 10;

-- Large transaction alerts
SELECT tx_hash, amount, recipient, block_height
FROM treasury_transactions
WHERE amount > (SELECT balance * 0.05 FROM treasury_balances ORDER BY block_height DESC LIMIT 1);
```

### 4.3  External Audit

- Annual external audit by an independent accounting firm
- Scope: Full year treasury inflows, outflows, reserve management
- Report published on IPFS and presented to governance
- Cost: Funded from treasury operational budget

---

## 5  Committee Audit

### 5.1  Quarterly Committee Review

Each governance committee is audited by a rotating peer committee:

| Committee Under Audit | Auditing Committee |
|-----------------------|-------------------|
| Governance Committee | Treasury Committee |
| Treasury Committee | Grant Review Committee |
| Grant Review Committee | Technical Advisory Board |
| Technical Advisory Board | Governance Committee |
| Infrastructure Committee | Grant Review Committee |

### 5.2  Audit Criteria

| Criterion | Weight | Measurement |
|-----------|-------:|-------------|
| Meeting attendance | 15 % | % of scheduled meetings attended by members |
| Decision timeliness | 20 % | Average days from request to decision |
| Transparency | 20 % | % of meetings with published minutes |
| Budget compliance | 20 % | Committee spend vs. allocation |
| Outcome delivery | 25 % | % of quarterly goals achieved |

### 5.3  Scoring

| Score | Rating | Action |
|------:|--------|--------|
| 90-100 | Excellent | No action needed |
| 75-89 | Good | Minor recommendations |
| 60-74 | Needs Improvement | Improvement plan required within 30 days |
| < 60 | Unsatisfactory | Governance vote on committee restructuring |

---

## 6  Smart Contract Audit

### 6.1  Audit Triggers

| Trigger | Requirement |
|---------|-------------|
| New contract deployment | Full external audit required |
| Major upgrade (state migration) | Full external audit required |
| Minor update (bug fix) | Internal review + targeted external review |
| Quarterly review | State integrity check (automated) |

### 6.2  Audit Scope

For each contract audit:

1. **Code Review**
   - Logic correctness against specification
   - Access control validation
   - Integer overflow / underflow checks
   - Reentrancy protection
   - Gas optimization review

2. **State Review**
   - State consistency verification
   - Storage layout analysis
   - Migration path correctness

3. **Integration Review**
   - Cross-contract call safety
   - Message handling correctness
   - Query response validation

4. **Economic Review**
   - Token economics implementation matches whitepaper
   - Emission schedule accuracy
   - Slashing parameter correctness

### 6.3  Approved Audit Firms

Maintained via governance vote. Initial approved list:

| Firm | Specialization | Last Engagement |
|------|---------------|-----------------|
| (TBD via governance) | CosmWasm / Rust | — |
| (TBD via governance) | Token economics | — |
| (TBD via governance) | ZK proofs | — |

---

## 7  Parameter Audit

### 7.1  Quarterly Parameter Review

All on-chain parameters are reviewed quarterly:

| Parameter Category | Examples | Reviewer |
|-------------------|----------|----------|
| Governance | Quorum, threshold, timelock | Governance Committee |
| Treasury | Budget allocations, spending tiers | Treasury Committee |
| Staking | Emission rate, slash penalties, unbonding | Technical Advisory Board |
| Grants | Max grant size, review period, cycle duration | Grant Review Committee |
| Identity | Credential expiry, recovery timelock | Identity Committee |

### 7.2  Review Checklist

For each parameter:

- [ ] Current value matches last governance-approved value
- [ ] Parameter has been effective (metrics support current setting)
- [ ] No community complaints or proposals to change
- [ ] Value is within safe operating range (per technical spec)
- [ ] Change recommendation with supporting data (if needed)

### 7.3  Automated Parameter Verification

```python
# Parameter verification script (runs quarterly)
EXPECTED_PARAMS = {
    "governance.quorum": "0.25",
    "governance.threshold": "0.667",
    "governance.timelock_blocks": "14400",
    "treasury.operational_reserve_months": "6",
    "staking.slash_double_sign": "0.05",
    "staking.slash_downtime": "0.005",
    "staking.unbonding_days": "21",
    "grants.max_grant_size": "500000000000",  # 500K CITIZEN in ucitizen
    "identity.credential_expiry_blocks": "2628000",  # ~1 year
    "identity.recovery_timelock_blocks": "10080",     # ~1 week
}

# Query each parameter from chain state and compare
# Flag discrepancies in audit report
```

---

## 8  Grant Program Audit

### 8.1  Quarterly Grant Review

| Check | Description |
|-------|-------------|
| Active grant status | All active grants have current milestone reports |
| Overdue milestones | Flag grants with milestones > 30 days overdue |
| Budget vs. actual | Compare disbursements to approved budgets |
| Outcome review | Assess quality of delivered milestones |
| Abandonment check | Identify grants with no activity > 90 days |

### 8.2  Grant Health Dashboard Metrics

```sql
-- Grant program health summary
SELECT
    COUNT(*) FILTER (WHERE status = 'Active') as active_grants,
    COUNT(*) FILTER (WHERE status = 'Completed') as completed_grants,
    COUNT(*) FILTER (WHERE status = 'Cancelled') as cancelled_grants,
    SUM(total_budget) as total_committed,
    SUM(total_disbursed) as total_disbursed,
    AVG(completion_days) as avg_completion_days,
    COUNT(*) FILTER (WHERE has_overdue_milestone) as grants_with_overdue
FROM grants_summary
WHERE created_at > NOW() - INTERVAL '1 quarter';
```

---

## 9  Annual Full System Audit

### 9.1  Scope

Comprehensive annual review covering:

1. **Governance effectiveness** — Proposal throughput, participation rates, outcomes
2. **Treasury health** — Reserve adequacy, spending efficiency, ROI on grants
3. **Network decentralization** — Validator distribution, stake concentration, geographic spread
4. **Identity system** — Credential issuance rates, verification success, privacy compliance
5. **Smart contract security** — Vulnerability summary, upgrade history, state integrity
6. **Community engagement** — Active citizens, delegation patterns, forum activity

### 9.2  Annual Report Structure

| Section | Content |
|---------|---------|
| Executive Summary | Key achievements, challenges, recommendations |
| Governance Review | Proposal statistics, committee performance scores |
| Financial Review | Treasury P&L, grant program ROI, budget variance |
| Technical Review | Uptime, security incidents, upgrade history |
| Decentralization Metrics | Gini coefficient, Nakamoto coefficient, geographic distribution |
| Identity & Privacy | Credential stats, privacy audit results, compliance status |
| Community Health | Active users, retention, satisfaction survey results |
| Recommendations | Prioritized list of improvements for next year |

### 9.3  Publication

- Full report published on IPFS
- Summary presented at annual governance meeting
- Community comment period: 30 days
- Governance vote to accept report and adopt recommendations

---

## 10  Audit Infrastructure

### 10.1  Audit Bot

Automated audit checks run continuously:

```toml
# audit-bot-config.toml

[schedule]
proposal_audit_delay_blocks = 14400    # ~24h after execution
treasury_check_interval = "daily"
parameter_check_interval = "weekly"
grant_milestone_check = "daily"

[alerts]
discord_webhook = "${DISCORD_AUDIT_WEBHOOK}"
governance_alert_contract = "citizen1..."

[thresholds]
treasury_variance_pct = 10
proposal_execution_delay_hours = 168   # 7 days
grant_milestone_overdue_days = 30
```

### 10.2  Public Audit Dashboard

Available at `/transparency` and `/infrastructure` pages in the frontend:

- Real-time audit status for all active proposals
- Treasury balance with historical chart
- Committee score cards
- Grant program health metrics
- Parameter change history

---

## 11  Escalation & Remediation

### 11.1  Escalation Path

```
Audit finding
    ↓
Severity assessment (Low / Medium / High / Critical)
    ↓
Low/Medium: Committee resolution within 30 days
    ↓
High: Emergency committee meeting within 48 hours
    ↓
Critical: Emergency governance proposal (expedited 24h vote)
    ↓
Resolution documented + preventive measures implemented
    ↓
Follow-up audit within 30 days
```

### 11.2  Remediation Tracking

| Severity | Response Time | Resolution Time | Follow-up |
|----------|-------------:|----------------:|-----------|
| Low | 14 days | 60 days | Next quarterly audit |
| Medium | 7 days | 30 days | 30-day check |
| High | 48 hours | 14 days | 14-day check |
| Critical | 4 hours | 72 hours | 7-day check |

---

## 12  Governance Proposal Template

```json
{
  "title": "Governance Audit: [AUDIT_TYPE] — [PERIOD]",
  "description": "Publishing audit results for [scope] covering [period]...",
  "category": "governance_audit",
  "audit_report_cid": "Qm...",
  "findings_count": {
    "critical": 0,
    "high": 0,
    "medium": 2,
    "low": 5
  },
  "remediation_proposals": [
    {
      "finding_id": "F-2025-Q1-003",
      "description": "Treasury category variance exceeded 10%",
      "proposed_action": "Reallocate 50,000 CITIZEN from research to infrastructure",
      "timeline": "30 days"
    }
  ],
  "next_audit_date": "2025-07-01"
}
```
