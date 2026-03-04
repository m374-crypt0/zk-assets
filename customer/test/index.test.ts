import customer, { type CreateCommitmentOptions } from "src"

import { Barretenberg, Fr } from "@aztec/bb.js"

import { expect, describe, it, beforeEach, } from "bun:test";

describe('Commitment creation', () => {
  let bb: Barretenberg

  beforeEach(async () => {
    bb = await Barretenberg.new()
  })

  it('should be able to create a poseidon2 commitment from input', async () => {
    const data: CreateCommitmentOptions = {
      customerId: 1,
      evmAddress: 0n,
      policy: {
        id: 0,
        scope: {
          id: 0,
          parameters: {
            validUntil: 0n
          }
        }
      },
      secret: BigInt(Fr.random().toString())
    }

    const expectedCommitment = await bb.poseidon2Hash([
      new Fr(BigInt(data.customerId)),
      new Fr(data.secret),
      new Fr(data.evmAddress),
      new Fr(BigInt(data.policy.id)),
      new Fr(BigInt(data.policy.scope.id)),
      new Fr(data.policy.scope.parameters.validUntil as bigint)
    ])

    const commitment = await customer.createCommitment(data)

    expect(commitment).toBe(BigInt(expectedCommitment.toString()))
  })
})
