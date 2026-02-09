# Citizen Ledger ZK Circuits

Zero-knowledge circuits for privacy-preserving credential verification using Circom and snarkjs.

## Overview

The credential system uses ZK-SNARKs (Groth16) to allow citizens to prove they hold valid credentials without revealing the underlying identity data.

**Privacy Model:**
- Only a commitment (hash) is stored on-chain
- The citizen generates a ZK proof locally in their browser
- The proof demonstrates knowledge of secret inputs that hash to the public commitment
- No personal data ever touches the blockchain

## Circuit: Citizenship Proof

```
citizenship.circom
├── Inputs (private):
│   ├── firstNameHash    - Hash of first name
│   ├── lastNameHash     - Hash of last name  
│   ├── dateOfBirth      - Unix timestamp
│   ├── idNumber         - National ID hash
│   └── salt             - Random nonce
├── Inputs (public):
│   ├── commitment       - Poseidon(private inputs)
│   ├── currentTime      - Block timestamp
│   └── minAge           - Minimum age requirement (e.g., 18)
└── Constraints:
    ├── commitment == Poseidon(private inputs, salt)
    └── currentTime - dateOfBirth >= minAge * 365 * 24 * 60 * 60
```

## Setup (requires Circom toolchain)

### Prerequisites

```bash
# Install Circom (Rust)
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
git clone https://github.com/iden3/circom.git
cd circom
cargo build --release
cargo install --path circom

# Install snarkjs globally
npm install -g snarkjs
```

### Compile Circuit

```bash
cd circuits

# Compile to R1CS
circom citizenship.circom --r1cs --wasm --sym -o build/

# Powers of Tau ceremony (use existing ptau for production)
snarkjs powersoftau new bn128 14 pot14_0000.ptau -v
snarkjs powersoftau contribute pot14_0000.ptau pot14_0001.ptau --name="First contribution" -v
snarkjs powersoftau prepare phase2 pot14_0001.ptau pot14_final.ptau -v

# Generate proving/verification keys
snarkjs groth16 setup build/citizenship.r1cs pot14_final.ptau citizenship_0000.zkey
snarkjs zkey contribute citizenship_0000.zkey citizenship_final.zkey --name="1st contribution" -v
snarkjs zkey export verificationkey citizenship_final.zkey verification_key.json
```

### Generate Proof (Example)

```bash
# Create input.json with your private data
snarkjs groth16 fullprove input.json build/citizenship_js/citizenship.wasm citizenship_final.zkey proof.json public.json

# Verify locally
snarkjs groth16 verify verification_key.json public.json proof.json
```

## Files

| File | Description |
|---|---|
| `citizenship.circom` | Main circuit for citizenship proofs |
| `lib/poseidon.circom` | Poseidon hash function (from circomlib) |
| `build/` | Compiled circuit artifacts (gitignored) |
| `keys/` | Production proving keys (distributed separately) |

## Frontend Integration

The frontend uses `snarkjs` in the browser to generate proofs client-side:

```typescript
import * as snarkjs from 'snarkjs';

async function generateCitizenshipProof(privateInputs: PrivateInputs) {
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    privateInputs,
    '/circuits/citizenship.wasm',
    '/circuits/citizenship_final.zkey'
  );
  
  // Format for on-chain submission
  return {
    proof_data: JSON.stringify(proof),
    public_inputs: publicSignals,
    vk_reference: 'citizenship_v1'
  };
}
```

## Security Considerations

1. **Trusted Setup**: Production deployment requires a proper multi-party ceremony
2. **Nullifiers**: Add nullifiers to prevent double-use of the same credential data
3. **Revocation**: Support credential revocation via on-chain merkle tree updates
4. **Audit**: Circuits should be audited before mainnet launch

## Related Documentation

- [Sybil Resistance Design](../docs/sybil-resistance-design.md)
- [Credential Registry Contract](../contracts/credential-registry/)
- [Identity Frontend Page](../frontend/src/app/identity/)
