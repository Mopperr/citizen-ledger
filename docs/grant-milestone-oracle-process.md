# Citizen Ledger — Grant Milestone Oracle & Verification Process

Defines the end-to-end process for verifying grant milestone completions,
the oracle committee structure, and dispute resolution.

---

## 1. Overview

Grant milestones require evidence submission and independent verification
before funds are released from the treasury. The verification process
uses a three-tier authority model:

```
┌──────────────┐    ┌─────────────────┐    ┌───────────────────┐
│  Grantee     │───▶│  Oracle/Reviewer │───▶│  Funds Released   │
│  Submits     │    │  Committee       │    │  from Treasury    │
│  Evidence    │    │  Approves        │    │                   │
└──────────────┘    └─────────────────┘    └───────────────────┘
                           │
                    ┌──────┴──────┐
                    │  Dispute?   │
                    │  → Governance│
                    │    Vote     │
                    └─────────────┘
```

---

## 2. Approval Authority Tiers

| Tier | Authority              | When Used                          | On-Chain Action       |
|------|------------------------|------------------------------------|------------------------|
| 1    | Oracle/Reviewer        | Standard milestones < 50K CITIZEN  | `ApproveMilestone`     |
| 2    | Admin (multi-sig)      | Milestones 50K–500K CITIZEN        | `ApproveMilestone`     |
| 3    | Governance proposal    | Milestones > 500K CITIZEN or disputed | Via voting contract |

---

## 3. Oracle Committee Structure

### 3.1 Composition
- **Minimum 5 members**, maximum 15
- Members added via `AddReviewer` (admin or governance)
- Members removed via `RemoveReviewer`
- All reviewer actions recorded on-chain (`approved_by` field)

### 3.2 Qualifications
- Must hold valid Citizenship credential
- Domain expertise relevant to at least one research category
- No active grant applications (conflict of interest)
- Minimum 6 months as a credentialed citizen

### 3.3 Terms
- Reviewers serve 6-month renewable terms
- Reappointment requires governance proposal
- Reviewers can resign at any time
- Inactive reviewers (0 reviews in 3 months) automatically flagged for removal

---

## 4. Milestone Verification Process

### 4.1 Step-by-Step Flow

```
1. SUBMIT    — Grantee calls SubmitMilestone{grant_id, milestone_id, evidence}
2. NOTIFY    — Event emitted → indexer picks up → reviewers notified
3. REVIEW    — Assigned reviewer(s) examine evidence within 14 days
4. DECISION  — Reviewer calls ApproveMilestone OR flags for dispute
5. RELEASE   — On approval, treasury `spend` sub-message releases funds
6. RECORD    — approved_by field records which reviewer approved
```

### 4.2 Evidence Requirements

| Evidence Type    | Format                  | Example                          |
|------------------|-------------------------|----------------------------------|
| Research paper   | IPFS hash (PDF)         | `ipfs://QmAbc123...`            |
| Code delivery    | Git commit hash + repo  | `github.com/org/repo@abc123`    |
| Infrastructure   | Photos + GPS + receipts | IPFS folder hash                 |
| Community event  | Attendance records + media | IPFS + on-chain attestation    |
| Financial report | Signed PDF on IPFS      | `ipfs://QmReport...`            |

### 4.3 Review Criteria Rubric

| Criterion          | Weight | Description                                        |
|--------------------|--------|----------------------------------------------------|
| Deliverable match  | 40%    | Does the evidence fulfill the milestone description? |
| Quality            | 25%    | Is the work of acceptable quality?                  |
| Timeliness         | 15%    | Was it delivered on or before the expected date?     |
| Budget compliance  | 10%    | Were funds used appropriately?                       |
| Documentation      | 10%    | Is the deliverable well-documented?                  |

**Minimum score: 60/100 to approve.**

---

## 5. Automated Verification (Future)

For milestones with quantifiable deliverables, automated oracles can be used:

### 5.1 Code Delivery Oracle
```json
{
  "oracle_type": "code_delivery",
  "repository": "github.com/citizen-ledger/project",
  "required_commits": 10,
  "required_tests_passing": true,
  "required_coverage_pct": 80
}
```

### 5.2 Infrastructure Oracle
```json
{
  "oracle_type": "infrastructure",
  "uptime_check_url": "https://service.example.com/health",
  "required_uptime_pct": 99.5,
  "monitoring_period_days": 30
}
```

### 5.3 Community Oracle (Social Vouching)
```json
{
  "oracle_type": "community_vouching",
  "required_vouches": 5,
  "voucher_credential": "Citizenship",
  "vouching_period_days": 7
}
```

---

## 6. Dispute Resolution

### 6.1 Dispute Triggers
- Reviewer rejects milestone evidence
- Grantee contests a rejection
- Community member flags evidence as fraudulent
- Conflict of interest discovered

### 6.2 Dispute Process

```
1. DISPUTE FILED   — Any credentialed citizen can file (requires 1000 CITIZEN deposit)
2. ESCALATION      — Milestone frozen; escalated to governance proposal
3. EVIDENCE PERIOD — 7-day window for both parties to submit additional evidence
4. GOVERNANCE VOTE — Community votes on approval/rejection
5. RESOLUTION      — If approved: funds released, dispute deposit returned
                     If rejected: funds stay in treasury, deposit forfeited
```

### 6.3 Fraud Prevention
- All evidence submission events are permanently indexed
- `approved_by` creates accountability trail
- Reviewer rotation: no single reviewer can approve >3 consecutive milestones for same grant
- Random secondary review: 10% of approvals are randomly selected for secondary review by a different committee member

---

## 7. Reporting & Transparency

### Dashboard Metrics
- Average review time per milestone (target: <14 days)
- Approval rate by reviewer (flag anomalies > 95% or < 50%)
- Disputes filed vs resolved
- Total funds released per cycle
- Reviewer activity scorecards

### Monthly Oracle Committee Report
```markdown
# Oracle Committee Report — [Month YYYY]

## Activity Summary
- Milestones reviewed: X
- Approved: Y (Z%)
- Rejected: W
- Disputes: N

## Per-Reviewer Activity
| Reviewer | Reviews | Avg Days | Approval Rate |
|----------|---------|----------|---------------|
| ...      | ...     | ...      | ...           |

## Recommendations
- [Any process improvements]
```

---

*Citizen Ledger — Grant Milestone Oracle Process v1.0*
