
import customer from "src";

import { type OnChainProver } from "src/blockchain/types/onChainProver";

import { poseidon2HashAsync } from "@zkpassport/poseidon2";

import { MockedOnChainProver } from "test/unit/mock/mockedOnChainProver";

import { describe, expect, it } from "bun:test";

import {
  getTestingPolicy,
  getTestingPrivateInputs,
  getTestingPublicInputs,
  getValidProofForTesting
} from "test/utility";

const should = '<unit> should'

describe('Commitment creation', () => {
  it(`${should} be able to create a poseidon2 commitment from input`, async () => {
    const [private_inputs, policy] = [getTestingPrivateInputs(), getTestingPolicy()]
    const expectedCommitment = await poseidon2HashAsync([
      BigInt(private_inputs.customer_id),
      BigInt(private_inputs.customer_secret),
      BigInt(private_inputs.authorized_sender),
      BigInt(policy.id),
      BigInt(policy.scope.id),
      BigInt(policy.scope.parameters.valid_until)
    ])

    const commitment = await customer.createCommitment({ policy, private_inputs })

    expect(commitment).toBe(expectedCommitment)
  })
})

describe('Proof creation and local verification', () => {
  it(`${should} not be able to create a proof with invalid commitment`, async () => {
    const [privateInputs, publicInputs] = [getTestingPrivateInputs(), await getTestingPublicInputs()]

    publicInputs.request.commitment = '0x00'

    expect(async () => await customer.generateProof({
      private_inputs: privateInputs,
      ...publicInputs
    }))
      .toThrowError('Circuit execution failed: Invalid commitment value')
  })

  it(`${should} be able to create a proof and verify it against correct inputs`, async () => {
    const [privateInputs, publicInputs] = [getTestingPrivateInputs(), await getTestingPublicInputs()]

    const proof = await getValidProofForTesting({ privateInputs, publicInputs });

    expect(await customer.verifyProofLocally({ proof, publicInputs })).toBeTrue()
  })
})

describe('Proof submission to mocked blockchain', () => {
  it(`${should} fail to verify a proof with wrong commitment value`, async () => {
    const [privateInputs, publicInputs] = [getTestingPrivateInputs(), await getTestingPublicInputs()]
    const proof = await getValidProofForTesting({ privateInputs, publicInputs });

    expect(await customer.verifyProofLocally({ proof, publicInputs })).toBeTrue()

    publicInputs.request.commitment = '0x42'
    const onChainProver: OnChainProver = new MockedOnChainProver({ failWith: 'Failed to prove on-chain: invalid commitment' })

    expect(async () => customer.verifyProofOnChain({
      onChainProver,
      proof,
      publicInputs
    })).toThrow('Failed to prove on-chain: invalid commitment')
  })

  it(`${should} fail to verify a proof with correct commitment but with wrong input`, async () => {
    const [privateInputs, publicInputs] = [getTestingPrivateInputs(), await getTestingPublicInputs()]
    const proof = await getValidProofForTesting({ privateInputs, publicInputs });

    expect(await customer.verifyProofLocally({ proof, publicInputs })).toBeTrue()

    publicInputs.request.sender = '0x1bc0252a41ef0cd6ae425189084252707862aae9'
    const onChainProver: OnChainProver = new MockedOnChainProver({ failWith: 'Failed to prove on-chain: invalid proof' })

    expect(async () => customer.verifyProofOnChain({
      onChainProver,
      proof,
      publicInputs
    })).toThrow('Failed to prove on-chain: invalid proof')
  })

  it(`${should} succeed to verify a proof with correct public inputs`, async () => {
    const [privateInputs, publicInputs] = [getTestingPrivateInputs(), await getTestingPublicInputs()]
    const proof = await getValidProofForTesting({ privateInputs, publicInputs });

    expect(await customer.verifyProofLocally({ proof, publicInputs })).toBeTrue()

    const onChainProver: OnChainProver = new MockedOnChainProver()

    expect(await customer.verifyProofOnChain({
      onChainProver,
      proof,
      publicInputs
    })).toBeTrue()
  })
})
