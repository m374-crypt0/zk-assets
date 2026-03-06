import { poseidon2HashAsync } from "@zkpassport/poseidon2"

import { Noir, type CompiledCircuit } from "@noir-lang/noir_js"

import { Barretenberg, UltraHonkBackend } from "@aztec/bb.js"

import { cpus } from "node:os"

import type { CommitmentInputForBackend, InputsForBackend, PublicInputsForBackend } from "./types"

import circuit from "../../circuits/target/rwa_eligibility_v1.json"

import { type OnChainProver } from "./blockchain/types/onChainProver"

export default {
  async createCommitment(options: CommitmentInputForBackend) {
    const hash = await poseidon2HashAsync([
      BigInt(options.private_inputs.customer_id),
      BigInt(options.private_inputs.customer_secret),
      BigInt(options.private_inputs.authorized_sender),
      BigInt(options.policy.id),
      BigInt(options.policy.scope.id),
      BigInt(options.policy.scope.parameters.valid_until as string)
    ])

    return hash
  },
  async generateProof(inputs: InputsForBackend) {
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
    publicInputs: PublicInputsForBackend
  }) {
    const bb = await Barretenberg.new({ threads: cpus().length })
    const backend = new UltraHonkBackend(circuit.bytecode, bb)

    const backendInputs = [
      options.publicInputs.policy.id,
      options.publicInputs.policy.scope.id,
      options.publicInputs.policy.scope.parameters.valid_until as string,
      options.publicInputs.request.sender,
      options.publicInputs.request.current_timestamp,
      options.publicInputs.request.commitment,
    ]

    const result = await backend.verifyProof({ publicInputs: backendInputs, proof: options.proof }, { verifierTarget: 'evm' })

    await bb.destroy()

    return result
  },
  async verifyProofOnChain(options: {
    onChainProver: OnChainProver,
    proof: Uint8Array<ArrayBufferLike>,
    publicInputs: PublicInputsForBackend
  }) {
    const backendInputs = [
      options.publicInputs.policy.id,
      options.publicInputs.policy.scope.id,
      options.publicInputs.policy.scope.parameters.valid_until as string,
      options.publicInputs.request.sender,
      options.publicInputs.request.current_timestamp,
      options.publicInputs.request.commitment,
    ]

    return options.onChainProver.prove(options.proof, backendInputs)
  }
}
