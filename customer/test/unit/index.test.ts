import {
  type CommitmentInputForBackend,
  type PolicyInputsForBackend,
  type PrivateInputsForBackend,
  type PublicInputsForBackend
} from "src/types";

import customer from "src";

import { poseidon2HashAsync } from "@zkpassport/poseidon2";

import { randomBytes } from "crypto"

import { BN254_FR_MODULUS } from "@aztec/bb.js"

import { describe, expect, it, } from "bun:test";

describe('Commitment creation', () => {

  const ZERO_COMMITMENT_OPTIONS: CommitmentInputForBackend = {
    private_inputs: {
      customer_id: 0n.toString(),
      authorized_sender: 0n.toString(),
      customer_secret: 0n.toString(),
    },
    policy: {
      id: 0n.toString(),
      scope: {
        id: 0n.toString(),
        parameters: {
          valid_until: 0n.toString()
        }
      }
    }
  }

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
    const customerSecret = BigInt(`0x${randomBytes(32).toString('hex')}`) % BN254_FR_MODULUS

    const privateInputs: PrivateInputsForBackend = {
      private_inputs: {
        customer_id: ZERO_COMMITMENT_OPTIONS.private_inputs.customer_id,
        authorized_sender: 0x1B77B138c7706407ad86438b75D8bA9F9c838A49n.toString(),
        customer_secret: customerSecret.toString()
      }
    }

    const policy: PolicyInputsForBackend = {
      policy: {
        id: 0n.toString(),
        scope: {
          id: 0n.toString(),
          parameters: {
            valid_until: 1770380983n.toString()
          }
        }
      }
    }

    const commitment = await customer.createCommitment({
      ...privateInputs,
      ...policy
    })

    const publicInputs: PublicInputsForBackend = {
      ...policy,
      request: {
        sender: privateInputs.private_inputs.authorized_sender,
        current_timestamp: (BigInt(policy.policy.scope.parameters.valid_until as string) - 1n).toString(),
        commitment: commitment.toString()
      }
    }

    const proof = await customer.generateProof({ ...privateInputs, ...publicInputs })

    expect(await customer.verifyProof(proof, publicInputs)).toBeTrue()
  })
})
