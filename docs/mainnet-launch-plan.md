# Citizen Ledger — Mainnet Launch Plan

Comprehensive checklist and procedure for launching the Citizen Ledger mainnet
after successful testnet validation.

---

## Pre-Launch Requirements

All of the following must be completed before mainnet genesis:

### Code Readiness
- [ ] All 5 contracts pass 37+ unit/integration tests
- [ ] External smart contract audit completed (firm + report published)
- [ ] ZK circuit audit completed (if using custom circuits)
- [ ] All critical/high findings from audits resolved
- [ ] Reproducible wasm builds via optimizer (`scripts/optimize.sh`)
- [ ] Contract checksums published and verified by ≥3 independent parties
- [ ] Migrate handlers added to all 5 contracts for future upgrades
- [ ] `cargo audit` — zero known vulnerabilities

### Testnet Validation
- [ ] Public testnet ran for ≥30 days
- [ ] ≥10 independent validators operated nodes
- [ ] ≥100 test credentials issued
- [ ] ≥50 governance proposals created and tallied
- [ ] ≥20 grant applications processed end-to-end
- [ ] Treasury spend of ≥5 categories executed
- [ ] Staking emission across ≥2 phases tested (fast blocks on testnet)
- [ ] Key recovery flow tested by ≥5 users
- [ ] Slash flow tested for ≥3 validators
- [ ] No critical bugs in final 14 days of testnet

### Infrastructure
- [ ] ≥7 genesis validators committed + hardware provisioned
- [ ] Sentry node architecture implemented for all genesis validators
- [ ] Seed nodes configured (≥3 geographically distributed)
- [ ] Public RPC endpoints (≥3 providers)
- [ ] Block explorer deployed (e.g., ping.pub, Big Dipper)
- [ ] Indexer pipeline running on production PostgreSQL
- [ ] Prometheus + Grafana monitoring for all validators
- [ ] Reward keeper bot deployed and tested

### Governance
- [ ] Multi-sig admin wallet created (3-of-5 minimum)
- [ ] Emergency procedures documented
- [ ] Admin key rotation scheduled for +30 days post-launch
- [ ] Governance parameters finalized via testnet tuning

---

## Genesis Configuration

### Genesis Accounts

| Account            | Amount (ucitizen)  | Purpose                           |
|--------------------|--------------------|-----------------------------------|
| Protocol Reserve   | 100,000,000,000    | Contract deployment + admin ops   |
| Community Treasury | 50,000,000,000     | Initial treasury seed             |
| Faucet (testnet)   | 0                  | No faucet on mainnet              |
| Validator 1        | 20,000,000,000     | Genesis stake + gas               |
| Validator 2        | 20,000,000,000     | Genesis stake + gas               |
| ...                | ...                | (repeat per validator)            |
| Airdrop pool       | 50,000,000,000     | Citizen credential airdrop        |
| Strategic reserve  | 80,000,000,000     | Multi-sig locked, governance-gated|

**Total genesis supply: 100,000,000,000 ucitizen** (100B = 10% of max 1T supply)
Remaining 900B minted via emission schedule over multiple years.

### Genesis Contract Deployment Order

```
1. credential-registry  ← No dependencies
2. treasury             ← Needs governance addr (placeholder → update later)
3. voting               ← Needs credential-registry + treasury
4. grants               ← Needs voting + treasury  
5. staking-emissions    ← Needs treasury
6. Update treasury.governance → voting contract
7. Fund treasury with initial seed
8. Add initial issuers to credential-registry
9. Add initial reviewers to grants
```

### Chain Parameters

```json
{
  "chain_id": "citizen-ledger-1",
  "block_time": "6s",
  "consensus": {
    "max_validators": 100,
    "max_block_gas": 100000000,
    "evidence_max_age_num_blocks": 100000
  },
  "staking": {
    "unbonding_time": "1814400s",
    "max_entries": 7
  },
  "slashing": {
    "signed_blocks_window": 10000,
    "min_signed_per_window": "0.05",
    "downtime_jail_duration": "600s",
    "slash_fraction_double_sign": "0.05",
    "slash_fraction_downtime": "0.01"
  },
  "wasm": {
    "max_wasm_code_size": 1228800,
    "instantiate_default_permission": "Everybody"
  }
}
```

---

## Launch Day Procedure

### T-7 Days: Final Preparations
- [ ] Freeze code — no more contract changes
- [ ] Generate final optimized wasm binaries
- [ ] Publish wasm checksums to GitHub release
- [ ] Distribute genesis.json to all validators
- [ ] All validators submit gentx + verify
- [ ] Collect and validate all gentxs
- [ ] Generate final genesis.json with all gentxs
- [ ] All validators verify final genesis hash matches

### T-1 Day: Pre-Launch Checks
- [ ] All validators confirm node synced to testnet latest
- [ ] Verify genesis hash matches across all validators
- [ ] Confirm monitoring + alerting is operational
- [ ] Verify seed nodes are reachable
- [ ] Communication channels ready (Discord, Telegram)
- [ ] Incident response team on standby

### T-0: Launch
```
09:00 UTC — All validators start nodes with agreed genesis
09:05 UTC — Monitor first block production
09:10 UTC — Confirm ≥2/3 voting power online
09:15 UTC — Store contract binaries (code IDs 1-5)
09:30 UTC — Instantiate all 5 contracts in order
09:45 UTC — Update cross-references (treasury→voting)
10:00 UTC — Fund treasury with initial seed
10:15 UTC — Issue first credential (admin)
10:30 UTC — Create welcome governance proposal
10:45 UTC — Verify all endpoints + frontend operational
11:00 UTC — Public announcement: MAINNET IS LIVE
```

### T+1 Hour: Validation
- [ ] Block production steady (1 block / ~6s)
- [ ] ≥2/3 validators signing
- [ ] All 5 contracts queryable
- [ ] Frontend transparency dashboard shows live data
- [ ] Reward keeper bot distributing
- [ ] Indexer processing events

### T+24 Hours: Day 1 Review
- [ ] No missed blocks > 5 consecutive
- [ ] No validator jailed
- [ ] Treasury deposit confirmed
- [ ] At least 1 credential issued
- [ ] At least 1 proposal created
- [ ] Monitoring dashboards operational

---

## Post-Launch Operations

### Week 1
- [ ] Onboard first batch of verified citizens (target: 50)
- [ ] First governance proposal voted on
- [ ] First grant application submitted
- [ ] Admin key rotation executed (multi-sig to DAO)
- [ ] Emergency response drill conducted

### Month 1
- [ ] 200+ citizens credentialed
- [ ] 10+ governance proposals processed
- [ ] Treasury at >80% utilization across categories
- [ ] First grant milestone approved
- [ ] First monthly parameter review completed
- [ ] Bug bounty program launched

### Month 3
- [ ] 1000+ citizens
- [ ] Staking participation >30%
- [ ] 3 monthly parameter reviews completed
- [ ] First research grant cycle (Step 44) launched
- [ ] Infrastructure pilot proposal submitted (Step 45)

---

## Emergency Procedures

### Chain Halt
1. Coordinate via emergency Discord channel
2. Identify root cause (consensus bug, state machine error, etc.)
3. If software bug: prepare hotfix, coordinate upgrade height
4. If state corruption: coordinate state export + genesis migration
5. All validators apply fix, restart at coordinated height

### Contract Vulnerability
1. If funds at risk: execute emergency governance proposal (fast-track)
2. If no funds at risk: standard governance proposal for contract migration
3. Store patched contract → migrate via admin key (only during timelock)
4. Publish post-mortem within 48 hours

### Validator Compromise
1. Jailed validators detected by monitoring
2. Community notifies via Discord
3. Validator must re-key and rejoin
4. If double-sign detected: slash + tombstone (permanent)

---

## Communication Plan

| Channel    | Audience          | Content                          |
|------------|-------------------|----------------------------------|
| GitHub     | Developers        | Release notes, code, audits      |
| Discord    | Validators + devs | Coordination, support, emergency |
| Telegram   | Citizens          | Announcements, proposals, votes  |
| Blog/Site  | Public            | Launch post, updates, monthly reports |
| Dashboard  | Everyone          | Real-time on-chain transparency  |

---

*Citizen Ledger — Mainnet Launch Plan v1.0*
