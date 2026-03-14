export type ProverInputs = {
  policyId: `0x${string}`,
  policyScopeId: `0x${string}`,
  validUntil: `0x${string}`,
  commitment: `0x${string}`,
}

export type OnChainProver = {
  prove: (proof: Uint8Array<ArrayBufferLike>, proverInputs: ProverInputs) => Promise<boolean>
  timestamp: () => Promise<number>
}

