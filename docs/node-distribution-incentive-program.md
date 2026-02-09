# Node Distribution Incentive Program

> Citizen Ledger — Decentralizing infrastructure through aligned incentives.

---

## 1  Program Goals

| Goal | Target (Year 1) |
|------|-----------------|
| Active validator nodes | 100+ |
| Independent full nodes | 500+ |
| Geographic regions covered | 30+ countries |
| Community-operated warehouses | 3+ pilot sites |
| Maximum single-operator share of stake | ≤ 5 % |

---

## 2  Node Tiers

### Tier 1 — Genesis Validators (max 21 seats)

| Property | Value |
|----------|-------|
| Minimum self-stake | 5 000 000 CITIZEN |
| Uptime SLA | 99.5 % |
| Slashing exposure | Double-sign 5 %, downtime 0.5 % |
| Base emission share | Pro-rata from 80 % validator pool |
| Bonus | +10 % if hosting from approved under-served region |

### Tier 2 — Community Validators (21–100 seats)

| Property | Value |
|----------|-------|
| Minimum self-stake | 500 000 CITIZEN |
| Uptime SLA | 99.0 % |
| Slashing exposure | Same as Tier 1 |
| Emission share | Pro-rata after Tier 1 allocation |
| Bonus | +5 % under-served region bonus |

### Tier 3 — Full Nodes (Archive + RPC)

| Property | Value |
|----------|-------|
| Minimum self-stake | None (no staking reward) |
| Expected incentive | Monthly RPC provider grant from treasury |
| Uptime SLA | 95.0 % |
| Grant size | 5 000 – 20 000 CITIZEN/month based on traffic |
| Eligibility | Must expose public RPC + API endpoints |

### Tier 4 — Community Warehouse Nodes

| Property | Value |
|----------|-------|
| Minimum self-stake | Per warehouse governance committee allocation |
| Uptime SLA | 99.0 % |
| Special incentive | Infrastructure pilot budget (see infrastructure-pilot-scope.md) |
| Co-location benefit | Shared power, cooling, connectivity costs |

---

## 3  Geographic Distribution Targets

### Phase 1 (0-6 months post-mainnet)

| Region | Min Validator Nodes | Min Full Nodes |
|--------|--------------------:|---------------:|
| North America | 3 | 20 |
| Europe | 3 | 20 |
| Asia-Pacific | 3 | 15 |
| Latin America | 2 | 10 |
| Africa | 1 | 5 |

### Phase 2 (6-18 months)

- Additional regions: Middle East, Central Asia, Oceania
- Target: no single country exceeds 25 % of total stake
- Governance proposal to update targets quarterly

### Region Classification

Regions are classified as **under-served** or **served** based on:
1. Number of active validators in the region (< 3 = under-served)
2. Total stake percentage (< 5 % of network = under-served)
3. Internet infrastructure index (ITU ICT Development Index)
4. Updated by governance vote quarterly

---

## 4  Incentive Structure

### 4.1  Emission Bonuses

| Condition | Bonus |
|-----------|------:|
| Operating from under-served region | +10 % |
| Running archive node + public RPC | +5 % |
| Hosting from community warehouse | +8 % |
| Contributing to open-source tooling | +3 % (per approved PR, capped at +12 %) |
| First-year early operator bonus | +5 % (decays to 0 over 12 months) |

Bonuses stack but are capped at +25 % total.

### 4.2  Hardware Subsidy Program

For operators in under-served regions who cannot self-fund hardware:

| Tier | Grant Limit | Requirements |
|------|------------:|-------------|
| Basic Node | 5 000 CITIZEN | Run full node ≥ 6 months, 95 % uptime |
| Validator Ready | 15 000 CITIZEN | Run validator ≥ 12 months, 99 % uptime |
| Warehouse Kit | 50 000 CITIZEN | Part of approved warehouse pilot, match 25 % from local community |

**Process:**
1. Apply via governance grant proposal (use infrastructure grant template)
2. Committee reviews hardware specs + cost justification
3. 50 % disbursed on approval, 50 % after 3-month uptime verification
4. Hardware ownership transfers fully to operator after 12 months
5. If uptime < 90 % for 3 consecutive months, operator must repay 50 %

### 4.3  Delegation Incentives

To encourage CITIZEN holders to delegate to smaller / under-served validators:

- **Diversity Delegation Bonus**: +2 % APR boost for delegators who spread stake across ≥ 5 validators, each with < 3 % network share
- **New Validator Bonus**: +3 % APR for first 90 days when delegating to a validator that joined in the last 30 days
- **Geographic Bonus**: +1 % APR for delegating to under-served region validators

---

## 5  Training & Onboarding

### 5.1  Self-Service Resources

| Resource | Format |
|----------|--------|
| Node Operator Guide | Markdown doc (docs/node-operator-guide.md) |
| Video Walkthrough | 30-min step-by-step (YouTube + IPFS) |
| Hardware Sizing Calculator | Interactive web tool (planned) |
| FAQ & Troubleshooting | Community wiki |

### 5.2  Mentorship Program

- Each new operator is paired with an experienced validator for 30 days
- Mentors earn 2 000 CITIZEN per successful onboarding (mentee achieves 99 % uptime for first month)
- Max 3 active mentees per mentor

### 5.3  Regional Ambassador Program

| Role | Compensation | Responsibilities |
|------|-------------|-----------------|
| Regional Ambassador | 5 000 CITIZEN/quarter | Recruit 3+ new operators, host 1 workshop, translate docs |
| Community Lead | 10 000 CITIZEN/quarter | Manage regional ambassadors, report to governance |

---

## 6  Monitoring & Compliance

### 6.1  Automated Monitoring

All participating nodes are monitored via:
- **Prometheus + Grafana** dashboards (see metrics-parameter-tuning.md)
- **Uptime Oracle** — on-chain attestation of node liveness every 100 blocks
- **Geographic Verification** — periodic IP geolocation check (attestation, not enforced)

### 6.2  Compliance Requirements

| Requirement | Frequency | Consequence of Non-Compliance |
|-------------|-----------|-------------------------------|
| Uptime ≥ SLA | Rolling 30-day | Warning → reduced rewards → removal from active set |
| Security patches within 7 days | Per release | Warning → jailing after 14 days |
| Annual hardware attestation | Yearly | Loss of hardware subsidy eligibility |
| Financial transparency report | Quarterly | Loss of bonus incentives |

### 6.3  Slashing Parameters

| Offense | Penalty | Jail Duration |
|---------|---------|---------------|
| Double sign | 5 % stake slash | Permanent (governance vote to unjail) |
| Extended downtime (> 24h) | 0.5 % stake slash | 24 hours |
| Missed 1000+ consecutive blocks | 0.1 % stake slash | 10 hours |

---

## 7  Governance Integration

### 7.1  Parameter Changes

All incentive parameters (bonus rates, subsidy limits, geographic targets) are modifiable via governance proposal:

```
Proposal Type:  ParameterChange
Category:       Node Distribution
Quorum:         25 % of staked supply
Threshold:      66.7 %
Timelock:       48 hours
```

### 7.2  Quarterly Review

Every quarter, the Node Distribution Committee publishes:
1. **Network Health Report** — validator count, geographic distribution, decentralization metrics
2. **Incentive Effectiveness Report** — cost per new node, retention rate, geographic coverage change
3. **Budget Report** — total incentive spend vs. allocation
4. **Recommendation** — parameter adjustments for next quarter

### 7.3  Committee Structure

| Role | Count | Election |
|------|------:|----------|
| Chair | 1 | Governance vote, 6-month term |
| Validator Representatives | 3 | Elected by active validators |
| Community Representatives | 2 | Governance vote |
| Technical Advisor | 1 | Appointed by chair |

---

## 8  Budget Allocation

### Year 1 Projected Budget

| Line Item | Budget (CITIZEN) |
|-----------|----------------:|
| Emission bonuses | 5 000 000 |
| Hardware subsidies | 2 000 000 |
| Training & mentorship | 500 000 |
| Regional ambassadors | 400 000 |
| Monitoring infrastructure | 200 000 |
| Committee operations | 100 000 |
| **Total** | **8 200 000** |

Funded from: 60 % emission reserve, 40 % treasury allocation (requires governance approval).

---

## 9  Success Metrics

| Metric | 6-Month Target | 12-Month Target |
|--------|---------------:|----------------:|
| Active validators | 50 | 100 |
| Full nodes | 200 | 500 |
| Countries represented | 15 | 30 |
| Nakamoto coefficient | ≥ 7 | ≥ 15 |
| Avg validator uptime | 99.0 % | 99.5 % |
| Hardware subsidies disbursed | 50 | 150 |
| New operators trained/month | 10 | 25 |

---

## 10  Appendix: Governance Proposal Template

```json
{
  "title": "Node Distribution: [CHANGE_DESCRIPTION]",
  "description": "Proposal to modify node distribution incentive parameters...",
  "category": "infrastructure",
  "changes": [
    {
      "parameter": "under_served_region_bonus",
      "current_value": "10%",
      "proposed_value": "12%",
      "justification": "Under-served regions still below target coverage..."
    }
  ],
  "budget_impact": "Estimated +200,000 CITIZEN/year",
  "effective_date": "Next epoch after timelock expiry"
}
```
