import abi from "contracts/out/CommitmentStore.sol";
import { contractAddresses } from "src/blockchain/utility/contractAddresses";
import {
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  type PublicClient,
  type WalletClient
} from "viem";
import { waitForTransactionReceipt } from "viem/actions"
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { anvil } from "viem/chains";
import type { OnChainCommitmentStore } from "./types/onChainCommitmentStore";

export type PrivateKey = `0x${string}`
type Hash = `0x${string}`

export class LocalOnChainCommitmentStore implements OnChainCommitmentStore {
  constructor(privateKey: PrivateKey) {
    const clientConfig = {
      chain: defineChain({
        ...anvil,
        id: 1
      }),
      transport: http(`http://${process.env['ANVIL_HOST']}:${process.env['ANVIL_PORT']}`)
    }

    this.account = privateKeyToAccount(privateKey)
    this.publicClient = createPublicClient(clientConfig)
    this.walletClient = createWalletClient(clientConfig)
  }

  public async revokeCommitment(commitment: string) {
    let transactionHash: Hash

    try {
      const { request } = await this.publicClient.simulateContract({
        address: contractAddresses.CommitmentStore,
        abi,
        functionName: 'revoke',
        args: [BigInt(commitment)],
        account: this.account
      })

      transactionHash = await this.walletClient.writeContract(request)
      await waitForTransactionReceipt(this.walletClient, { hash: transactionHash })
    } catch (e) {
      const executionError = e as ContractFunctionExecutionError
      const revertedError = executionError.cause as ContractFunctionRevertedError

      throw new Error(revertedError.data?.errorName)
    }

    return transactionHash
  }

  public async storeCommitment(commitment: string) {
    let transactionHash: Hash

    try {
      const { request } = await this.publicClient.simulateContract({
        address: contractAddresses.CommitmentStore,
        abi,
        functionName: 'commit',
        args: [BigInt(commitment)],
        account: this.account
      })

      transactionHash = await this.walletClient.writeContract(request)
      await waitForTransactionReceipt(this.walletClient, { hash: transactionHash })
    } catch (e) {
      const executionError = e as ContractFunctionExecutionError
      const revertedError = executionError.cause as ContractFunctionRevertedError

      throw new Error(revertedError.data?.errorName)
    }

    return transactionHash
  }

  public async timestamp() {
    const block = await this.publicClient.getBlock()

    return Number(block.timestamp);
  }

  private readonly publicClient: PublicClient
  private readonly walletClient: WalletClient
  private readonly account: PrivateKeyAccount
}
