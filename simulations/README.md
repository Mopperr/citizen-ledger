# Citizen Ledger Tokenomics Simulation

Python simulation of the CITIZEN token emission curve, treasury accumulation, and staking dynamics.

## Overview

This simulation models the token economics of Citizen Ledger over a 10-year period, including:

- **Emission Curve**: Multi-phase declining emission schedule
- **Treasury Allocation**: Percentage of emissions funding public goods
- **Staking Dynamics**: Reward distribution to stakers
- **Supply Cap**: Hard ceiling on total token supply

## Quick Start

```bash
cd simulations

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run simulation
python tokenomics_sim.py
```

## Outputs

The simulation generates:

1. **emission_curve.png** — Token emission rate over time
2. **supply_growth.png** — Total supply growth vs max supply
3. **treasury_accumulation.png** — Treasury balance over time
4. **staking_rewards.png** — APY for stakers at different participation rates
5. **scenario_comparison.png** — Comparison of different parameter scenarios
6. **report.json** — Full numerical data for analysis

## Parameters

Modify `config.json` to adjust simulation parameters:

```json
{
  "max_supply": 1000000000,
  "initial_supply": 100000000,
  "treasury_share_bps": 2000,
  "phases": [
    {"label": "Year 1", "tokens_per_block": 100, "duration_blocks": 5256000},
    {"label": "Year 2-3", "tokens_per_block": 50, "duration_blocks": 10512000},
    {"label": "Year 4-5", "tokens_per_block": 25, "duration_blocks": 10512000},
    {"label": "Year 6+", "tokens_per_block": 10, "duration_blocks": 0}
  ],
  "block_time_seconds": 6
}
```

## Scenario Analysis

Run multiple scenarios:

```bash
python tokenomics_sim.py --scenarios high_staking,low_staking,treasury_heavy
```

## Dependencies

- Python 3.10+
- matplotlib
- numpy
- pandas
