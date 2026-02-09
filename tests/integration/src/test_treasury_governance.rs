// ─────────────────────────────────────────────────────────────────────────────
// Integration: Treasury ← Governance spending authorization
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use crate::helpers::*;
    use cosmwasm_std::Uint128;
    use cw_multi_test::Executor;
    use citizen_common::treasury::FundCategory;

    #[test]
    fn treasury_deposit_and_query_balance() {
        let (mut app, system) = deploy_full_system();

        // Fund treasury
        fund_treasury(&mut app, &system, 5_000_000);

        // Query balance
        let balance: treasury::msg::BalanceResponse = app
            .wrap()
            .query_wasm_smart(
                system.treasury.clone(),
                &treasury::msg::QueryMsg::Balance {},
            )
            .unwrap();

        assert_eq!(balance.denom, "ucitizen");
        assert_eq!(balance.total, Uint128::new(5_000_000));
    }

    #[test]
    fn only_governance_can_spend_from_treasury() {
        let (mut app, system) = deploy_full_system();
        fund_treasury(&mut app, &system, 10_000_000);

        // Direct spend from admin should fail (governance is the voting contract now)
        let res = app.execute_contract(
            system.admin.clone(),
            system.treasury.clone(),
            &treasury::msg::ExecuteMsg::Spend {
                recipient: system.citizen1.to_string(),
                amount: Uint128::new(1_000),
                category: FundCategory::Research,
                memo: "Test spend".to_string(),
            },
            &[],
        );

        assert!(res.is_err(), "Admin should not be able to spend directly — governance required");
    }

    #[test]
    fn governance_authorized_spend_succeeds() {
        let (mut app, system) = deploy_full_system();
        fund_treasury(&mut app, &system, 10_000_000);

        // The voting contract is the governance; execute spend from its address
        let res = app.execute_contract(
            system.voting.clone(),
            system.treasury.clone(),
            &treasury::msg::ExecuteMsg::Spend {
                recipient: system.citizen1.to_string(),
                amount: Uint128::new(500_000),
                category: FundCategory::Infrastructure,
                memo: "Road repair project".to_string(),
            },
            &[],
        );

        assert!(res.is_ok(), "Governance (voting) should authorize treasury spends");

        // Check spend was recorded
        let config: treasury::msg::TreasuryConfigResponse = app
            .wrap()
            .query_wasm_smart(
                system.treasury.clone(),
                &treasury::msg::QueryMsg::Config {},
            )
            .unwrap();
        assert_eq!(config.total_spent, Uint128::new(500_000));

        // Check citizen1 received funds
        let citizen_balance = app
            .wrap()
            .query_balance(system.citizen1.clone(), "ucitizen")
            .unwrap();
        // 10B initial + 500K from treasury
        assert_eq!(citizen_balance.amount, Uint128::new(10_000_000_000 + 500_000));
    }

    #[test]
    fn spend_history_tracked_correctly() {
        let (mut app, system) = deploy_full_system();
        fund_treasury(&mut app, &system, 50_000_000);

        // Make 3 spends from governance
        let spends = vec![
            (FundCategory::Infrastructure, 1_000_000u128, "Road"),
            (FundCategory::Education, 2_000_000u128, "School supplies"),
            (FundCategory::Healthcare, 500_000u128, "Clinic equipment"),
        ];

        for (cat, amount, memo) in &spends {
            app.execute_contract(
                system.voting.clone(),
                system.treasury.clone(),
                &treasury::msg::ExecuteMsg::Spend {
                    recipient: system.citizen1.to_string(),
                    amount: Uint128::new(*amount),
                    category: cat.clone(),
                    memo: memo.to_string(),
                },
                &[],
            )
            .unwrap();
        }

        // Query spend history
        let history: treasury::msg::SpendHistoryResponse = app
            .wrap()
            .query_wasm_smart(
                system.treasury.clone(),
                &treasury::msg::QueryMsg::SpendHistory {
                    start_after: None,
                    limit: None,
                },
            )
            .unwrap();

        assert_eq!(history.records.len(), 3);
        assert_eq!(history.records[0].memo, "Road");
        assert_eq!(history.records[1].amount, Uint128::new(2_000_000));
        assert_eq!(history.records[2].memo, "Clinic equipment");

        // Check category spending
        let cat_spend: treasury::msg::CategorySpendResponse = app
            .wrap()
            .query_wasm_smart(
                system.treasury.clone(),
                &treasury::msg::QueryMsg::CategorySpend {
                    category: FundCategory::Education,
                },
            )
            .unwrap();
        assert_eq!(cat_spend.total_spent, Uint128::new(2_000_000));
    }
}
