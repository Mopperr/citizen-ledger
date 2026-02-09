// ─────────────────────────────────────────────────────────────────────────────
// Integration: Full system end-to-end flow
// Credential → Proposal → Vote → Tally → Execute → Treasury deposit check
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use crate::helpers::*;
    use cosmwasm_std::Uint128;
    use cw_multi_test::Executor;
    use citizen_common::credential::CredentialType;
    use citizen_common::governance::{VoteOption, VotingMethod};

    #[test]
    fn full_citizen_lifecycle_credential_to_vote_to_execute() {
        let (mut app, system) = deploy_full_system();

        // ── Step 1: Issue credentials ───────────────────────────────────
        let c1 = system.citizen1.clone();
        let c2 = system.citizen2.clone();
        let c3 = system.citizen3.clone();

        let cred_id_1 = issue_citizenship(&mut app, &system, &c1);
        let cred_id_2 = issue_citizenship(&mut app, &system, &c2);
        let cred_id_3 = issue_citizenship(&mut app, &system, &c3);

        // Verify all credentials exist
        assert!(!cred_id_1.is_empty());
        assert!(!cred_id_2.is_empty());
        assert!(!cred_id_3.is_empty());

        // Query credential registry
        let has_cred: credential_registry::msg::HasCredentialResponse = app
            .wrap()
            .query_wasm_smart(
                system.credential_registry.clone(),
                &credential_registry::msg::QueryMsg::HasValidCredential {
                    holder: c1.to_string(),
                    credential_type: CredentialType::Citizenship,
                },
            )
            .unwrap();
        assert!(has_cred.has_credential);

        // ── Step 2: Fund treasury ───────────────────────────────────────
        fund_treasury(&mut app, &system, 50_000_000);

        // ── Step 3: Create proposal ─────────────────────────────────────
        app.execute_contract(
            c1.clone(),
            system.voting.clone(),
            &voting::msg::ExecuteMsg::CreateProposal {
                title: "Improve water system".to_string(),
                description: "Upgrade district 3 water treatment".to_string(),
                voting_method: VotingMethod::OnePersonOneVote,
                voting_period: Some(100),
            },
            &[],
        )
        .unwrap();

        // ── Step 4: All citizens vote ───────────────────────────────────
        for citizen in [&c1, &c2, &c3] {
            app.execute_contract(
                citizen.clone(),
                system.voting.clone(),
                &voting::msg::ExecuteMsg::CastVote {
                    proposal_id: 1,
                    vote: VoteOption::Yes,
                    tokens: None,
                },
                &[],
            )
            .unwrap();
        }

        // Verify vote counts
        let proposal: voting::msg::ProposalResponse = app
            .wrap()
            .query_wasm_smart(
                system.voting.clone(),
                &voting::msg::QueryMsg::GetProposal { proposal_id: 1 },
            )
            .unwrap();
        assert_eq!(proposal.votes_for, Uint128::new(3));
        assert_eq!(proposal.votes_against, Uint128::zero());

        // ── Step 5: Advance time and tally ──────────────────────────────
        app.update_block(|b| b.height += 101);

        app.execute_contract(
            system.admin.clone(),
            system.voting.clone(),
            &voting::msg::ExecuteMsg::TallyProposal { proposal_id: 1 },
            &[],
        )
        .unwrap();

        let proposal: voting::msg::ProposalResponse = app
            .wrap()
            .query_wasm_smart(
                system.voting.clone(),
                &voting::msg::QueryMsg::GetProposal { proposal_id: 1 },
            )
            .unwrap();
        assert_eq!(proposal.status, "Passed");

        // ── Step 6: Execute passed proposal ─────────────────────────────
        app.execute_contract(
            system.admin.clone(),
            system.voting.clone(),
            &voting::msg::ExecuteMsg::ExecuteProposal { proposal_id: 1 },
            &[],
        )
        .unwrap();

        let proposal: voting::msg::ProposalResponse = app
            .wrap()
            .query_wasm_smart(
                system.voting.clone(),
                &voting::msg::QueryMsg::GetProposal { proposal_id: 1 },
            )
            .unwrap();
        assert_eq!(proposal.status, "Executed");
    }

    #[test]
    fn staking_and_emission_phases() {
        let (mut app, system) = deploy_full_system();

        // Query initial supply stats
        let supply: staking_emissions::msg::SupplyResponse = app
            .wrap()
            .query_wasm_smart(
                system.staking.clone(),
                &staking_emissions::msg::QueryMsg::Supply {},
            )
            .unwrap();
        assert_eq!(supply.max_supply, Uint128::new(1_000_000_000_000));
        assert_eq!(supply.total_staked, Uint128::zero());

        // Query emission rate
        let rate: staking_emissions::msg::EmissionRateResponse = app
            .wrap()
            .query_wasm_smart(
                system.staking.clone(),
                &staking_emissions::msg::QueryMsg::CurrentEmissionRate {},
            )
            .unwrap();
        assert_eq!(rate.current_phase, "Year 1");
        assert_eq!(rate.tokens_per_block, Uint128::new(100_000));
    }

    #[test]
    fn credential_revocation_independence() {
        let (mut app, system) = deploy_full_system();

        let c1 = system.citizen1.clone();
        let cred_id = issue_citizenship(&mut app, &system, &c1);

        // Verify credential exists
        let cred: credential_registry::msg::CredentialResponse = app
            .wrap()
            .query_wasm_smart(
                system.credential_registry.clone(),
                &credential_registry::msg::QueryMsg::GetCredential {
                    credential_id: cred_id.clone(),
                },
            )
            .unwrap();
        assert!(!cred.revoked);

        // Revoke
        app.execute_contract(
            system.admin.clone(),
            system.credential_registry.clone(),
            &credential_registry::msg::ExecuteMsg::RevokeCredential {
                credential_id: cred_id.clone(),
                reason: "Fraudulent documentation".to_string(),
            },
            &[],
        )
        .unwrap();

        // Verify revoked
        let cred: credential_registry::msg::CredentialResponse = app
            .wrap()
            .query_wasm_smart(
                system.credential_registry.clone(),
                &credential_registry::msg::QueryMsg::GetCredential {
                    credential_id: cred_id,
                },
            )
            .unwrap();
        assert!(cred.revoked);
    }

    #[test]
    fn multi_contract_config_consistency() {
        let (app, system) = deploy_full_system();

        // Verify voting points to correct credential registry
        let voting_config: voting::msg::VotingConfigResponse = app
            .wrap()
            .query_wasm_smart(
                system.voting.clone(),
                &voting::msg::QueryMsg::Config {},
            )
            .unwrap();
        assert_eq!(
            voting_config.credential_registry,
            system.credential_registry.to_string()
        );
        assert_eq!(
            voting_config.treasury_contract,
            system.treasury.to_string()
        );

        // Verify treasury governance points to voting
        let treasury_config: treasury::msg::TreasuryConfigResponse = app
            .wrap()
            .query_wasm_smart(
                system.treasury.clone(),
                &treasury::msg::QueryMsg::Config {},
            )
            .unwrap();
        assert_eq!(
            treasury_config.governance_contract,
            system.voting.to_string()
        );

        // Verify grants points to governance + treasury
        let grants_config: grants::msg::GrantConfigResponse = app
            .wrap()
            .query_wasm_smart(
                system.grants.clone(),
                &grants::msg::QueryMsg::Config {},
            )
            .unwrap();
        assert_eq!(
            grants_config.governance_contract,
            system.voting.to_string()
        );
        assert_eq!(
            grants_config.treasury_contract,
            system.treasury.to_string()
        );

        // Verify staking points to treasury
        let staking_config: staking_emissions::msg::StakingConfigResponse = app
            .wrap()
            .query_wasm_smart(
                system.staking.clone(),
                &staking_emissions::msg::QueryMsg::Config {},
            )
            .unwrap();
        assert_eq!(
            staking_config.treasury,
            system.treasury.to_string()
        );
    }
}
