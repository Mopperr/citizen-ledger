# Citizen Ledger — Infrastructure Pilot Scope

Defines the scope, governance, and budgeting for the initial
infrastructure pilot: a regional community center and digital warehouse.

---

## 1. Pilot Objective

Demonstrate that decentralized governance can fund, build, and operate
physical infrastructure for public benefit. The pilot combines:

1. **Regional Community Center** — A physical space for citizen assembly,
   education, and local governance participation.
2. **Digital Warehouse** — Server infrastructure for chain nodes, archival
   storage, and community applications hosting.

---

## 2. Pilot Location Selection

### Selection Criteria
| Criterion              | Weight | Description                           |
|------------------------|--------|---------------------------------------|
| Citizen density        | 25%    | Number of credentialed citizens       |
| Infrastructure gap     | 25%    | Lack of existing public facilities    |
| Local governance       | 20%    | Active governance participation       |
| Cost efficiency        | 15%    | Cost of land/building/connectivity    |
| Accessibility          | 15%    | Public transport, ADA compliance      |

### Selection Process
1. Governance proposal: `TextProposal` with candidate locations
2. Community vote (1P1V)
3. Top-voted location receives feasibility study grant

---

## 3. Community Center Specification

### 3.1 Physical Requirements
| Component              | Specification                    | Budget Est.  |
|------------------------|----------------------------------|-------------|
| Main assembly hall     | 200-person capacity, AV equipped | 40% budget  |
| Meeting rooms (3)      | 10-20 person each                | 15% budget  |
| Computer lab           | 20 workstations + fiber internet | 15% budget  |
| Kitchen / common area  | Community meals support          | 10% budget  |
| Outdoor gathering space| Covered, seating for 50          | 5% budget   |
| Accessibility          | Full ADA / universal design      | 5% budget   |
| Security & maintenance | Cameras, janitorial, utilities   | 10% budget  |

### 3.2 Operational Model
- **Managed by:** Local citizen governance committee (elected on-chain)
- **Hours:** 7 days/week, 8am–10pm
- **Staffing:** 2 full-time coordinators + volunteer committee
- **Revenue:** Minimal rental fees for private events; subsidized by treasury
- **Reporting:** Monthly on-chain status updates via grant milestones

### 3.3 Milestones

| # | Milestone                     | Budget Share | Timeline    |
|---|-------------------------------|-------------|-------------|
| 1 | Site acquisition + permits    | 25%         | Months 1-3  |
| 2 | Construction / renovation     | 45%         | Months 4-9  |
| 3 | Equipment, furnishing, IT     | 20%         | Months 8-10 |
| 4 | Grand opening + first events  | 5%          | Month 11    |
| 5 | 3-month operational report    | 5%          | Month 14    |

---

## 4. Digital Warehouse Specification

### 4.1 Hardware Requirements
| Component              | Specification                     | Qty  |
|------------------------|-----------------------------------|------|
| Validator servers      | 16-core, 64GB RAM, 2TB NVMe      | 3    |
| Archive node           | 32-core, 128GB RAM, 8TB NVMe     | 1    |
| Backup NAS             | 4-bay, 32TB, RAID-5              | 1    |
| Network switch         | 10GbE managed                     | 1    |
| UPS                    | 3kVA, 30-min runtime             | 2    |
| Firewall appliance     | Enterprise-grade                  | 1    |

### 4.2 Network Requirements
- Dual ISP connections (1 Gbps each) with automatic failover
- Static public IP allocation (minimum /28 block)
- DDoS mitigation service
- VPN connectivity for remote admin

### 4.3 Services Hosted
| Service                | Purpose                          | Criticality |
|------------------------|----------------------------------|-------------|
| Full validator node    | Citizen Ledger network           | Critical    |
| Archive node           | Historical state queries         | High        |
| Public RPC endpoint    | Frontend + developer access      | High        |
| Block explorer         | Transaction transparency         | Medium      |
| Indexer + PostgreSQL   | Dashboard data pipeline          | High        |
| IPFS node              | Grant evidence storage           | Medium      |
| Backup service         | Nightly state snapshots          | High        |
| Monitoring (Grafana)   | Infrastructure observability     | High        |

### 4.4 Milestones

| # | Milestone                          | Budget Share | Timeline    |
|---|------------------------------------|-------------|-------------|
| 1 | Space + connectivity procurement   | 30%         | Months 1-2  |
| 2 | Hardware procurement + rack setup  | 40%         | Months 2-4  |
| 3 | Software deploy + validator online | 20%         | Months 4-5  |
| 4 | 90-day uptime report (≥99.5%)     | 10%         | Month 8     |

---

## 5. Budget Estimate

### Total Pilot Budget

| Component               | Low Estimate   | High Estimate  |
|-------------------------|----------------|----------------|
| Community Center        | 200,000 CITIZEN| 400,000 CITIZEN|
| Digital Warehouse       | 100,000 CITIZEN| 200,000 CITIZEN|
| Operational (Year 1)    | 60,000 CITIZEN | 120,000 CITIZEN|
| Contingency (15%)       | 54,000 CITIZEN | 108,000 CITIZEN|
| **Total**               | **414,000**    | **828,000**    |

### Funding Source
- Treasury Infrastructure allocation (20% = ~200,000 CITIZEN/quarter)
- Supplemented by dedicated governance proposal for pilot

### Budget Governance
- All expenditures are grant milestones → treasury spend with audit trail
- Monthly financial reports published to transparency dashboard
- Quarterly governance review of spending vs. plan
- Overruns > 10% require new governance approval

---

## 6. Governance Structure

### 6.1 Pilot Governance Committee
- **5 members** elected via governance proposal
- At least 2 members local to pilot region
- 1 technical member (for digital warehouse)
- 1 financial oversight member
- Term: Duration of pilot (14 months)

### 6.2 Decision Authority

| Decision Type              | Authority                      |
|----------------------------|-------------------------------|
| Vendor selection < 10K     | Committee (2-of-5 approval)   |
| Vendor selection > 10K     | Governance proposal            |
| Design changes             | Committee + public comment     |
| Budget reallocation < 5%   | Committee                      |
| Budget reallocation > 5%   | Governance proposal            |
| Operational policies       | Committee + monthly report     |
| Milestone approval         | Oracle/Reviewer Committee      |

---

## 7. Success Metrics

### Community Center
| Metric                   | Target (Year 1)  |
|--------------------------|------------------|
| Monthly visitors         | ≥ 500            |
| Events hosted / month    | ≥ 8              |
| Governance sessions held | ≥ 2 / month      |
| Citizen satisfaction     | ≥ 4.0/5.0        |
| Operational cost / month | < 10,000 CITIZEN |

### Digital Warehouse
| Metric                   | Target (Year 1)  |
|--------------------------|------------------|
| Validator uptime         | ≥ 99.5%          |
| RPC availability         | ≥ 99.9%          |
| Archive sync lag         | < 100 blocks     |
| Security incidents       | 0 critical       |
| Power incidents          | 0 data loss      |

---

## 8. Risk Matrix

| Risk                              | Likelihood | Impact | Mitigation                     |
|-----------------------------------|-----------|--------|-------------------------------|
| Construction delays               | Medium    | Medium | 15% contingency in budget     |
| Vendor disputes                   | Low       | Medium | Multi-vendor quotes + escrow  |
| Connectivity outage               | Low       | High   | Dual ISP + failover           |
| Low community adoption            | Medium    | High   | Pre-launch engagement campaign|
| Natural disaster                  | Low       | High   | Insurance + off-site backups  |
| Regulatory obstacles              | Low       | High   | Legal review before site selection |

---

## 9. Expansion Criteria

The pilot is deemed successful and eligible for expansion when:
- All milestones completed within budget (+/- 15%)
- 6 months of operational data meets success metrics
- Community governance vote approves expansion
- ≥3 additional locations nominated by citizens

**Expansion roadmap** → Second facility planned in v2 roadmap

---

*Citizen Ledger — Infrastructure Pilot Scope v1.0*
