import { Barretenberg } from "@aztec/bb.js"

import { bytesToHex } from "viem"

export type CreateCommitmentOptions = {
  customerId: number,
  customerSecret: bigint
  authorizedSender: bigint,
  policy: {
    id: number,
    scope: {
      id: number,
      parameters: {
        [name: string]: unknown
      }
    }
  }
}

export default {
  async createCommitment(options: CreateCommitmentOptions) {
    const bb = await Barretenberg.new()

    const hash = (await bb.poseidon2Hash({
      inputs: [
        (await bb.blake2sToField({ data: Buffer.from([options.customerId]) })).field,
        (await bb.blake2sToField({ data: Buffer.from(options.customerSecret.toString()) })).field,
        (await bb.blake2sToField({ data: Buffer.from(options.authorizedSender.toString()) })).field,
        (await bb.blake2sToField({ data: Buffer.from([options.policy.id]) })).field,
        (await bb.blake2sToField({ data: Buffer.from([options.policy.scope.id]) })).field,
        (await bb.blake2sToField({ data: Buffer.from((options.policy.scope.parameters.validUntil as bigint).toString()) })).field
      ]
    })).hash

    return bytesToHex(hash)
  }
}
