import compiledCircuit from "target/rwa_eligibility_v1_hold_asset.json"

import { UltraHonkBackend } from "@aztec/bb.js"

import { writeFile } from "fs/promises"
import { argv, exit } from "process"

async function main() {
  if (!argv[2])
    throw new Error("Usage: generator <Verifier.sol file path>");

  const bb = new UltraHonkBackend(compiledCircuit.bytecode)
  const vk = await bb.getVerificationKey({ keccak: true });

  const verifier = await bb.getSolidityVerifier(vk);
  await writeFile(argv[2], verifier);

  exit(0)
}

await main()
