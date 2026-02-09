use cosmwasm_std::{
    entry_point, to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Order, Response,
    StdResult,
};
use cw2::set_contract_version;
use sha2::{Digest, Sha256};

use citizen_common::credential::{Credential, CredentialType, ZkProof};
use citizen_common::errors::ContractError;

use crate::msg::*;
use crate::state::*;

const CONTRACT_NAME: &str = "crates.io:credential-registry";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

// ── Instantiate ─────────────────────────────────────────────────────

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

    let admin = deps.api.addr_validate(&msg.admin)?;
    ADMIN.save(deps.storage, &admin)?;
    CREDENTIAL_COUNT.save(deps.storage, &0u64)?;
    RECOVERY_TIMELOCK.save(deps.storage, &10080u64)?; // ~7 days at 6s blocks

    for issuer_str in &msg.issuers {
        let issuer = deps.api.addr_validate(issuer_str)?;
        ISSUERS.save(deps.storage, &issuer, &true)?;
    }

    Ok(Response::new()
        .add_attribute("action", "instantiate")
        .add_attribute("admin", admin.as_str())
        .add_attribute("issuers_count", msg.issuers.len().to_string()))
}

// ── Execute ─────────────────────────────────────────────────────────

#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::IssueCredential {
            holder,
            credential_type,
            commitment,
            expires_at,
        } => execute_issue(
            deps,
            env,
            info,
            holder,
            credential_type,
            commitment,
            expires_at,
        ),
        ExecuteMsg::VerifyCredential {
            credential_id,
            proof,
        } => execute_verify(deps, env, info, credential_id, proof),
        ExecuteMsg::RevokeCredential {
            credential_id,
            reason,
        } => execute_revoke(deps, env, info, credential_id, reason),
        ExecuteMsg::AddIssuer { issuer } => execute_add_issuer(deps, info, issuer),
        ExecuteMsg::RemoveIssuer { issuer } => execute_remove_issuer(deps, info, issuer),
        ExecuteMsg::TransferAdmin { new_admin } => execute_transfer_admin(deps, info, new_admin),
        ExecuteMsg::SubmitVerificationResult {
            request_id,
            applicant,
            credential_type,
            commitment,
            approved,
        } => execute_submit_verification(
            deps,
            env,
            info,
            request_id,
            applicant,
            credential_type,
            commitment,
            approved,
        ),
        ExecuteMsg::RequestKeyRecovery {
            old_address,
            reverification_id,
        } => execute_request_recovery(deps, env, info, old_address, reverification_id),
        ExecuteMsg::ExecuteRecovery { recovery_id } => {
            execute_execute_recovery(deps, env, info, recovery_id)
        }
        ExecuteMsg::ContestRecovery { recovery_id } => {
            execute_contest_recovery(deps, info, recovery_id)
        }
    }
}

fn execute_issue(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    holder: String,
    credential_type: CredentialType,
    commitment: String,
    expires_at: u64,
) -> Result<Response, ContractError> {
    // Only trusted issuers can issue credentials
    let is_issuer = ISSUERS
        .may_load(deps.storage, &info.sender)?
        .unwrap_or(false);
    if !is_issuer {
        return Err(ContractError::IssuerNotAuthorized {
            issuer: info.sender.to_string(),
        });
    }

    let holder_addr = deps.api.addr_validate(&holder)?;

    // Generate a deterministic credential ID
    let mut hasher = Sha256::new();
    hasher.update(holder.as_bytes());
    hasher.update(credential_type.to_string().as_bytes());
    hasher.update(commitment.as_bytes());
    hasher.update(env.block.time.seconds().to_le_bytes());
    let cred_id = hex::encode(hasher.finalize())[..32].to_string();

    // Check for duplicate
    if CREDENTIALS.has(deps.storage, &cred_id) {
        return Err(ContractError::CredentialAlreadyExists { id: cred_id });
    }

    let credential = Credential {
        id: cred_id.clone(),
        holder: holder_addr.clone(),
        credential_type: credential_type.clone(),
        commitment,
        issuer: info.sender.clone(),
        issued_at: env.block.time.seconds(),
        expires_at,
        revoked: false,
    };

    CREDENTIALS.save(deps.storage, &cred_id, &credential)?;
    HOLDER_CREDENTIALS.save(deps.storage, (&holder_addr, &cred_id), &true)?;

    let count = CREDENTIAL_COUNT.load(deps.storage)?;
    CREDENTIAL_COUNT.save(deps.storage, &(count + 1))?;

    Ok(Response::new()
        .add_attribute("action", "issue_credential")
        .add_attribute("credential_id", &cred_id)
        .add_attribute("holder", holder)
        .add_attribute("type", credential_type.to_string())
        .add_attribute("issuer", info.sender.as_str()))
}

fn execute_verify(
    deps: DepsMut,
    env: Env,
    _info: MessageInfo,
    credential_id: String,
    proof: ZkProof,
) -> Result<Response, ContractError> {
    let cred = CREDENTIALS.may_load(deps.storage, &credential_id)?.ok_or(
        ContractError::CredentialNotFound {
            id: credential_id.clone(),
        },
    )?;

    if cred.revoked {
        return Err(ContractError::CredentialRevoked);
    }

    if cred.expires_at > 0 && env.block.time.seconds() > cred.expires_at {
        return Err(ContractError::CredentialExpired);
    }

    // ── ZK Proof verification placeholder ──
    // In production, this would call a ZK verifier (e.g., Groth16 on-chain verifier).
    // For now, we do a simplified hash-based check: the proof_data must hash to
    // the credential's commitment.
    let mut hasher = Sha256::new();
    hasher.update(proof.proof_data.as_bytes());
    for input in &proof.public_inputs {
        hasher.update(input.as_bytes());
    }
    let computed = hex::encode(hasher.finalize())[..32].to_string();

    if computed != cred.commitment[..computed.len().min(cred.commitment.len())] {
        return Err(ContractError::InvalidProof {
            reason: "Proof commitment mismatch".to_string(),
        });
    }

    Ok(Response::new()
        .add_attribute("action", "verify_credential")
        .add_attribute("credential_id", credential_id)
        .add_attribute("valid", "true"))
}

fn execute_revoke(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    credential_id: String,
    reason: String,
) -> Result<Response, ContractError> {
    let mut cred = CREDENTIALS.may_load(deps.storage, &credential_id)?.ok_or(
        ContractError::CredentialNotFound {
            id: credential_id.clone(),
        },
    )?;

    // Only the original issuer or admin can revoke
    let admin = ADMIN.load(deps.storage)?;
    if info.sender != cred.issuer && info.sender != admin {
        return Err(ContractError::Unauthorized {
            reason: "Only issuer or admin can revoke".to_string(),
        });
    }

    cred.revoked = true;
    CREDENTIALS.save(deps.storage, &credential_id, &cred)?;

    Ok(Response::new()
        .add_attribute("action", "revoke_credential")
        .add_attribute("credential_id", credential_id)
        .add_attribute("reason", reason))
}

fn execute_add_issuer(
    deps: DepsMut,
    info: MessageInfo,
    issuer: String,
) -> Result<Response, ContractError> {
    let admin = ADMIN.load(deps.storage)?;
    if info.sender != admin {
        return Err(ContractError::Unauthorized {
            reason: "Only admin can add issuers".to_string(),
        });
    }

    let issuer_addr = deps.api.addr_validate(&issuer)?;
    ISSUERS.save(deps.storage, &issuer_addr, &true)?;

    Ok(Response::new()
        .add_attribute("action", "add_issuer")
        .add_attribute("issuer", issuer))
}

fn execute_remove_issuer(
    deps: DepsMut,
    info: MessageInfo,
    issuer: String,
) -> Result<Response, ContractError> {
    let admin = ADMIN.load(deps.storage)?;
    if info.sender != admin {
        return Err(ContractError::Unauthorized {
            reason: "Only admin can remove issuers".to_string(),
        });
    }

    let issuer_addr = deps.api.addr_validate(&issuer)?;
    ISSUERS.remove(deps.storage, &issuer_addr);

    Ok(Response::new()
        .add_attribute("action", "remove_issuer")
        .add_attribute("issuer", issuer))
}

fn execute_transfer_admin(
    deps: DepsMut,
    info: MessageInfo,
    new_admin: String,
) -> Result<Response, ContractError> {
    let admin = ADMIN.load(deps.storage)?;
    if info.sender != admin {
        return Err(ContractError::Unauthorized {
            reason: "Only admin can transfer admin role".to_string(),
        });
    }

    let new_admin_addr = deps.api.addr_validate(&new_admin)?;
    ADMIN.save(deps.storage, &new_admin_addr)?;

    Ok(Response::new()
        .add_attribute("action", "transfer_admin")
        .add_attribute("new_admin", new_admin))
}

// ── Query ───────────────────────────────────────────────────────────

#[entry_point]
pub fn query(deps: Deps, env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetCredential { credential_id } => {
            to_json_binary(&query_credential(deps, credential_id)?)
        }
        QueryMsg::HasValidCredential {
            holder,
            credential_type,
        } => to_json_binary(&query_has_valid(deps, env, holder, credential_type)?),
        QueryMsg::ListCredentials {
            holder,
            start_after,
            limit,
        } => to_json_binary(&query_list(deps, holder, start_after, limit)?),
        QueryMsg::ListIssuers {} => to_json_binary(&query_issuers(deps)?),
        QueryMsg::Config {} => to_json_binary(&query_config(deps)?),
        QueryMsg::GetRecovery { recovery_id } => {
            to_json_binary(&query_recovery(deps, recovery_id)?)
        }
    }
}

fn query_credential(deps: Deps, credential_id: String) -> StdResult<CredentialResponse> {
    let cred = CREDENTIALS.load(deps.storage, &credential_id)?;
    Ok(CredentialResponse {
        id: cred.id,
        holder: cred.holder.to_string(),
        credential_type: cred.credential_type,
        commitment: cred.commitment,
        issuer: cred.issuer.to_string(),
        issued_at: cred.issued_at,
        expires_at: cred.expires_at,
        revoked: cred.revoked,
    })
}

fn query_has_valid(
    deps: Deps,
    env: Env,
    holder: String,
    credential_type: CredentialType,
) -> StdResult<HasCredentialResponse> {
    let holder_addr = deps.api.addr_validate(&holder)?;
    let type_str = credential_type.to_string();
    let now = env.block.time.seconds();

    // Iterate over holder's credentials to find a valid one of the requested type
    let creds: Vec<_> = HOLDER_CREDENTIALS
        .prefix(&holder_addr)
        .range(deps.storage, None, None, Order::Ascending)
        .collect::<StdResult<Vec<_>>>()?;

    for (cred_id, _) in creds {
        if let Ok(cred) = CREDENTIALS.load(deps.storage, &cred_id) {
            if cred.credential_type.to_string() == type_str
                && !cred.revoked
                && (cred.expires_at == 0 || cred.expires_at > now)
            {
                return Ok(HasCredentialResponse {
                    has_credential: true,
                    credential_id: Some(cred.id),
                });
            }
        }
    }

    Ok(HasCredentialResponse {
        has_credential: false,
        credential_id: None,
    })
}

fn query_list(
    deps: Deps,
    holder: String,
    _start_after: Option<String>,
    limit: Option<u32>,
) -> StdResult<CredentialsListResponse> {
    let holder_addr = deps.api.addr_validate(&holder)?;
    let limit = limit.unwrap_or(30).min(100) as usize;

    let creds: Vec<_> = HOLDER_CREDENTIALS
        .prefix(&holder_addr)
        .range(deps.storage, None, None, Order::Ascending)
        .take(limit)
        .filter_map(|r| r.ok())
        .filter_map(|(cred_id, _)| {
            CREDENTIALS
                .load(deps.storage, &cred_id)
                .ok()
                .map(|c| CredentialResponse {
                    id: c.id,
                    holder: c.holder.to_string(),
                    credential_type: c.credential_type,
                    commitment: c.commitment,
                    issuer: c.issuer.to_string(),
                    issued_at: c.issued_at,
                    expires_at: c.expires_at,
                    revoked: c.revoked,
                })
        })
        .collect();

    Ok(CredentialsListResponse { credentials: creds })
}

fn query_issuers(deps: Deps) -> StdResult<IssuersResponse> {
    let issuers: Vec<String> = ISSUERS
        .range(deps.storage, None, None, Order::Ascending)
        .filter_map(|r| r.ok())
        .map(|(addr, _)| addr.to_string())
        .collect();
    Ok(IssuersResponse { issuers })
}

fn query_config(deps: Deps) -> StdResult<ConfigResponse> {
    let admin = ADMIN.load(deps.storage)?;
    let count = CREDENTIAL_COUNT.load(deps.storage)?;
    Ok(ConfigResponse {
        admin: admin.to_string(),
        total_credentials: count,
    })
}

fn query_recovery(deps: Deps, recovery_id: String) -> StdResult<RecoveryResponse> {
    let r = RECOVERIES.load(deps.storage, &recovery_id)?;
    Ok(RecoveryResponse {
        recovery_id: r.recovery_id,
        old_address: r.old_address.to_string(),
        new_address: r.new_address.to_string(),
        status: format!("{:?}", r.status),
        requested_at: r.requested_at,
        execute_after: r.execute_after,
    })
}

// ── Verification Relay ──────────────────────────────────────────────

#[allow(clippy::too_many_arguments)]
fn execute_submit_verification(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    request_id: String,
    applicant: String,
    credential_type: CredentialType,
    commitment: String,
    approved: bool,
) -> Result<Response, ContractError> {
    // Only admin or authorized relayers can submit verification results
    let admin = ADMIN.load(deps.storage)?;
    let is_relayer = AUTHORIZED_RELAYERS
        .may_load(deps.storage, &info.sender)?
        .unwrap_or(false);
    if info.sender != admin && !is_relayer {
        return Err(ContractError::Unauthorized {
            reason: "Only admin or authorized relayer can submit verification results".to_string(),
        });
    }

    if !approved {
        return Ok(Response::new()
            .add_attribute("action", "verification_rejected")
            .add_attribute("request_id", request_id)
            .add_attribute("applicant", applicant));
    }

    // Auto-issue credential upon successful verification
    let holder_addr = deps.api.addr_validate(&applicant)?;
    let count = CREDENTIAL_COUNT.load(deps.storage)?;
    let new_count = count + 1;

    let cred_id_raw = format!(
        "{}:{}:{}",
        applicant,
        credential_type,
        env.block.time.seconds()
    );
    let mut hasher = Sha256::new();
    hasher.update(cred_id_raw.as_bytes());
    let cred_id = hex::encode(hasher.finalize());

    let credential = Credential {
        id: cred_id.clone(),
        holder: holder_addr.clone(),
        credential_type: credential_type.clone(),
        commitment,
        issuer: info.sender.clone(),
        issued_at: env.block.time.seconds(),
        expires_at: 0, // no expiry for verified credentials
        revoked: false,
    };

    CREDENTIALS.save(deps.storage, &cred_id, &credential)?;
    HOLDER_CREDENTIALS.save(deps.storage, (&holder_addr, &cred_id), &true)?;
    CREDENTIAL_COUNT.save(deps.storage, &new_count)?;

    Ok(Response::new()
        .add_attribute("action", "verification_approved")
        .add_attribute("request_id", request_id)
        .add_attribute("credential_id", cred_id)
        .add_attribute("applicant", applicant))
}

// ── Key Recovery ────────────────────────────────────────────────────

fn execute_request_recovery(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    old_address: String,
    reverification_id: String,
) -> Result<Response, ContractError> {
    let old_addr = deps.api.addr_validate(&old_address)?;
    let timelock = RECOVERY_TIMELOCK.load(deps.storage)?;

    let recovery_id_raw = format!(
        "recovery:{}:{}:{}",
        old_address, info.sender, env.block.height
    );
    let mut hasher = Sha256::new();
    hasher.update(recovery_id_raw.as_bytes());
    let recovery_id = hex::encode(hasher.finalize());

    let recovery = StoredRecovery {
        recovery_id: recovery_id.clone(),
        old_address: old_addr,
        new_address: info.sender.clone(),
        reverification_id,
        status: StoredRecoveryStatus::TimelockWaiting,
        requested_at: env.block.height,
        execute_after: env.block.height + timelock,
    };

    RECOVERIES.save(deps.storage, &recovery_id, &recovery)?;

    Ok(Response::new()
        .add_attribute("action", "request_recovery")
        .add_attribute("recovery_id", recovery_id)
        .add_attribute("old_address", old_address)
        .add_attribute("new_address", info.sender.as_str())
        .add_attribute("execute_after", recovery.execute_after.to_string()))
}

fn execute_execute_recovery(
    deps: DepsMut,
    env: Env,
    _info: MessageInfo,
    recovery_id: String,
) -> Result<Response, ContractError> {
    let mut recovery =
        RECOVERIES
            .may_load(deps.storage, &recovery_id)?
            .ok_or(ContractError::Unauthorized {
                reason: "Recovery not found".to_string(),
            })?;

    if !matches!(recovery.status, StoredRecoveryStatus::TimelockWaiting) {
        return Err(ContractError::Unauthorized {
            reason: "Recovery is not in TimelockWaiting state".to_string(),
        });
    }

    if env.block.height < recovery.execute_after {
        return Err(ContractError::TimelockNotExpired {
            execute_at: recovery.execute_after,
        });
    }

    // Migrate all credentials from old address to new address
    let old_creds: Vec<String> = HOLDER_CREDENTIALS
        .prefix(&recovery.old_address)
        .range(deps.storage, None, None, Order::Ascending)
        .filter_map(|r| r.ok())
        .map(|(cred_id, _)| cred_id)
        .collect();

    for cred_id in &old_creds {
        // Update credential holder
        if let Ok(mut cred) = CREDENTIALS.load(deps.storage, cred_id) {
            cred.holder = recovery.new_address.clone();
            CREDENTIALS.save(deps.storage, cred_id, &cred)?;
        }
        // Move holder index
        HOLDER_CREDENTIALS.remove(deps.storage, (&recovery.old_address, cred_id));
        HOLDER_CREDENTIALS.save(deps.storage, (&recovery.new_address, cred_id), &true)?;
    }

    recovery.status = StoredRecoveryStatus::Executed;
    RECOVERIES.save(deps.storage, &recovery_id, &recovery)?;

    Ok(Response::new()
        .add_attribute("action", "execute_recovery")
        .add_attribute("recovery_id", recovery_id)
        .add_attribute("credentials_migrated", old_creds.len().to_string()))
}

fn execute_contest_recovery(
    deps: DepsMut,
    info: MessageInfo,
    recovery_id: String,
) -> Result<Response, ContractError> {
    let mut recovery =
        RECOVERIES
            .may_load(deps.storage, &recovery_id)?
            .ok_or(ContractError::Unauthorized {
                reason: "Recovery not found".to_string(),
            })?;

    // Only the old address can contest
    if info.sender != recovery.old_address {
        return Err(ContractError::Unauthorized {
            reason: "Only the original address owner can contest recovery".to_string(),
        });
    }

    if !matches!(recovery.status, StoredRecoveryStatus::TimelockWaiting) {
        return Err(ContractError::Unauthorized {
            reason: "Recovery is not in contestable state".to_string(),
        });
    }

    recovery.status = StoredRecoveryStatus::Contested;
    RECOVERIES.save(deps.storage, &recovery_id, &recovery)?;

    Ok(Response::new()
        .add_attribute("action", "contest_recovery")
        .add_attribute("recovery_id", recovery_id))
}

// ── Tests ───────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::testing::{message_info, mock_dependencies, mock_env, MockApi};

    fn setup_contract(deps: DepsMut) {
        let api = MockApi::default();
        let admin = api.addr_make("admin");
        let issuer1 = api.addr_make("issuer1");
        let creator = api.addr_make("creator");
        let msg = InstantiateMsg {
            admin: admin.to_string(),
            issuers: vec![issuer1.to_string()],
        };
        let info = message_info(&creator, &[]);
        instantiate(deps, mock_env(), info, msg).unwrap();
    }

    #[test]
    fn test_instantiate() {
        let mut deps = mock_dependencies();
        let admin = deps.api.addr_make("admin");
        setup_contract(deps.as_mut());

        let config = query_config(deps.as_ref()).unwrap();
        assert_eq!(config.admin, admin.to_string());
        assert_eq!(config.total_credentials, 0);
    }

    #[test]
    fn test_issue_credential() {
        let mut deps = mock_dependencies();
        let issuer1 = deps.api.addr_make("issuer1");
        let citizen1 = deps.api.addr_make("citizen1");
        setup_contract(deps.as_mut());

        let info = message_info(&issuer1, &[]);
        let msg = ExecuteMsg::IssueCredential {
            holder: citizen1.to_string(),
            credential_type: CredentialType::Citizenship,
            commitment: "abc123".to_string(),
            expires_at: 0,
        };
        let res = execute(deps.as_mut(), mock_env(), info, msg).unwrap();
        assert_eq!(res.attributes[0].value, "issue_credential");

        let config = query_config(deps.as_ref()).unwrap();
        assert_eq!(config.total_credentials, 1);
    }

    #[test]
    fn test_unauthorized_issuer() {
        let mut deps = mock_dependencies();
        let random = deps.api.addr_make("random");
        let citizen1 = deps.api.addr_make("citizen1");
        setup_contract(deps.as_mut());

        let info = message_info(&random, &[]);
        let msg = ExecuteMsg::IssueCredential {
            holder: citizen1.to_string(),
            credential_type: CredentialType::Citizenship,
            commitment: "abc123".to_string(),
            expires_at: 0,
        };
        let err = execute(deps.as_mut(), mock_env(), info, msg).unwrap_err();
        assert!(matches!(err, ContractError::IssuerNotAuthorized { .. }));
    }

    #[test]
    fn test_revoke_credential() {
        let mut deps = mock_dependencies();
        let issuer1 = deps.api.addr_make("issuer1");
        let citizen1 = deps.api.addr_make("citizen1");
        setup_contract(deps.as_mut());

        // Issue first
        let info = message_info(&issuer1, &[]);
        let msg = ExecuteMsg::IssueCredential {
            holder: citizen1.to_string(),
            credential_type: CredentialType::Citizenship,
            commitment: "abc123".to_string(),
            expires_at: 0,
        };
        let res = execute(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();
        let cred_id = res
            .attributes
            .iter()
            .find(|a| a.key == "credential_id")
            .unwrap()
            .value
            .clone();

        // Revoke
        let revoke_msg = ExecuteMsg::RevokeCredential {
            credential_id: cred_id.clone(),
            reason: "test revocation".to_string(),
        };
        execute(deps.as_mut(), mock_env(), info, revoke_msg).unwrap();

        let cred = query_credential(deps.as_ref(), cred_id).unwrap();
        assert!(cred.revoked);
    }

    #[test]
    fn test_add_remove_issuer() {
        let mut deps = mock_dependencies();
        let admin = deps.api.addr_make("admin");
        let issuer2 = deps.api.addr_make("issuer2");
        setup_contract(deps.as_mut());

        let admin_info = message_info(&admin, &[]);

        // Add issuer
        let msg = ExecuteMsg::AddIssuer {
            issuer: issuer2.to_string(),
        };
        execute(deps.as_mut(), mock_env(), admin_info.clone(), msg).unwrap();

        let issuers = query_issuers(deps.as_ref()).unwrap();
        assert_eq!(issuers.issuers.len(), 2);

        // Remove issuer
        let msg = ExecuteMsg::RemoveIssuer {
            issuer: issuer2.to_string(),
        };
        execute(deps.as_mut(), mock_env(), admin_info, msg).unwrap();

        let issuers = query_issuers(deps.as_ref()).unwrap();
        assert_eq!(issuers.issuers.len(), 1);
    }
}
