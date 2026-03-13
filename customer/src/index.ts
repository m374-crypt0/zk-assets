import { Barretenberg, UltraHonkBackend } from "@aztec/bb.js"
import { Noir, type CompiledCircuit } from "@noir-lang/noir_js"
import { poseidon2HashAsync } from "@zkpassport/poseidon2"

import { cpus } from "node:os"
import { toHex } from "viem"

import { type OnChainProver, type ProverInputs } from "./blockchain/types/onChainProver"
import type { CommitmentInputs, Inputs, PublicInputs } from "./types"

import circuit from "circuits/target/rwa_eligibility_v1.json"

export default {
  async createCommitment(options: CommitmentInputs) {
    const hash = await poseidon2HashAsync([
      BigInt(options.private_inputs.customer_id),
      BigInt(options.private_inputs.customer_secret),
      BigInt(options.private_inputs.authorized_sender),
      BigInt(options.policy.id),
      BigInt(options.policy.scope.id),
      BigInt(options.policy.scope.parameters.valid_until!)
    ])

    return hash
  },
  async generateProof(inputs: Inputs) {
    const noir = new Noir(circuit as CompiledCircuit)
    await noir.init()

    const { witness } = await noir.execute(inputs)

    const bb = await Barretenberg.new({ threads: cpus().length })
    const backend = new UltraHonkBackend(circuit.bytecode, bb)
    const { proof } = await backend.generateProof(witness, { verifierTarget: 'evm' })

    await bb.destroy()

    return proof
  },
  async verifyProofLocally(options: {
    proof: Uint8Array<ArrayBufferLike>,
    publicInputs: PublicInputs
  }) {
    const bb = await Barretenberg.new({ threads: cpus().length })
    const backend = new UltraHonkBackend(circuit.bytecode, bb)

    const backendInputs = [
      options.publicInputs.policy.id,
      options.publicInputs.policy.scope.id,
      options.publicInputs.policy.scope.parameters.valid_until as string,
      options.publicInputs.request.sender,
      options.publicInputs.request.commitment,
    ]

    const result = await backend.verifyProof({ publicInputs: backendInputs, proof: options.proof }, { verifierTarget: 'evm' })

    await bb.destroy()

    return result
  },
  async verifyProofOnChain(options: {
    onChainProver: OnChainProver,
    proof: Uint8Array<ArrayBufferLike>,
    publicInputs: PublicInputs
  }) {
    const proverInputs: ProverInputs = {
      policyId: toHex(BigInt(options.publicInputs.policy.id), { size: 32 }),
      policyScopeId: toHex(BigInt(options.publicInputs.policy.scope.id), { size: 32 }),
      validUntil: toHex(BigInt(options.publicInputs.policy.scope.parameters.valid_until!), { size: 32 }),
      commitment: toHex(BigInt(options.publicInputs.request.commitment), { size: 32 })
    }

    return options.onChainProver.prove(options.proof, proverInputs)
  }
}
