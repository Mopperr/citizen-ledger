declare module "snarkjs" {
  export interface Groth16Proof {
    pi_a: [string, string, string];
    pi_b: [[string, string], [string, string], [string, string]];
    pi_c: [string, string, string];
    protocol: string;
    curve: string;
  }

  export type PublicSignals = string[];

  export interface FullProveResult {
    proof: Groth16Proof;
    publicSignals: PublicSignals;
  }

  export const groth16: {
    fullProve(
      input: Record<string, string | string[]>,
      wasmFile: string,
      zkeyFile: string
    ): Promise<FullProveResult>;

    verify(
      vkey: object,
      publicSignals: PublicSignals,
      proof: Groth16Proof
    ): Promise<boolean>;

    exportSolidityCallData(
      proof: Groth16Proof,
      publicSignals: PublicSignals
    ): Promise<string>;
  };

  export const plonk: {
    fullProve(
      input: Record<string, string | string[]>,
      wasmFile: string,
      zkeyFile: string
    ): Promise<FullProveResult>;

    verify(
      vkey: object,
      publicSignals: PublicSignals,
      proof: object
    ): Promise<boolean>;
  };

  export const powersOfTau: {
    newAccumulator(
      curve: string,
      power: number,
      fileName: string,
      logger?: object
    ): Promise<void>;

    contribute(
      oldPtauFilename: string,
      newPtauFilename: string,
      name: string,
      entropy: string,
      logger?: object
    ): Promise<string>;

    preparePhase2(
      oldPtauFilename: string,
      newPtauFilename: string,
      logger?: object
    ): Promise<void>;
  };

  export const zKey: {
    newZKey(
      r1csFileName: string,
      ptauFileName: string,
      zkeyFileName: string,
      logger?: object
    ): Promise<void>;

    contribute(
      oldZkeyFileName: string,
      newZkeyFileName: string,
      name: string,
      entropy: string,
      logger?: object
    ): Promise<string>;

    exportVerificationKey(
      zkeyFileName: string,
      logger?: object
    ): Promise<object>;

    exportSolidityVerifier(
      zkeyFileName: string,
      logger?: object
    ): Promise<string>;
  };

  export const wtns: {
    calculate(
      input: Record<string, string | string[]>,
      wasmFile: string,
      wtnsFile: string,
      logger?: object
    ): Promise<void>;
  };

  export const r1cs: {
    info(r1csFileName: string, logger?: object): Promise<object>;
    print(r1csFileName: string, symFile: string, logger?: object): Promise<void>;
  };
}

declare module "circomlibjs" {
  export interface Poseidon {
    (inputs: bigint[]): Uint8Array;
    F: {
      toObject(element: Uint8Array): bigint;
      toString(element: Uint8Array, radix?: number): string;
    };
  }

  export function buildPoseidon(): Promise<Poseidon>;
  export function buildEddsa(): Promise<any>;
  export function buildBabyjub(): Promise<any>;
  export function buildMimc7(): Promise<any>;
  export function buildMimcSponge(): Promise<any>;
  export function buildPedersenHash(): Promise<any>;
  export function buildSMT(db: any, root: any): Promise<any>;
}
