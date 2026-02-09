# Citizen Ledger — Metrics Collection & Parameter Tuning Guide

A framework for collecting testnet metrics and iteratively refining
treasury split parameters, emission rates, governance thresholds, and staking rules.

---

## 1. Metrics Collection Infrastructure

### 1.1 On-Chain Metrics (Prometheus-scraped)

| Metric                                    | Source              | Target        |
|-------------------------------------------|---------------------|---------------|
| `tendermint_consensus_height`             | CometBFT :26660     | Block production |
| `tendermint_consensus_validators`         | CometBFT :26660     | Validator count  |
| `tendermint_consensus_rounds`             | CometBFT :26660     | Consensus health |
| `tendermint_p2p_peers`                    | CometBFT :26660     | Network health   |
| `tendermint_mempool_size`                 | CometBFT :26660     | Tx throughput    |
| `node_cpu_seconds_total`                  | node_exporter :9100  | Node load        |
| `node_memory_MemAvailable_bytes`          | node_exporter :9100  | Memory           |
| `node_filesystem_avail_bytes`             | node_exporter :9100  | Disk             |

### 1.2 Contract-Level Metrics (Indexer-derived)

Collected from the PostgreSQL indexer (see `indexer/schema.sql`):

| Metric                           | Query / View                          | Frequency |
|----------------------------------|---------------------------------------|-----------|
| Total citizens credentialed      | `SELECT COUNT(*) FROM citizen_credentials WHERE status='active'` | Hourly |
| Proposals created / day          | `SELECT COUNT(*) FROM governance_proposals WHERE created_at > now()-'1d'` | Daily |
| Voter participation rate         | `v_governance_summary.avg_participation` | Per-proposal |
| Treasury balance                 | `v_treasury_summary.current_balance`    | Real-time |
| Treasury spend / category / week | `v_treasury_summary` grouped by category | Weekly |
| Grants funded vs applied         | `v_grants_summary.approval_rate`        | Weekly |
| Total staked                     | `SELECT SUM(amount) FROM staker_snapshots WHERE latest=true` | Hourly |
| Staking participation rate       | `total_stakers / total_citizens`        | Daily |
| Slash frequency                  | `SELECT COUNT(*) FROM slash_events WHERE timestamp > now()-'7d'` | Weekly |
| Emission minted vs max supply    | `staking_emissions.total_minted / max_supply` | Daily |

### 1.3 Off-Chain Metrics

| Metric                         | Source              | Purpose              |
|--------------------------------|---------------------|----------------------|
| Frontend page views            | Self-hosted Plausible | Engagement         |
| Wallet connection rate         | Client-side counter | Adoption            |
| Verification completion rate   | Verification service logs | Onboarding flow |
| RPC latency p50/p99            | Prometheus + blackbox exporter | Performance |
| Block query latency            | Prometheus + blackbox exporter | UX quality |

---

## 2. Parameter Categories & Tuning Process

### 2.1 Treasury Split Parameters

**Current defaults:**

| Category        | BPS  | %    | Rationale                    |
|-----------------|------|------|------------------------------|
| Research        | 2500 | 25%  | Core mission: fund studies   |
| Healthcare      | 2500 | 25%  | Public benefit priority      |
| Infrastructure  | 2000 | 20%  | Physical/digital infra       |
| Node Incentives | 1500 | 15%  | Validator sustainability     |
| Emergency       | 1000 | 10%  | Crisis reserve               |
| Education       | 500  | 5%   | Training and outreach        |

**Tuning triggers:**
- If any category accumulates >3 months of unspent funds → reduce allocation 200-500 BPS
- If any category is depleted within 1 month → increase allocation 200-500 BPS
- If emergency fund exceeds 12 months of average monthly spend → redirect excess to other categories
- Rebalancing requires governance proposal (Step 41)

**Metrics to watch:**
```sql
-- Category utilization rates
SELECT category,
       SUM(amount) as total_spent,
       SUM(amount) / EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) * 86400 * 30 as monthly_rate
FROM treasury_transactions
WHERE timestamp > now() - interval '3 months'
GROUP BY category;
```

### 2.2 Governance Parameters

**Current defaults:**

| Parameter       | Value  | Description            |
|-----------------|--------|------------------------|
| `voting_period` | 50,000 blocks (~3.5d)  | Time to vote  |
| `quorum_bps`    | 3000   | 30% participation min  |
| `threshold_bps` | 5000   | 50% yes-vote to pass   |
| `timelock_period`| 14,400 blocks (~1d)   | Execution delay        |

**Tuning criteria:**
- If <50% of proposals reach quorum → lower `quorum_bps` by 500 increments (floor: 1000)
- If >90% of proposals pass → consider raising `threshold_bps` to 6000 for stronger consensus
- If controversial proposals execute before community awareness → increase `timelock_period`
- If benign proposals are delayed unnecessarily → decrease `timelock_period` (floor: 7200)

**Metrics to watch:**
```sql
-- Proposal outcome distribution
SELECT status, COUNT(*) as count,
       AVG(yes_votes::numeric / NULLIF(total_votes, 0)) as avg_yes_ratio
FROM governance_proposals
WHERE created_at > now() - interval '30 days'
GROUP BY status;

-- Quorum achievement rate
SELECT COUNT(*) FILTER (WHERE total_votes >= quorum_threshold) * 100.0 / COUNT(*) as quorum_rate
FROM governance_proposals
WHERE status != 'Active';
```

### 2.3 Emission Parameters

**Current defaults:**

| Phase     | Block Range        | Tokens/Block | Annual Estimate   |
|-----------|--------------------|-------------|-------------------|
| Bootstrap | 0 – 5,256,000      | 100,000      | ~525.6B ucitizen  |
| Growth    | 5.26M – 15.77M     | 50,000       | ~262.8B/yr        |
| Maturity  | 15.77M – 31.54M    | 25,000       | ~131.4B/yr        |
| Steady    | 31.54M+            | 10,000       | ~52.6B/yr         |

**Tuning criteria:**
- If inflation causes >5% price degradation on testnet DEX → accelerate phase transitions
- If staking APY drops below 5% → consider increasing tokens_per_block (within cap)
- If >80% of supply is staked → reduce emission rate to prevent excessive concentration
- Treasury share (20%) is fixed in v1; adjust if treasury is over/under-funded

### 2.4 Staking Parameters

**Current defaults:**

| Parameter         | Value | Description              |
|-------------------|-------|--------------------------|
| `slash_penalty_bps` | 1000  | 10% slash on violation  |
| `treasury_share_bps` | 2000 | 20% of emissions to treasury |

**Tuning criteria:**
- If slash events occur >5 times/week → penalty may be too low; increase by 500 BPS
- If validators churn >20%/month → penalty may be too harsh; decrease by 500 BPS
- If treasury grows faster than spending → reduce `treasury_share_bps`

---

## 3. Tuning Governance Process

All parameter changes follow this process:

```
┌──────────────┐    ┌───────────────┐    ┌──────────────┐    ┌───────────────┐
│ Collect Data │───▶│ Draft Report  │───▶│ Governance   │───▶│ Execute       │
│ (7-30 days)  │    │ & Recommend   │    │ Proposal     │    │ (after lock)  │
└──────────────┘    └───────────────┘    └──────────────┘    └───────────────┘
```

1. **Collect** — Gather 7-30 days of metric data from indexer + Prometheus
2. **Report** — Generate parameter tuning report with data visualizations  
3. **Propose** — Submit ParameterChange governance proposal using template
4. **Vote** — Community votes during voting period
5. **Timelock** — If passed, execute after timelock period
6. **Monitor** — Track impact for next 7-30 days, repeat cycle

### 3.1 Monthly Parameter Review Template

```markdown
# Parameter Review — [Month YYYY]

## Summary
- Period: [start] to [end]
- Proposals submitted: X | Passed: Y | Quorum rate: Z%
- Treasury balance: X CITIZEN | Monthly burn: Y CITIZEN
- Active stakers: X | Slash events: Y
- Emission progress: X% of max supply

## Recommendations
| Parameter | Current | Proposed | Justification |
|-----------|---------|----------|---------------|
| (example) | quorum_bps: 3000 | 2500 | Only 40% of proposals reaching quorum |

## Data Appendix
[Link to Grafana dashboard snapshot]
```

---

## 4. Grafana Dashboard Configuration

Import the following dashboard panels for parameter monitoring:

```json
{
  "dashboard": {
    "title": "Citizen Ledger - Parameter Tuning",
    "panels": [
      {
        "title": "Treasury Category Utilization",
        "type": "piechart",
        "datasource": "PostgreSQL",
        "targets": [{"rawSql": "SELECT category, SUM(amount) as value FROM treasury_transactions GROUP BY category"}]
      },
      {
        "title": "Proposal Quorum Achievement",
        "type": "gauge",
        "datasource": "PostgreSQL",
        "targets": [{"rawSql": "SELECT COUNT(*) FILTER (WHERE total_votes >= quorum) * 100.0 / COUNT(*) FROM governance_proposals WHERE status != 'Active'"}]
      },
      {
        "title": "Emission Progress",
        "type": "stat",
        "datasource": "PostgreSQL",
        "targets": [{"rawSql": "SELECT total_minted * 100.0 / 1000000000000.0 as pct FROM staker_snapshots ORDER BY block_height DESC LIMIT 1"}]
      },
      {
        "title": "Staking Participation Over Time",
        "type": "timeseries",
        "datasource": "PostgreSQL",
        "targets": [{"rawSql": "SELECT date_trunc('day', timestamp) as time, SUM(amount) as staked FROM staker_snapshots GROUP BY 1 ORDER BY 1"}]
      },
      {
        "title": "Slash Events per Week",
        "type": "barchart",
        "datasource": "PostgreSQL",
        "targets": [{"rawSql": "SELECT date_trunc('week', timestamp) as week, COUNT(*) FROM slash_events GROUP BY 1"}]
      }
    ]
  }
}
```

---

## 5. Automated Alerting for Parameter Anomalies

Add these to `/etc/prometheus/alerts.yml`:

```yaml
groups:
  - name: parameter_tuning_alerts
    rules:
      - alert: LowQuorumRate
        expr: citizen_quorum_achievement_rate < 50
        for: 7d
        labels: { severity: info }
        annotations:
          summary: "Quorum rate below 50% for 7 days — consider lowering quorum_bps"

      - alert: TreasuryCategoryDepleted
        expr: citizen_treasury_category_balance < 1000000
        for: 1d
        labels: { severity: warning }
        annotations:
          summary: "Treasury category nearly depleted — rebalance needed"

      - alert: HighSlashRate
        expr: rate(citizen_slash_events_total[7d]) > 0.7
        for: 1d
        labels: { severity: warning }
        annotations:
          summary: "More than 5 slash events/week — review slash parameters"

      - alert: EmissionCapApproaching
        expr: citizen_emission_progress_pct > 90
        for: 1d
        labels: { severity: info }
        annotations:
          summary: "Emission >90% of max supply — plan for steady state"
```

---

*Citizen Ledger — Metrics & Parameter Tuning v1.0*
