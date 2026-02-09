use cosmwasm_schema::cw_serde;
use cosmwasm_std::Uint128;
use crate::governance::VotingMethod;

// ─────────────────────────────────────────────────────────────────────────────
// Governance Proposal Templates – pre-built proposal types for common actions
// ─────────────────────────────────────────────────────────────────────────────

/// Well-known proposal template categories.
#[cw_serde]
pub enum ProposalTemplate {
    /// Spend funds from the treasury to a recipient
    TreasurySpend {
        recipient: String,
        amount: Uint128,
        denom: String,
        category: String,
        memo: String,
    },
    /// Change a governance parameter (voting period, quorum, threshold, timelock)
    ParameterChange {
        parameter: GovernanceParameter,
        new_value: u64,
        rationale: String,
    },
    /// Fund a grant application that has already been submitted
    GrantFunding {
        grant_id: u64,
        total_funding: Uint128,
        denom: String,
    },
    /// Add or remove an authorized credential issuer
    IssuerManagement {
        action: IssuerAction,
        issuer_address: String,
        justification: String,
    },
    /// Update emission schedule parameters
    EmissionUpdate {
        phase_index: u64,
        new_rate_per_block: Uint128,
        rationale: String,
    },
    /// Emergency action (shorter timelock, higher quorum requirement)
    Emergency {
        action: String,
        description: String,
    },
    /// Free-form text proposal (signalling / discussion)
    TextProposal {
        summary: String,
    },
}

/// Governance parameters that can be changed via proposal.
#[cw_serde]
pub enum GovernanceParameter {
    VotingPeriod,
    QuorumBps,
    ThresholdBps,
    TimelockPeriod,
}

/// Actions for credential issuer management proposals.
#[cw_serde]
pub enum IssuerAction {
    Add,
    Remove,
}

/// Metadata attached to a proposal template for display / indexing.
#[cw_serde]
pub struct TemplateMetadata {
    pub template: ProposalTemplate,
    /// Suggested voting method for this kind of proposal
    pub suggested_voting_method: VotingMethod,
    /// Recommended minimum voting period in blocks (0 = use default)
    pub min_voting_period: u64,
    /// Whether this template requires an elevated quorum (e.g., emergency)
    pub elevated_quorum: bool,
}

impl ProposalTemplate {
    /// Human-readable label for the template type.
    pub fn label(&self) -> &str {
        match self {
            ProposalTemplate::TreasurySpend { .. } => "Treasury Spend",
            ProposalTemplate::ParameterChange { .. } => "Parameter Change",
            ProposalTemplate::GrantFunding { .. } => "Grant Funding",
            ProposalTemplate::IssuerManagement { .. } => "Issuer Management",
            ProposalTemplate::EmissionUpdate { .. } => "Emission Update",
            ProposalTemplate::Emergency { .. } => "Emergency Action",
            ProposalTemplate::TextProposal { .. } => "Text / Signal",
        }
    }

    /// Auto-generate a proposal title from template fields.
    pub fn auto_title(&self) -> String {
        match self {
            ProposalTemplate::TreasurySpend { recipient, amount, denom, .. } => {
                format!("Spend {} {} to {}", amount, denom, recipient)
            }
            ProposalTemplate::ParameterChange { parameter, new_value, .. } => {
                format!("Set {:?} to {}", parameter, new_value)
            }
            ProposalTemplate::GrantFunding { grant_id, total_funding, denom } => {
                format!("Fund grant #{} with {} {}", grant_id, total_funding, denom)
            }
            ProposalTemplate::IssuerManagement { action, issuer_address, .. } => {
                format!("{:?} issuer {}", action, issuer_address)
            }
            ProposalTemplate::EmissionUpdate { phase_index, new_rate_per_block, .. } => {
                format!("Update phase {} emission to {} /block", phase_index, new_rate_per_block)
            }
            ProposalTemplate::Emergency { action, .. } => {
                format!("EMERGENCY: {}", action)
            }
            ProposalTemplate::TextProposal { summary } => {
                format!("Signal: {}", summary)
            }
        }
    }

    /// Auto-generate a proposal description from template fields.
    pub fn auto_description(&self) -> String {
        match self {
            ProposalTemplate::TreasurySpend { recipient, amount, denom, category, memo } => {
                format!(
                    "Authorize spending {} {} from the treasury to {}.\nCategory: {}\nMemo: {}",
                    amount, denom, recipient, category, memo
                )
            }
            ProposalTemplate::ParameterChange { parameter, new_value, rationale } => {
                format!(
                    "Change governance parameter {:?} to {}.\nRationale: {}",
                    parameter, new_value, rationale
                )
            }
            ProposalTemplate::GrantFunding { grant_id, total_funding, denom } => {
                format!(
                    "Approve funding of {} {} for grant application #{}.",
                    total_funding, denom, grant_id
                )
            }
            ProposalTemplate::IssuerManagement { action, issuer_address, justification } => {
                format!(
                    "{:?} credential issuer {}.\nJustification: {}",
                    action, issuer_address, justification
                )
            }
            ProposalTemplate::EmissionUpdate { phase_index, new_rate_per_block, rationale } => {
                format!(
                    "Update emission phase {} rate to {} per block.\nRationale: {}",
                    phase_index, new_rate_per_block, rationale
                )
            }
            ProposalTemplate::Emergency { action, description } => {
                format!("EMERGENCY ACTION: {}\n\n{}", action, description)
            }
            ProposalTemplate::TextProposal { summary } => summary.clone(),
        }
    }
}
