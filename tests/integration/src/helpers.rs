// ─────────────────────────────────────────────────────────────────────────────
// Integration Test Helpers – sets up cw-multi-test App with all contracts
// ─────────────────────────────────────────────────────────────────────────────
#![allow(dead_code)]

use cosmwasm_std::{Addr, Coin, Uint128};
use cw_multi_test::{App, AppBuilder, ContractWrapper, Executor};

use citizen_common::treasury::FundCategory;

// ── Contract wrappers ───────────────────────────────────────────────────────

pub fn credential_registry_contract() -> Box<
    ContractWrapper<
        credential_registry::msg::ExecuteMsg,
        credential_registry::msg::InstantiateMsg,
        credential_registry::msg::QueryMsg,
        citizen_common::errors::ContractError,
        citizen_common::errors::ContractError,
        cosmwasm_std::StdError,
    >,
> {
    let contract = ContractWrapper::new(
        credential_registry::contract::execute,
        credential_registry::contract::instantiate,
        credential_registry::contract::query,
    );
    Box::new(contract)
}

pub fn treasury_contract() -> Box<
    ContractWrapper<
        treasury::msg::ExecuteMsg,
        treasury::msg::InstantiateMsg,
        treasury::msg::QueryMsg,
        citizen_common::errors::ContractError,
        citizen_common::errors::ContractError,
        cosmwasm_std::StdError,
    >,
> {
    let contract = ContractWrapper::new(
        treasury::contract::execute,
        treasury::contract::instantiate,
        treasury::contract::query,
    );
    Box::new(contract)
}

pub fn voting_contract() -> Box<
    ContractWrapper<
        voting::msg::ExecuteMsg,
        voting::msg::InstantiateMsg,
        voting::msg::QueryMsg,
        citizen_common::errors::ContractError,
        citizen_common::errors::ContractError,
        cosmwasm_std::StdError,
    >,
> {
    let contract = ContractWrapper::new(
        voting::contract::execute,
        voting::contract::instantiate,
        voting::contract::query,
    );
    Box::new(contract)
}

pub fn grants_contract() -> Box<
    ContractWrapper<
        grants::msg::ExecuteMsg,
        grants::msg::InstantiateMsg,
        grants::msg::QueryMsg,
        citizen_common::errors::ContractError,
        citizen_common::errors::ContractError,
        cosmwasm_std::StdError,
    >,
> {
    let contract = ContractWrapper::new(
        grants::contract::execute,
        grants::contract::instantiate,
        grants::contract::query,
    );
    Box::new(contract)
}

pub fn staking_contract() -> Box<
    ContractWrapper<
        staking_emissions::msg::ExecuteMsg,
        staking_emissions::msg::InstantiateMsg,
        staking_emissions::msg::QueryMsg,
        citizen_common::errors::ContractError,
        citizen_common::errors::ContractError,
        cosmwasm_std::StdError,
    >,
> {
    let contract = ContractWrapper::new(
        staking_emissions::contract::execute,
        staking_emissions::contract::instantiate,
        staking_emissions::contract::query,
    );
    Box::new(contract)
}

// ── Deployed System ─────────────────────────────────────────────────────────

/// Addresses of all deployed contracts in the multi-test environment
pub struct DeployedSystem {
    pub admin: Addr,
    pub citizen1: Addr,
    pub citizen2: Addr,
    pub citizen3: Addr,
    pub credential_registry: Addr,
    pub treasury: Addr,
    pub voting: Addr,
    pub grants: Addr,
    pub staking: Addr,
}

/// Build an App with balances and deploy all contracts in dependency order
pub fn deploy_full_system() -> (App, DeployedSystem) {
    // cw-multi-test v2 requires bech32-valid addresses; build them first with a
    // temporary App so we can feed them into the builder's init_balance.
    let tmp = App::default();
    let admin = tmp.api().addr_make("admin");
    let citizen1 = tmp.api().addr_make("citizen1");
    let citizen2 = tmp.api().addr_make("citizen2");
    let citizen3 = tmp.api().addr_make("citizen3");

    let admin_c = admin.clone();
    let c1_c = citizen1.clone();
    let c2_c = citizen2.clone();
    let c3_c = citizen3.clone();

    let mut app = AppBuilder::new().build(|router, _api, storage| {
        // Fund accounts
        router
            .bank
            .init_balance(
                storage,
                &admin_c,
                vec![Coin {
                    denom: "ucitizen".to_string(),
                    amount: Uint128::new(1_000_000_000_000),
                }],
            )
            .unwrap();
        for citizen in [&c1_c, &c2_c, &c3_c] {
            router
                .bank
                .init_balance(
                    storage,
                    citizen,
                    vec![Coin {
                        denom: "ucitizen".to_string(),
                        amount: Uint128::new(10_000_000_000),
                    }],
                )
                .unwrap();
        }
    });

    // ── Store contracts ─────────────────────────────────────────────────
    let cred_code_id = app.store_code(credential_registry_contract());
    let treasury_code_id = app.store_code(treasury_contract());
    let voting_code_id = app.store_code(voting_contract());
    let grants_code_id = app.store_code(grants_contract());
    let staking_code_id = app.store_code(staking_contract());

    // ── 1. Credential Registry ──────────────────────────────────────────
    let cred_addr = app
        .instantiate_contract(
            cred_code_id,
            admin.clone(),
            &credential_registry::msg::InstantiateMsg {
                admin: admin.to_string(),
                issuers: vec![admin.to_string()],
            },
            &[],
            "credential-registry",
            None,
        )
        .unwrap();

    // ── 2. Treasury (placeholder governance – will update) ──────────────
    let treasury_addr = app
        .instantiate_contract(
            treasury_code_id,
            admin.clone(),
            &treasury::msg::InstantiateMsg {
                admin: admin.to_string(),
                governance_contract: admin.to_string(), // placeholder
                denom: "ucitizen".to_string(),
                allocations: vec![
                    (FundCategory::Infrastructure, 3000),
                    (FundCategory::Education, 2000),
                    (FundCategory::Healthcare, 2000),
                    (FundCategory::Research, 2000),
                    (FundCategory::Emergency, 1000),
                ],
            },
            &[],
            "treasury",
            None,
        )
        .unwrap();

    // ── 3. Voting (points to credential registry + treasury) ────────────
    let voting_addr = app
        .instantiate_contract(
            voting_code_id,
            admin.clone(),
            &voting::msg::InstantiateMsg {
                admin: admin.to_string(),
                credential_registry: cred_addr.to_string(),
                treasury_contract: treasury_addr.to_string(),
                voting_period: 100,
                quorum_bps: 1000,    // 10%
                threshold_bps: 5000, // 50%
                timelock_period: 0,  // no timelock for integration tests
            },
            &[],
            "voting",
            None,
        )
        .unwrap();

    // ── 4. Update treasury governance → voting contract ─────────────────
    app.execute_contract(
        admin.clone(),
        treasury_addr.clone(),
        &treasury::msg::ExecuteMsg::UpdateGovernance {
            governance_contract: voting_addr.to_string(),
        },
        &[],
    )
    .unwrap();

    // ── 5. Grants (points to governance + treasury) ─────────────────────
    let grants_addr = app
        .instantiate_contract(
            grants_code_id,
            admin.clone(),
            &grants::msg::InstantiateMsg {
                admin: admin.to_string(),
                governance_contract: voting_addr.to_string(),
                treasury_contract: treasury_addr.to_string(),
            },
            &[],
            "grants",
            None,
        )
        .unwrap();

    // ── 6. Staking Emissions (points to treasury) ───────────────────────
    let staking_addr = app
        .instantiate_contract(
            staking_code_id,
            admin.clone(),
            &staking_emissions::msg::InstantiateMsg {
                admin: admin.to_string(),
                max_supply: Uint128::new(1_000_000_000_000),
                initial_supply: Uint128::new(100_000_000_000),
                denom: "ucitizen".to_string(),
                phases: vec![staking_emissions::msg::EmissionPhase {
                    label: "Year 1".to_string(),
                    start_block: 0,
                    end_block: 5_256_000,
                    tokens_per_block: Uint128::new(100_000),
                }],
                treasury: treasury_addr.to_string(),
                treasury_share_bps: 2000, // 20%
                slash_penalty_bps: 1000,  // 10%
            },
            &[],
            "staking-emissions",
            None,
        )
        .unwrap();

    let system = DeployedSystem {
        admin,
        citizen1,
        citizen2,
        citizen3,
        credential_registry: cred_addr,
        treasury: treasury_addr,
        voting: voting_addr,
        grants: grants_addr,
        staking: staking_addr,
    };

    (app, system)
}

/// Issue a citizenship credential to a holder via the admin issuer
pub fn issue_citizenship(app: &mut App, system: &DeployedSystem, holder: &Addr) -> String {
    let res = app
        .execute_contract(
            system.admin.clone(),
            system.credential_registry.clone(),
            &credential_registry::msg::ExecuteMsg::IssueCredential {
                holder: holder.to_string(),
                credential_type: citizen_common::credential::CredentialType::Citizenship,
                commitment: "test_commitment_hash_for_integration".to_string(),
                expires_at: 0, // no expiry
            },
            &[],
        )
        .unwrap();

    // Extract credential_id from attributes
    res.events
        .iter()
        .flat_map(|e| e.attributes.iter())
        .find(|a| a.key == "credential_id")
        .map(|a| a.value.clone())
        .unwrap_or_default()
}

/// Fund the treasury with ucitizen from admin
pub fn fund_treasury(app: &mut App, system: &DeployedSystem, amount: u128) {
    app.execute_contract(
        system.admin.clone(),
        system.treasury.clone(),
        &treasury::msg::ExecuteMsg::Deposit {},
        &[Coin {
            denom: "ucitizen".to_string(),
            amount: Uint128::new(amount),
        }],
    )
    .unwrap();
}
