import {
  type PrivateInputsForBackend,
  type PublicInputsForBackend
} from "src/types";

import customer from "src";

import { type OnChainProver } from "src/blockchain/types/onChainProver";

import { MockedOnChainProver } from "test/unit/mock/mockedOnChainProver";

import { poseidon2HashAsync } from "@zkpassport/poseidon2";

import { describe, expect, it } from "bun:test";

import { getValidProofAndPublicInputs, ZERO_COMMITMENT_OPTIONS } from "test/utility";

describe('Commitment creation', () => {
  it('should be able to create a poseidon2 commitment from input', async () => {
    const expectedCommitment = await poseidon2HashAsync([
      BigInt(ZERO_COMMITMENT_OPTIONS.private_inputs.customer_id),
      BigInt(ZERO_COMMITMENT_OPTIONS.private_inputs.customer_secret),
      BigInt(ZERO_COMMITMENT_OPTIONS.private_inputs.authorized_sender),
      BigInt(ZERO_COMMITMENT_OPTIONS.policy.id),
      BigInt(ZERO_COMMITMENT_OPTIONS.policy.scope.id),
      BigInt(ZERO_COMMITMENT_OPTIONS.policy.scope.parameters.valid_until as string)
    ])

    const commitment = await customer.createCommitment(ZERO_COMMITMENT_OPTIONS)

    expect(commitment).toBe(expectedCommitment)
  })
})

describe('Proof creation and local verification', () => {
  it('should not be able to create a proof with wrong inputs', async () => {
    const privateInputs: PrivateInputsForBackend = {
      private_inputs: {
        customer_id: ZERO_COMMITMENT_OPTIONS.private_inputs.customer_id,
        authorized_sender: ZERO_COMMITMENT_OPTIONS.private_inputs.authorized_sender,
        customer_secret: ZERO_COMMITMENT_OPTIONS.private_inputs.customer_secret
      }
    }

    const publicInputs: PublicInputsForBackend = {
      policy: { ...ZERO_COMMITMENT_OPTIONS.policy },
      request: {
        sender: 0n.toString(),
        current_timestamp: 0n.toString(),
        commitment: 1n.toString()
      }
    }

    expect(async () => await customer.generateProof({ ...privateInputs, ...publicInputs }))
      .toThrowError('Circuit execution failed: Invalid commitment value')
  })

  it('should be able to create a proof and verify it against correct inputs', async () => {
    const { proof, publicInputs } = await getValidProofAndPublicInputs();

    expect(await customer.verifyProofLocally({ proof, publicInputs })).toBeTrue()
  })
})

describe('Proof submission to blokchain', () => {
  it('should fail to verify a proof with wrong inputs', async () => {
    const { proof, publicInputs } = await getValidProofAndPublicInputs();
    expect(await customer.verifyProofLocally({ proof, publicInputs })).toBeTrue()

    publicInputs.request.commitment = '42'
    const onChainProver: OnChainProver = new MockedOnChainProver(false)

    expect(async () => customer.verifyProofOnChain({
      onChainProver,
      proof,
      publicInputs
    })).toThrow('Failed to prove on-chain: invalid commitment')
  })
})
