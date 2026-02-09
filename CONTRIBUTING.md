# Contributing to Citizen Ledger

Thank you for your interest in contributing! This document provides guidelines and information for contributors.

## Code of Conduct

Be respectful, inclusive, and constructive. We're building tools for democratic participation — our community should reflect those values.

## Getting Started

### Prerequisites

- **Rust** ≥ 1.80 with `wasm32-unknown-unknown` target
- **Node.js** ≥ 18
- **Git** with GPG signing configured (recommended)

### Setup

```bash
# Clone the repository
git clone https://github.com/Mopperr/citizen-ledger.git
cd citizen-ledger

# Install Rust WASM target
rustup target add wasm32-unknown-unknown

# Run tests
cargo test --workspace

# Build contracts
cargo build --target wasm32-unknown-unknown --release
```

## How to Contribute

### Reporting Bugs

1. Check [existing issues](https://github.com/Mopperr/citizen-ledger/issues) first
2. Use the bug report template
3. Include: steps to reproduce, expected vs actual behavior, environment details

### Suggesting Features

1. Open a [discussion](https://github.com/Mopperr/citizen-ledger/discussions) first
2. Describe the use case and proposed solution
3. Wait for community feedback before implementing

### Submitting Code

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feature/your-feature-name`
3. **Make changes** following our coding standards
4. **Write tests** for new functionality
5. **Run checks locally**:
   ```bash
   cargo test --workspace
   cargo clippy -- -D warnings
   cargo fmt --check
   ```
6. **Commit** with clear messages (see below)
7. **Push** and create a Pull Request

## Coding Standards

### Rust (Smart Contracts)

- Follow [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- Use `cargo fmt` for formatting
- Use `cargo clippy` for linting
- Document public APIs with `///` comments
- Write unit tests in the same file, integration tests in `/tests`

```rust
/// Stake tokens to earn rewards.
///
/// # Arguments
/// * `deps` - Mutable dependencies
/// * `env` - Environment info
/// * `info` - Message info including sender and funds
///
/// # Errors
/// Returns `ContractError::NoFunds` if no tokens are sent
pub fn execute_stake(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
) -> Result<Response, ContractError> {
    // ...
}
```

### TypeScript (Frontend)

- Use TypeScript strict mode
- Use ESLint & Prettier
- Use functional components with hooks
- Prefer named exports

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:
```
feat(voting): add quadratic voting support
fix(treasury): prevent overflow in allocation calculation
docs(readme): add deployment instructions
test(grants): add milestone rejection test
```

## Pull Request Process

1. **Title**: Use conventional commit format
2. **Description**: Explain what and why (not how — code shows that)
3. **Link issues**: Use `Closes #123` or `Fixes #456`
4. **Checklist**:
   - [ ] Tests pass locally
   - [ ] New tests added for new features
   - [ ] Documentation updated
   - [ ] No breaking changes (or clearly documented)

### Review Process

- PRs require at least 1 approval
- CI must pass (tests, lint, build)
- Maintainers may request changes
- Squash merge preferred for clean history

## Security Vulnerabilities

**Do NOT open public issues for security vulnerabilities.**

See [SECURITY.md](SECURITY.md) for responsible disclosure instructions.

## Areas for Contribution

### Good First Issues

Look for issues labeled [`good first issue`](https://github.com/Mopperr/citizen-ledger/labels/good%20first%20issue).

### Priority Areas

- **Testing**: More integration tests, edge cases
- **Documentation**: Tutorials, API docs, examples
- **Frontend**: Accessibility, mobile responsiveness
- **Internationalization**: Translations for the UI

## Development Resources

- [CosmWasm Documentation](https://docs.cosmwasm.com/)
- [Cosmos SDK Documentation](https://docs.cosmos.network/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Circom Documentation](https://docs.circom.io/)

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

## Questions?

- Open a [Discussion](https://github.com/Mopperr/citizen-ledger/discussions)
- Check the [Documentation](docs/)

Thank you for helping build transparent, citizen-led governance! 🏛️
