import compiledCircuit from "target/zhold_v1.json"

import { Barretenberg, UltraHonkBackend } from "@aztec/bb.js"

import { writeFile } from "fs/promises"
import { argv, exit } from "process"

async function main() {
  if (!argv[2])
    throw new Error("Usage: generator <Verifier.sol file path>");

  const api = await Barretenberg.new()

  const backend = new UltraHonkBackend(compiledCircuit.bytecode, api)
  const vk = await backend.getVerificationKey({ verifierTarget: 'evm' });

  const verifier = await backend.getSolidityVerifier(vk);
  await writeFile(argv[2], verifier);

  exit(0)
}

await main()
