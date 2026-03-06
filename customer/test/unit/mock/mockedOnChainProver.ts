import type { OnChainProver } from "src/blockchain/types/onChainProver";

export class MockedOnChainProver implements OnChainProver {
  constructor(mustSucceed: boolean) {
    this.mustSucceed = mustSucceed
  }

  public prove(_proof: Uint8Array<ArrayBufferLike>, _publicInputs: string[]) {
    if (this.mustSucceed)
      return Promise.resolve(true)

    return Promise.reject(new Error('Error while proving inputs'))
  }

  private mustSucceed: boolean
}
