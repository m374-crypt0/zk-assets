import customer, { type CreateCommitmentOptions } from "src"

import { Barretenberg } from "@aztec/bb.js"

import { bytesToHex } from "viem"

import { expect, describe, it, beforeEach, } from "bun:test";

describe('Commitment creation', () => {
  let bb: Barretenberg

  beforeEach(async () => {
    bb = await Barretenberg.new()
  })

  it('should be able to create a poseidon2 commitment from input', async () => {
    const data: CreateCommitmentOptions = {
      customerId: 0,
      authorizedSender: 0n,
      policy: {
        id: 0,
        scope: {
          id: 0,
          parameters: {
            validUntil: 0n
          }
        }
      },
      customerSecret: 0n
    }

    const expectedCommitment = (await bb.poseidon2Hash({
      inputs: [
        (await bb.blake2sToField({ data: Buffer.from([data.customerId]) })).field,
        (await bb.blake2sToField({ data: Buffer.from(data.customerSecret.toString()) })).field,
        (await bb.blake2sToField({ data: Buffer.from(data.authorizedSender.toString()) })).field,
        (await bb.blake2sToField({ data: Buffer.from([data.policy.id]) })).field,
        (await bb.blake2sToField({ data: Buffer.from([data.policy.scope.id]) })).field,
        (await bb.blake2sToField({ data: Buffer.from((data.policy.scope.parameters.validUntil as bigint).toString()) })).field,
      ]
    })).hash

    const commitment = await customer.createCommitment(data)

    expect(commitment).toBe(bytesToHex(expectedCommitment))
  })
})
