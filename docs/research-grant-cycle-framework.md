# Citizen Ledger — Research Grant Cycle Framework

Defines the structure, process, and governance for recurring research
grant cycles funded by the community treasury.

---

## 1. Cycle Overview

A **Research Grant Cycle** is a time-bound period during which the community
accepts, reviews, and funds research proposals within registered categories.

```
┌───────────┐  ┌──────────────┐  ┌───────────────┐  ┌─────────────┐  ┌──────────┐
│  Announce  │─▶│  Application │─▶│  Committee    │─▶│  Governance │─▶│  Fund &  │
│  Cycle     │  │  Period      │  │  Review       │  │  Vote       │  │  Execute │
│  (1 week)  │  │  (4 weeks)   │  │  (2 weeks)    │  │  (1 week)   │  │          │
└───────────┘  └──────────────┘  └───────────────┘  └─────────────┘  └──────────┘
```

**Frequency:** Quarterly (every 3 months)
**On-chain representation:** `ResearchCycle` struct in grants contract

---

## 2. Research Categories

Categories are registered on-chain via `RegisterResearchCategory`:

| Category                    | Max Grant Size    | Pool Budget (per cycle) |
|-----------------------------|-------------------|-------------------------|
| Public Health Research      | 50,000 CITIZEN    | 200,000 CITIZEN         |
| Environmental Science       | 40,000 CITIZEN    | 150,000 CITIZEN         |
| Education & Pedagogy        | 30,000 CITIZEN    | 100,000 CITIZEN         |
| Civic Technology            | 60,000 CITIZEN    | 250,000 CITIZEN         |
| Social Sciences             | 35,000 CITIZEN    | 120,000 CITIZEN         |
| Open Data & Transparency    | 25,000 CITIZEN    | 80,000 CITIZEN          |
| Infrastructure Engineering  | 80,000 CITIZEN    | 300,000 CITIZEN         |

**Adding new categories** requires a governance proposal of type `ParameterChange`.

---

## 3. Cycle Phases

### Phase 1: Announcement (Week 1)
- Governance proposal to open cycle: `OpenResearchCycle`
- Specifies: title, eligible categories, total budget, duration
- Published on transparency dashboard + community channels
- Information sessions held for potential applicants

### Phase 2: Application (Weeks 2–5)
- Applicants submit via grants contract: `Apply{title, description, category, milestones}`
- Each application must include:
  - **Abstract** (200 words max)
  - **Research question** or objective
  - **Methodology**
  - **Timeline** mapped to milestones
  - **Budget breakdown** per milestone
  - **Team credentials** (linked to on-chain credential IDs)
  - **Expected impact** on the Citizen Ledger community
- Maximum 3 milestones per grant
- Each milestone must be independently verifiable

### Phase 3: Committee Review (Weeks 6–7)
- Oracle/Reviewer Committee scores each application (see Oracle Process doc)
- Scoring rubric:

| Criterion         | Weight | Description                          |
|-------------------|--------|--------------------------------------|
| Relevance         | 25%    | Alignment with community needs       |
| Feasibility       | 25%    | Realistic timeline and methodology   |
| Impact            | 20%    | Expected benefit to citizens         |
| Team Capability   | 15%    | Track record and credentials         |
| Budget Efficiency | 15%    | Value for money                      |

- Minimum score: 65/100 to advance to governance vote
- Committee publishes ranked list with scores and comments

### Phase 4: Governance Vote (Week 8)
- Top-scored applications (up to budget cap) put to governance batch vote
- Each grant as individual proposal using `GrantFunding` template
- Voting period: 7 days (standard)
- Citizens vote Yes/No/Abstain per grant
- Grants reaching threshold → `Approve{grant_id, proposal_id}`

### Phase 5: Funding & Execution
- Approved grants → status `Active`
- Grantees execute per milestones
- Milestone verification per Oracle Process
- Quarterly progress updates published to transparency dashboard

---

## 4. Cycle Budget Management

### Budget Allocation
```
Total Cycle Budget = Σ(category pool budgets)
                   = 1,200,000 CITIZEN (example)
                   
Funded from: Treasury Research allocation (25% of treasury)
Unspent budget: Rolls over to next cycle (max 1.5x original budget)
```

### Budget Controls
- No single grant may exceed its category's `max_grant_size`
- Total approved grants per cycle ≤ total cycle budget
- Treasury balance checked before each disbursement
- Unfunded grants (overflow) can re-apply in next cycle

---

## 5. Cycle Calendar (Year 1)

| Cycle | Announce     | Applications  | Review       | Vote         | Status   |
|-------|-------------|---------------|-------------|-------------|----------|
| Q1    | Month 1 W1  | Month 1 W2–5  | Month 2 W2  | Month 2 W3  | Planning |
| Q2    | Month 4 W1  | Month 4 W2–5  | Month 5 W2  | Month 5 W3  | Planning |
| Q3    | Month 7 W1  | Month 7 W2–5  | Month 8 W2  | Month 8 W3  | Planning |
| Q4    | Month 10 W1 | Month 10 W2–5 | Month 11 W2 | Month 11 W3 | Planning |

---

## 6. Success Metrics

| Metric                          | Target (Year 1) |
|---------------------------------|------------------|
| Applications per cycle          | ≥ 10             |
| Grants funded per cycle         | ≥ 5              |
| Milestone completion rate       | ≥ 80%            |
| Average review turnaround       | ≤ 14 days        |
| Budget utilization per cycle    | ≥ 70%            |
| Citizen satisfaction (survey)   | ≥ 4.0/5.0        |
| Published research outputs      | ≥ 3 per cycle    |
| Disputes filed                  | ≤ 5%             |

---

## 7. Post-Cycle Reporting

After each cycle closes (`CloseResearchCycle`):

```markdown
# Research Grant Cycle Report — [Cycle ID]

## Summary
- Period: [start_height] to [end_height]
- Total Budget: X CITIZEN
- Applications Received: Y
- Grants Funded: Z
- Total Allocated: W CITIZEN
- Utilization: X%

## Funded Grants
| Grant ID | Title | Category | Amount | Status |
|----------|-------|----------|--------|--------|

## Category Breakdown
| Category | Applications | Funded | Amount |
|----------|-------------|--------|--------|

## Lessons Learned
- [Process improvements for next cycle]

## Next Cycle Recommendations
- [Budget adjustments, new categories, process changes]
```

---

## 8. Governance Integration

### Proposal Templates for Research Cycles

**Opening a cycle:**
```json
{
  "template": "GrantFunding",
  "action": "OpenResearchCycle",
  "params": {
    "title": "Q1 2027 Research Grant Cycle",
    "categories": ["PublicHealth", "CivicTechnology", "EnvironmentalScience"],
    "total_budget": "1200000000000",
    "duration_blocks": 432000
  }
}
```

**Closing a cycle:**
```json
{
  "template": "GrantFunding",
  "action": "CloseResearchCycle",
  "params": {
    "cycle_id": 1
  }
}
```

---

*Citizen Ledger — Research Grant Cycle Framework v1.0*
