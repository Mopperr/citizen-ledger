# Citizen Ledger — Infrastructure Governance & Budgeting

Governance procedures for infrastructure pilot budgeting, vendor management,
and ongoing operational oversight.

---

## 1. Budget Lifecycle

### 1.1 Budget Proposal Flow

```
┌──────────────┐    ┌────────────────┐    ┌──────────────┐    ┌──────────────┐
│  Committee   │───▶│  Draft Budget  │───▶│  Governance  │───▶│  Treasury    │
│  Prepares    │    │  Proposal      │    │  Vote        │    │  Allocation  │
│  Estimate    │    │  (TreasurySpend│    │              │    │              │
│              │    │   template)    │    │              │    │              │
└──────────────┘    └────────────────┘    └──────────────┘    └──────────────┘
```

### 1.2 Budget Categories

| Category                | Allocation | Governance Level        |
|-------------------------|-----------|-------------------------|
| Land / Lease            | 25%       | Full governance vote     |
| Construction            | 35%       | Full governance vote     |
| Equipment / IT          | 15%       | Committee (< 10K each)   |
| Staffing                | 10%       | Committee quarterly      |
| Utilities / Maintenance | 10%       | Committee monthly        |
| Contingency             | 5%        | Committee (with report)  |

### 1.3 Spending Controls

**Under 1,000 CITIZEN:** Committee member can authorize unilaterally (with receipt)
**1,000 – 10,000 CITIZEN:** Requires 2-of-5 committee approval
**10,000 – 50,000 CITIZEN:** Requires 3-of-5 committee + public 48-hour notice
**Over 50,000 CITIZEN:** Full governance proposal required

All spending executes through the treasury contract with category = `Infrastructure`.

---

## 2. Vendor Management

### 2.1 Vendor Selection Process
1. Committee publishes Request for Proposal (RFP) on-chain as `TextProposal`
2. Vendors submit bids (off-chain, hashed on-chain for timestamping)
3. Committee reviews and scores bids (criteria below)
4. Committee selects vendor; if > 10K CITIZEN, governance vote required
5. Contract terms published to transparency dashboard

### 2.2 Vendor Scoring Criteria

| Criterion        | Weight | Description                       |
|------------------|--------|-----------------------------------|
| Price            | 30%    | Competitive pricing               |
| Quality          | 25%    | Past work quality and references  |
| Timeline         | 20%    | Ability to meet deadlines         |
| Local preference | 15%    | Citizen-owned or local business   |
| Sustainability   | 10%    | Environmental and social impact   |

### 2.3 Payment Terms
- Milestone-based payments aligned with grant milestones
- 10% retainage held until final completion
- Disputes escalated to governance proposal
- All invoices hashed and stored on IPFS with on-chain reference

---

## 3. Operational Budget (Post-Construction)

### Monthly Operating Budget

| Line Item              | Monthly Est.  | Annual Est.     |
|------------------------|--------------|-----------------|
| Staff (2 coordinators) | 3,000 CITIZEN| 36,000 CITIZEN  |
| Utilities              | 1,500 CITIZEN| 18,000 CITIZEN  |
| Internet (dual ISP)    | 500 CITIZEN  | 6,000 CITIZEN   |
| Maintenance / repairs  | 1,000 CITIZEN| 12,000 CITIZEN  |
| Insurance              | 500 CITIZEN  | 6,000 CITIZEN   |
| Supplies / consumables | 500 CITIZEN  | 6,000 CITIZEN   |
| **Total**              | **7,000**    | **84,000 CITIZEN**|

### Funding Source
- Treasury Infrastructure allocation covers ~80%
- Community center event fees cover ~10%
- Digital warehouse node rewards cover ~10%

### Quarterly Review
- Committee publishes financial report as milestone evidence
- Governance reviews spending efficiency
- Budget adjustments via `ParameterChange` proposal if needed

---

## 4. Reporting Requirements

### Monthly Report (Committee → Transparency Dashboard)
```markdown
# Infrastructure Monthly Report — [Month YYYY]

## Financial Summary
| Category | Budget | Actual | Variance |
|----------|--------|--------|----------|

## Construction / Operations Progress
- [Activity summary]
- [Photos / evidence links]

## Issues & Risks
- [Any blockers or concerns]

## Next Month Plan
- [Planned activities and expenditures]
```

### Quarterly Governance Report
- Financial audit by independent committee member
- Community satisfaction survey results
- Facility utilization statistics
- Recommendation for budget adjustments

---

## 5. Governance Proposal Templates for Infrastructure

### Budget Allocation
```json
{
  "template": "TreasurySpend",
  "title": "Infrastructure Pilot — Q1 Operating Budget",
  "params": {
    "recipient": "citizen1infracommittee...",
    "amount": "21000000000",
    "category": "Infrastructure",
    "memo": "Q1 operating budget for community center + digital warehouse"
  }
}
```

### Vendor Approval
```json
{
  "template": "TextProposal",
  "title": "Approve Vendor: ABC Construction for Community Center",
  "params": {
    "description": "Approve ABC Construction Co. for Phase 2 construction. Bid: 180,000 CITIZEN. Timeline: 6 months. Scored 85/100 by committee.",
    "evidence": "ipfs://QmVendorBid..."
  }
}
```

### Committee Election
```json
{
  "template": "TextProposal",
  "title": "Elect Infrastructure Pilot Committee",
  "params": {
    "description": "Elect the following 5 members to the Infrastructure Pilot Governance Committee for a 14-month term: [list]",
    "candidates": ["citizen1...", "citizen1...", "citizen1...", "citizen1...", "citizen1..."]
  }
}
```

---

*Citizen Ledger — Infrastructure Governance & Budgeting v1.0*
