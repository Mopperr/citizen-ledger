use citizen_common::errors::ContractError;
pub type ContractResult<T> = Result<T, ContractError>;
