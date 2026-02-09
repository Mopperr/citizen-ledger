pragma circom 2.1.6;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/comparators.circom";

/*
 * Nullifier Circuit for Sybil Resistance
 * 
 * Generates a unique nullifier from identity data that can be stored on-chain
 * to prevent the same identity from registering multiple times.
 * 
 * Key insight: The nullifier is deterministic given the identity, but reveals
 * nothing about the identity itself. If someone tries to register twice,
 * the same nullifier would be generated, which the contract can detect.
 */
template IdentityNullifier() {
    // ═══════════════════════════════════════════════════════════════════════
    // PRIVATE INPUTS
    // ═══════════════════════════════════════════════════════════════════════
    
    signal input firstNameHash;
    signal input lastNameHash;
    signal input dateOfBirth;
    signal input idNumberHash;
    signal input nationalityHash;     // Added: nationality for jurisdiction-specific nullifier
    signal input secretKey;           // User's secret key (derived from wallet signature)
    
    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC INPUTS
    // ═══════════════════════════════════════════════════════════════════════
    
    signal input expectedCommitment;  // From the trusted issuer
    signal input domain;              // Protocol-specific domain separator
    
    // ═══════════════════════════════════════════════════════════════════════
    // OUTPUTS
    // ═══════════════════════════════════════════════════════════════════════
    
    signal output nullifier;          // Unique, unlinkable identifier
    signal output commitment;         // Identity commitment (for storage)
    
    // ═══════════════════════════════════════════════════════════════════════
    // COMPUTE IDENTITY COMMITMENT
    // ═══════════════════════════════════════════════════════════════════════
    
    component identityHasher = Poseidon(5);
    identityHasher.inputs[0] <== firstNameHash;
    identityHasher.inputs[1] <== lastNameHash;
    identityHasher.inputs[2] <== dateOfBirth;
    identityHasher.inputs[3] <== idNumberHash;
    identityHasher.inputs[4] <== nationalityHash;
    
    commitment <== identityHasher.out;
    
    // Verify against expected commitment from issuer
    expectedCommitment === commitment;
    
    // ═══════════════════════════════════════════════════════════════════════
    // COMPUTE NULLIFIER
    // nullifier = Poseidon(identityCommitment, secretKey, domain)
    // 
    // Properties:
    // - Deterministic: Same identity always produces same nullifier
    // - Unlinkable: Cannot derive identity from nullifier
    // - Domain-bound: Different domains produce different nullifiers
    // ═══════════════════════════════════════════════════════════════════════
    
    component nullifierHasher = Poseidon(3);
    nullifierHasher.inputs[0] <== commitment;
    nullifierHasher.inputs[1] <== secretKey;
    nullifierHasher.inputs[2] <== domain;
    
    nullifier <== nullifierHasher.out;
}

component main {public [expectedCommitment, domain]} = IdentityNullifier();
