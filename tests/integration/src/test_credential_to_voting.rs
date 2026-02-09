// ─────────────────────────────────────────────────────────────────────────────
// Integration: Credential Registry → Voting (credential-gated proposals & votes)
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use crate::helpers::*;
    use cosmwasm_std::Uint128;
    use cw_multi_test::Executor;
    use citizen_common::governance::{VoteOption, VotingMethod};

    #[test]
    fn citizen_with_credential_can_create_proposal() {
        let (mut app, system) = deploy_full_system();

        // Issue citizenship to citizen1
        issue_citizenship(&mut app, &system, &system.citizen1.clone());

        // citizen1 creates a proposal
        let res = app.execute_contract(
            system.citizen1.clone(),
            system.voting.clone(),
            &voting::msg::ExecuteMsg::CreateProposal {
                title: "Fund community garden".to_string(),
                description: "Allocate 1M ucitizen for new community gardens".to_string(),
                voting_method: VotingMethod::OnePersonOneVote,
                voting_period: None,
            },
            &[],
        );

        assert!(res.is_ok(), "Credentialed citizen should create proposal");

        // Verify proposal exists
        let proposal: voting::msg::ProposalResponse = app
            .wrap()
            .query_wasm_smart(
                system.voting.clone(),
                &voting::msg::QueryMsg::GetProposal { proposal_id: 1 },
            )
            .unwrap();

        assert_eq!(proposal.title, "Fund community garden");
        assert_eq!(proposal.proposer, system.citizen1.to_string());
        assert_eq!(proposal.status, "Active");
    }

    #[test]
    fn credentialed_citizens_can_vote_and_tally() {
        let (mut app, system) = deploy_full_system();

        // Issue credentials to all 3 citizens
        let c1 = system.citizen1.clone();
        let c2 = system.citizen2.clone();
        let c3 = system.citizen3.clone();
        issue_citizenship(&mut app, &system, &c1);
        issue_citizenship(&mut app, &system, &c2);
        issue_citizenship(&mut app, &system, &c3);

        // citizen1 creates proposal
        app.execute_contract(
            c1.clone(),
            system.voting.clone(),
            &voting::msg::ExecuteMsg::CreateProposal {
                title: "Build a school".to_string(),
                description: "Construct a school in district 5".to_string(),
                voting_method: VotingMethod::OnePersonOneVote,
                voting_period: Some(50), // 50 blocks
            },
            &[],
        )
        .unwrap();

        // All three vote Yes
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

        // Advance blocks past voting period
        app.update_block(|b| b.height += 51);

        // Tally
        let res = app.execute_contract(
            system.admin.clone(),
            system.voting.clone(),
            &voting::msg::ExecuteMsg::TallyProposal { proposal_id: 1 },
            &[],
        );
        assert!(res.is_ok());

        // Verify passed
        let proposal: voting::msg::ProposalResponse = app
            .wrap()
            .query_wasm_smart(
                system.voting.clone(),
                &voting::msg::QueryMsg::GetProposal { proposal_id: 1 },
            )
            .unwrap();
        assert_eq!(proposal.status, "Passed");
        assert_eq!(proposal.votes_for, Uint128::new(3));
    }

    #[test]
    fn proposal_rejected_when_majority_votes_no() {
        let (mut app, system) = deploy_full_system();

        let c1 = system.citizen1.clone();
        let c2 = system.citizen2.clone();
        let c3 = system.citizen3.clone();
        issue_citizenship(&mut app, &system, &c1);
        issue_citizenship(&mut app, &system, &c2);
        issue_citizenship(&mut app, &system, &c3);

        // Create proposal
        app.execute_contract(
            c1.clone(),
            system.voting.clone(),
            &voting::msg::ExecuteMsg::CreateProposal {
                title: "Bad proposal".to_string(),
                description: "Waste money".to_string(),
                voting_method: VotingMethod::OnePersonOneVote,
                voting_period: Some(50),
            },
            &[],
        )
        .unwrap();

        // 1 Yes, 2 No
        app.execute_contract(
            c1.clone(),
            system.voting.clone(),
            &voting::msg::ExecuteMsg::CastVote {
                proposal_id: 1,
                vote: VoteOption::Yes,
                tokens: None,
            },
            &[],
        )
        .unwrap();

        for citizen in [&c2, &c3] {
            app.execute_contract(
                citizen.clone(),
                system.voting.clone(),
                &voting::msg::ExecuteMsg::CastVote {
                    proposal_id: 1,
                    vote: VoteOption::No,
                    tokens: None,
                },
                &[],
            )
            .unwrap();
        }

        app.update_block(|b| b.height += 51);

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
        assert_eq!(proposal.status, "Rejected");
    }

    #[test]
    fn quadratic_voting_weights_correctly() {
        let (mut app, system) = deploy_full_system();

        let c1 = system.citizen1.clone();
        let c2 = system.citizen2.clone();
        issue_citizenship(&mut app, &system, &c1);
        issue_citizenship(&mut app, &system, &c2);

        // Create quadratic proposal
        app.execute_contract(
            c1.clone(),
            system.voting.clone(),
            &voting::msg::ExecuteMsg::CreateProposal {
                title: "Quadratic test".to_string(),
                description: "Testing quadratic voting weights".to_string(),
                voting_method: VotingMethod::Quadratic,
                voting_period: Some(50),
            },
            &[],
        )
        .unwrap();

        // citizen1 votes Yes with 100 tokens = sqrt(100) = 10 weight
        app.execute_contract(
            c1.clone(),
            system.voting.clone(),
            &voting::msg::ExecuteMsg::CastVote {
                proposal_id: 1,
                vote: VoteOption::Yes,
                tokens: Some(Uint128::new(100)),
            },
            &[],
        )
        .unwrap();

        // citizen2 votes No with 9 tokens = sqrt(9) = 3 weight
        app.execute_contract(
            c2.clone(),
            system.voting.clone(),
            &voting::msg::ExecuteMsg::CastVote {
                proposal_id: 1,
                vote: VoteOption::No,
                tokens: Some(Uint128::new(9)),
            },
            &[],
        )
        .unwrap();

        app.update_block(|b| b.height += 51);

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

        // 10 Yes vs 3 No → Passed
        assert_eq!(proposal.status, "Passed");
        assert_eq!(proposal.votes_for, Uint128::new(10));
        assert_eq!(proposal.votes_against, Uint128::new(3));
    }
}
