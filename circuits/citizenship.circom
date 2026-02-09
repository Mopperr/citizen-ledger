pragma circom 2.1.6;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/comparators.circom";

/*
 * Citizenship Credential Proof Circuit
 * 
 * Proves that a citizen:
 * 1. Knows the pre-image of a public commitment
 * 2. Is above the minimum age requirement
 * 
 * Privacy: Only the commitment is revealed publicly.
 * The name, DOB, and ID number remain private.
 */
template CitizenshipProof() {
    // ═══════════════════════════════════════════════════════════════════════
    // PRIVATE INPUTS (known only to the prover)
    // ═══════════════════════════════════════════════════════════════════════
    
    // Identity fields (hashed for privacy)
    signal input firstNameHash;       // Poseidon hash of first name
    signal input lastNameHash;        // Poseidon hash of last name
    signal input dateOfBirth;         // Unix timestamp of birth
    signal input idNumberHash;        // Poseidon hash of national ID
    signal input salt;                // Random nonce to prevent rainbow attacks
    
    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC INPUTS (visible on-chain)
    // ═══════════════════════════════════════════════════════════════════════
    
    signal input commitment;          // The stored commitment to verify against
    signal input currentTime;         // Current block timestamp
    signal input minAgeSeconds;       // Minimum age in seconds (18 years = 567648000)
    
    // ═══════════════════════════════════════════════════════════════════════
    // OUTPUT
    // ═══════════════════════════════════════════════════════════════════════
    
    signal output valid;              // 1 if valid, 0 otherwise
    
    // ═══════════════════════════════════════════════════════════════════════
    // CONSTRAINT 1: Commitment Verification
    // Prove knowledge of private inputs that hash to the public commitment
    // ═══════════════════════════════════════════════════════════════════════
    
    component commitmentHasher = Poseidon(5);
    commitmentHasher.inputs[0] <== firstNameHash;
    commitmentHasher.inputs[1] <== lastNameHash;
    commitmentHasher.inputs[2] <== dateOfBirth;
    commitmentHasher.inputs[3] <== idNumberHash;
    commitmentHasher.inputs[4] <== salt;
    
    // The computed hash must equal the public commitment
    commitment === commitmentHasher.out;
    
    // ═══════════════════════════════════════════════════════════════════════
    // CONSTRAINT 2: Age Verification
    // Prove the citizen is at least minAgeSeconds old
    // ═══════════════════════════════════════════════════════════════════════
    
    signal age;
    age <== currentTime - dateOfBirth;
    
    // age >= minAgeSeconds
    component ageCheck = GreaterEqThan(64);
    ageCheck.in[0] <== age;
    ageCheck.in[1] <== minAgeSeconds;
    
    // Both constraints must pass
    valid <== ageCheck.out;
}

// Main component with public signals marked
component main {public [commitment, currentTime, minAgeSeconds]} = CitizenshipProof();
