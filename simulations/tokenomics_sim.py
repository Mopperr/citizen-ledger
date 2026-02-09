#!/usr/bin/env python3
"""
Citizen Ledger Tokenomics Simulation

Simulates the CITIZEN token economics including:
- Multi-phase emission curve
- Treasury accumulation
- Staking rewards distribution
- Supply cap constraints

Usage:
    python tokenomics_sim.py [--output-dir OUTPUT_DIR] [--scenarios SCENARIOS]
"""

import argparse
import json
import os
from dataclasses import dataclass, field
from typing import Optional

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

# ════════════════════════════════════════════════════════════════════════════════
# Configuration
# ════════════════════════════════════════════════════════════════════════════════

@dataclass
class EmissionPhase:
    """A single emission phase with start/end and rate."""
    label: str
    start_block: int
    end_block: int  # 0 = infinity
    tokens_per_block: float


@dataclass
class Config:
    """Simulation configuration parameters."""
    # Token supply
    max_supply: int = 10_000_000_000  # 10 billion CITIZEN
    initial_supply: int = 100_000_000  # 100 million genesis
    
    # Emission phases
    phases: list = field(default_factory=lambda: [
        EmissionPhase("Year 1",    0,          5_256_000,    100.0),   # ~5.2M blocks/year at 6s
        EmissionPhase("Year 2-3",  5_256_000,  15_768_000,   50.0),    # Years 2-3
        EmissionPhase("Year 4-5",  15_768_000, 26_280_000,   25.0),    # Years 4-5
        EmissionPhase("Year 6+",   26_280_000, 0,            10.0),    # Year 6 onwards
    ])
    
    # Treasury
    treasury_share_bps: int = 2000  # 20% to treasury
    
    # Difficulty scaling
    difficulty_enabled: bool = True  # Supply-ratio difficulty scaling
    
    # Chain
    block_time_seconds: int = 6
    blocks_per_year: int = 5_256_000  # 365.25 * 24 * 60 * 60 / 6
    
    # Simulation
    simulation_years: int = 10
    
    @property
    def treasury_share(self) -> float:
        return self.treasury_share_bps / 10_000


# ════════════════════════════════════════════════════════════════════════════════
# Simulation Engine
# ════════════════════════════════════════════════════════════════════════════════

class TokenomicsSimulator:
    """Simulates Citizen Ledger token economics over time."""
    
    def __init__(self, config: Config):
        self.config = config
        self.results = None
    
    def get_emission_rate(self, block: int) -> float:
        """Get tokens per block for a given block height."""
        for phase in self.config.phases:
            if block >= phase.start_block:
                if phase.end_block == 0 or block < phase.end_block:
                    return phase.tokens_per_block
        return 0.0
    
    def run(self, staking_rate: float = 0.5) -> pd.DataFrame:
        """
        Run the simulation.
        
        Args:
            staking_rate: Percentage of circulating supply staked (0-1)
        
        Returns:
            DataFrame with simulation results by block
        """
        total_blocks = self.config.blocks_per_year * self.config.simulation_years
        sample_interval = self.config.blocks_per_year // 12  # Monthly samples
        
        results = []
        
        # Initial state
        total_supply = self.config.initial_supply
        treasury_balance = 0
        staker_rewards_total = 0
        
        for block in range(0, total_blocks, sample_interval):
            # Get emission rate for this block
            emission_rate = self.get_emission_rate(block)
            
            # Calculate emissions for this interval
            interval_emissions = emission_rate * sample_interval
            
            # Apply supply-ratio difficulty scaling
            if self.config.difficulty_enabled and self.config.max_supply > 0:
                remaining_ratio = (self.config.max_supply - total_supply) / self.config.max_supply
                difficulty_factor = max(0.0, remaining_ratio)
                interval_emissions *= difficulty_factor
            else:
                difficulty_factor = 1.0
            
            # Check supply cap
            remaining_capacity = self.config.max_supply - total_supply
            actual_emissions = min(interval_emissions, remaining_capacity)
            
            if actual_emissions > 0:
                # Split between treasury and stakers
                treasury_share = actual_emissions * self.config.treasury_share
                staker_share = actual_emissions - treasury_share
                
                treasury_balance += treasury_share
                staker_rewards_total += staker_share
                total_supply += actual_emissions
            
            # Calculate APY for stakers at current participation rate
            staked_amount = total_supply * staking_rate
            if staked_amount > 0:
                annual_staker_rewards = emission_rate * self.config.blocks_per_year * (1 - self.config.treasury_share)
                if self.config.difficulty_enabled and self.config.max_supply > 0:
                    annual_staker_rewards *= difficulty_factor
                staking_apy = (annual_staker_rewards / staked_amount) * 100
            else:
                staking_apy = 0
            
            # Record results
            year = block / self.config.blocks_per_year
            results.append({
                'block': block,
                'year': year,
                'emission_rate': emission_rate,
                'difficulty_factor': difficulty_factor,
                'effective_emission_rate': emission_rate * difficulty_factor,
                'total_supply': total_supply,
                'supply_percent': (total_supply / self.config.max_supply) * 100,
                'treasury_balance': treasury_balance,
                'staker_rewards_total': staker_rewards_total,
                'staking_apy': staking_apy,
            })
        
        self.results = pd.DataFrame(results)
        return self.results
    
    def run_scenario_comparison(self, scenarios: dict) -> dict:
        """
        Run multiple scenarios with different parameters.
        
        Args:
            scenarios: Dict of scenario_name -> config modifications
        
        Returns:
            Dict of scenario_name -> DataFrame
        """
        results = {}
        
        for name, mods in scenarios.items():
            # Create modified config
            config = Config()
            for key, value in mods.items():
                setattr(config, key, value)
            
            sim = TokenomicsSimulator(config)
            results[name] = sim.run()
        
        return results


# ════════════════════════════════════════════════════════════════════════════════
# Visualization
# ════════════════════════════════════════════════════════════════════════════════

def plot_emission_curve(sim: TokenomicsSimulator, output_dir: str):
    """Plot the emission rate over time."""
    df = sim.results
    
    fig, ax = plt.subplots(figsize=(12, 6))
    ax.plot(df['year'], df['emission_rate'], 'b-', linewidth=2)
    
    # Add phase labels
    for phase in sim.config.phases:
        year_start = phase.start_block / sim.config.blocks_per_year
        ax.axvline(x=year_start, color='gray', linestyle='--', alpha=0.5)
        ax.annotate(phase.label, xy=(year_start + 0.2, phase.tokens_per_block * 0.9),
                   fontsize=9, alpha=0.7)
    
    ax.set_xlabel('Year', fontsize=12)
    ax.set_ylabel('Tokens per Block', fontsize=12)
    ax.set_title('CITIZEN Emission Curve', fontsize=14, fontweight='bold')
    ax.grid(True, alpha=0.3)
    ax.set_xlim(0, sim.config.simulation_years)
    ax.set_ylim(0, max(df['emission_rate']) * 1.1)
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'emission_curve.png'), dpi=150)
    plt.close()


def plot_supply_growth(sim: TokenomicsSimulator, output_dir: str):
    """Plot total supply growth vs max supply."""
    df = sim.results
    config = sim.config
    
    fig, ax = plt.subplots(figsize=(12, 6))
    
    ax.fill_between(df['year'], 0, df['total_supply'] / 1e6, 
                   alpha=0.3, color='blue', label='Circulating Supply')
    ax.plot(df['year'], df['total_supply'] / 1e6, 'b-', linewidth=2)
    ax.axhline(y=config.max_supply / 1e6, color='red', linestyle='--', 
               linewidth=2, label=f'Max Supply ({config.max_supply/1e6:.0f}M)')
    
    ax.set_xlabel('Year', fontsize=12)
    ax.set_ylabel('Supply (Millions)', fontsize=12)
    ax.set_title('CITIZEN Supply Growth', fontsize=14, fontweight='bold')
    ax.legend(loc='lower right')
    ax.grid(True, alpha=0.3)
    ax.set_xlim(0, sim.config.simulation_years)
    ax.set_ylim(0, config.max_supply / 1e6 * 1.1)
    
    # Add percentage annotations
    for year in [1, 5, 10]:
        idx = df[df['year'] >= year].index[0] if year <= sim.config.simulation_years else -1
        if idx != -1:
            supply = df.loc[idx, 'total_supply']
            percent = (supply / config.max_supply) * 100
            ax.annotate(f'{percent:.1f}%', xy=(year, supply/1e6), 
                       xytext=(year+0.3, supply/1e6 + 50),
                       fontsize=10, alpha=0.8)
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'supply_growth.png'), dpi=150)
    plt.close()


def plot_treasury_accumulation(sim: TokenomicsSimulator, output_dir: str):
    """Plot treasury balance over time."""
    df = sim.results
    
    fig, ax = plt.subplots(figsize=(12, 6))
    
    ax.fill_between(df['year'], 0, df['treasury_balance'] / 1e6,
                   alpha=0.3, color='green')
    ax.plot(df['year'], df['treasury_balance'] / 1e6, 'g-', linewidth=2)
    
    ax.set_xlabel('Year', fontsize=12)
    ax.set_ylabel('Treasury Balance (Millions)', fontsize=12)
    ax.set_title(f'Treasury Accumulation ({sim.config.treasury_share_bps/100:.0f}% of Emissions)',
                fontsize=14, fontweight='bold')
    ax.grid(True, alpha=0.3)
    ax.set_xlim(0, sim.config.simulation_years)
    
    # Add milestone annotations
    for year in [1, 3, 5, 10]:
        idx = df[df['year'] >= year].index[0] if year <= sim.config.simulation_years else -1
        if idx != -1:
            balance = df.loc[idx, 'treasury_balance']
            ax.annotate(f'{balance/1e6:.1f}M', xy=(year, balance/1e6),
                       xytext=(year-0.5, balance/1e6 * 1.1),
                       fontsize=10, fontweight='bold')
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'treasury_accumulation.png'), dpi=150)
    plt.close()


def plot_staking_apy(sim: TokenomicsSimulator, output_dir: str):
    """Plot staking APY for different participation rates."""
    config = sim.config
    
    fig, ax = plt.subplots(figsize=(12, 6))
    
    staking_rates = [0.3, 0.5, 0.7]
    colors = ['red', 'blue', 'green']
    
    for rate, color in zip(staking_rates, colors):
        sim_copy = TokenomicsSimulator(config)
        df = sim_copy.run(staking_rate=rate)
        ax.plot(df['year'], df['staking_apy'], color=color, linewidth=2,
               label=f'{rate*100:.0f}% Staked')
    
    ax.set_xlabel('Year', fontsize=12)
    ax.set_ylabel('Staking APY (%)', fontsize=12)
    ax.set_title('Staking Rewards APY by Participation Rate', fontsize=14, fontweight='bold')
    ax.legend(loc='upper right')
    ax.grid(True, alpha=0.3)
    ax.set_xlim(0, sim.config.simulation_years)
    ax.set_ylim(0)
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'staking_rewards.png'), dpi=150)
    plt.close()


def plot_scenario_comparison(scenarios_results: dict, output_dir: str):
    """Plot comparison of different scenarios."""
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    
    colors = ['blue', 'red', 'green', 'orange', 'purple']
    
    # Supply growth comparison
    ax = axes[0, 0]
    for i, (name, df) in enumerate(scenarios_results.items()):
        ax.plot(df['year'], df['supply_percent'], color=colors[i % len(colors)],
               linewidth=2, label=name)
    ax.set_xlabel('Year')
    ax.set_ylabel('Supply Minted (%)')
    ax.set_title('Supply Growth Comparison')
    ax.legend()
    ax.grid(True, alpha=0.3)
    
    # Treasury comparison
    ax = axes[0, 1]
    for i, (name, df) in enumerate(scenarios_results.items()):
        ax.plot(df['year'], df['treasury_balance'] / 1e6, color=colors[i % len(colors)],
               linewidth=2, label=name)
    ax.set_xlabel('Year')
    ax.set_ylabel('Treasury (Millions)')
    ax.set_title('Treasury Balance Comparison')
    ax.legend()
    ax.grid(True, alpha=0.3)
    
    # Emission rate comparison
    ax = axes[1, 0]
    for i, (name, df) in enumerate(scenarios_results.items()):
        ax.plot(df['year'], df['emission_rate'], color=colors[i % len(colors)],
               linewidth=2, label=name)
    ax.set_xlabel('Year')
    ax.set_ylabel('Tokens per Block')
    ax.set_title('Emission Rate Comparison')
    ax.legend()
    ax.grid(True, alpha=0.3)
    
    # APY comparison
    ax = axes[1, 1]
    for i, (name, df) in enumerate(scenarios_results.items()):
        ax.plot(df['year'], df['staking_apy'], color=colors[i % len(colors)],
               linewidth=2, label=name)
    ax.set_xlabel('Year')
    ax.set_ylabel('Staking APY (%)')
    ax.set_title('Staking APY Comparison')
    ax.legend()
    ax.grid(True, alpha=0.3)
    
    plt.suptitle('Tokenomics Scenario Comparison', fontsize=16, fontweight='bold')
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'scenario_comparison.png'), dpi=150)
    plt.close()


def generate_report(sim: TokenomicsSimulator, output_dir: str):
    """Generate JSON report with key metrics."""
    df = sim.results
    config = sim.config
    
    # Find key milestones
    def get_milestone(year):
        idx = df[df['year'] >= year].index
        return df.loc[idx[0]].to_dict() if len(idx) > 0 else None
    
    report = {
        'config': {
            'max_supply': config.max_supply,
            'initial_supply': config.initial_supply,
            'treasury_share_bps': config.treasury_share_bps,
            'phases': [
                {
                    'label': p.label,
                    'start_block': p.start_block,
                    'end_block': p.end_block,
                    'tokens_per_block': p.tokens_per_block
                }
                for p in config.phases
            ]
        },
        'milestones': {
            'year_1': get_milestone(1),
            'year_3': get_milestone(3),
            'year_5': get_milestone(5),
            'year_10': get_milestone(10)
        },
        'summary': {
            'final_supply': float(df.iloc[-1]['total_supply']),
            'final_supply_percent': float(df.iloc[-1]['supply_percent']),
            'final_treasury_balance': float(df.iloc[-1]['treasury_balance']),
            'total_staker_rewards': float(df.iloc[-1]['staker_rewards_total']),
            'years_to_80_percent': float(df[df['supply_percent'] >= 80]['year'].iloc[0])
                if any(df['supply_percent'] >= 80) else None
        }
    }
    
    with open(os.path.join(output_dir, 'report.json'), 'w') as f:
        json.dump(report, f, indent=2, default=str)
    
    return report


# ════════════════════════════════════════════════════════════════════════════════
# Main
# ════════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description='Citizen Ledger Tokenomics Simulation')
    parser.add_argument('--output-dir', default='output', help='Output directory for charts')
    parser.add_argument('--scenarios', default=None, 
                       help='Comma-separated scenario names: base,conservative,aggressive,treasury_heavy')
    args = parser.parse_args()
    
    # Create output directory
    os.makedirs(args.output_dir, exist_ok=True)
    
    print("=" * 60)
    print("  CITIZEN LEDGER TOKENOMICS SIMULATION")
    print("=" * 60)
    
    # Base simulation
    config = Config()
    sim = TokenomicsSimulator(config)
    
    print(f"\n📊 Running base simulation...")
    print(f"   Max Supply: {config.max_supply:,} CITIZEN")
    print(f"   Initial Supply: {config.initial_supply:,} CITIZEN")
    print(f"   Treasury Share: {config.treasury_share_bps/100:.0f}%")
    print(f"   Simulation Period: {config.simulation_years} years")
    
    df = sim.run()
    
    # Generate charts
    print(f"\n📈 Generating charts...")
    plot_emission_curve(sim, args.output_dir)
    print(f"   ✓ emission_curve.png")
    
    plot_supply_growth(sim, args.output_dir)
    print(f"   ✓ supply_growth.png")
    
    plot_treasury_accumulation(sim, args.output_dir)
    print(f"   ✓ treasury_accumulation.png")
    
    plot_staking_apy(sim, args.output_dir)
    print(f"   ✓ staking_rewards.png")
    
    # Scenario comparison
    if args.scenarios:
        scenario_names = args.scenarios.split(',')
    else:
        scenario_names = ['base', 'conservative', 'aggressive']
    
    scenarios = {
        'base': {},  # Default config
        'conservative': {
            'phases': [
                EmissionPhase("Year 1",    0,          5_256_000,    50.0),
                EmissionPhase("Year 2-3",  5_256_000,  15_768_000,   25.0),
                EmissionPhase("Year 4-5",  15_768_000, 26_280_000,   12.5),
                EmissionPhase("Year 6+",   26_280_000, 0,            5.0),
            ]
        },
        'aggressive': {
            'phases': [
                EmissionPhase("Year 1",    0,          5_256_000,    200.0),
                EmissionPhase("Year 2-3",  5_256_000,  15_768_000,   100.0),
                EmissionPhase("Year 4-5",  15_768_000, 26_280_000,   50.0),
                EmissionPhase("Year 6+",   26_280_000, 0,            25.0),
            ]
        },
        'treasury_heavy': {
            'treasury_share_bps': 4000  # 40% to treasury
        }
    }
    
    selected_scenarios = {k: v for k, v in scenarios.items() if k in scenario_names}
    
    if len(selected_scenarios) > 1:
        print(f"\n🔄 Running scenario comparison: {', '.join(selected_scenarios.keys())}")
        scenario_results = sim.run_scenario_comparison(selected_scenarios)
        plot_scenario_comparison(scenario_results, args.output_dir)
        print(f"   ✓ scenario_comparison.png")
    
    # Generate report
    report = generate_report(sim, args.output_dir)
    print(f"\n📄 Generated report.json")
    
    # Print summary
    print("\n" + "=" * 60)
    print("  SUMMARY")
    print("=" * 60)
    
    final = df.iloc[-1]
    print(f"\n  After {config.simulation_years} years:")
    print(f"    Total Supply: {final['total_supply']:,.0f} ({final['supply_percent']:.1f}% of max)")
    print(f"    Treasury Balance: {final['treasury_balance']:,.0f}")
    print(f"    Staker Rewards Distributed: {final['staker_rewards_total']:,.0f}")
    
    if report['summary']['years_to_80_percent']:
        print(f"    Years to 80% Supply: {report['summary']['years_to_80_percent']:.1f}")
    
    print(f"\n  Output saved to: {os.path.abspath(args.output_dir)}/")
    print("=" * 60)


if __name__ == '__main__':
    main()
