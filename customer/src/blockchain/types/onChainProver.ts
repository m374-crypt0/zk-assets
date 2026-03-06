export type OnChainProver = {
  prove: (proof: Uint8Array<ArrayBufferLike>, publicInputs: string[]) => Promise<boolean>
}

