import { randomBytes } from "crypto";

import { BN254_FR_MODULUS } from "@aztec/bb.js";

import type { CommitmentInputForBackend, PolicyInputsForBackend, PrivateInputsForBackend, PublicInputsForBackend } from "src/types";

import customer from "src";

export const ZERO_COMMITMENT_OPTIONS: CommitmentInputForBackend = {
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

export async function getValidProofAndPublicInputs() {
  // NOTE: ensuring the secret holds in a Field value
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

  return { proof, publicInputs };
}
