import { Barretenberg, Fr } from "@aztec/bb.js"

export type CreateCommitmentOptions = {
  customerId: number,
  policy: {
    id: number,
    scope: {
      id: number,
      parameters: {
        [name: string]: unknown
      }
    }
  },
  evmAddress: bigint,
  secret: bigint
}

export default {
  async createCommitment(options: CreateCommitmentOptions) {
    const bb = await Barretenberg.new()

    const hash = await bb.poseidon2Hash([
      new Fr(BigInt(options.customerId)),
      new Fr(options.secret),
      new Fr(options.evmAddress),
      new Fr(BigInt(options.policy.id)),
      new Fr(BigInt(options.policy.scope.id)),
      new Fr(options.policy.scope.parameters.validUntil as bigint)
    ])

    return BigInt(hash.toString())
  }
}
