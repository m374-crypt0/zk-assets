import abi from "contracts/out/Prover.sol";
import { contractAddresses } from "src/blockchain/utility/contractAddresses";
import type { OnChainProver, ProverInputs } from "./types/onChainProver";

import {
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  createPublicClient,
  defineChain,
  fromBytes,
  http,
  type PublicClient
} from "viem";

import { anvil } from "viem/chains";

export class LocalOnChainProver implements OnChainProver {
  constructor() {
    const clientConfig = {
      chain: defineChain({
        ...anvil,
        id: 1
      }),
      transport: http(`http://${process.env['ANVIL_HOST']}:${process.env['ANVIL_PORT']}`)
    }

    this.publicClient = createPublicClient(clientConfig)
  }

  async prove(proof: Uint8Array<ArrayBufferLike>, proverInputs: ProverInputs) {
    let result: boolean = false;

    try {
      result = await this.publicClient.readContract({
        address: contractAddresses.Prover,
        abi,
        functionName: 'prove',
        args: [
          fromBytes(proof, 'hex'),
          proverInputs
        ],
      })
    } catch (e) {

      const executionError = e as ContractFunctionExecutionError
      const revertedError = executionError.cause as ContractFunctionRevertedError

      throw new Error(revertedError.data?.errorName)
    }

    return result;
  }

  async timestamp() {
    const block = await this.publicClient.getBlock();

    return Number(block.timestamp);
  }

  private readonly publicClient: PublicClient
}
