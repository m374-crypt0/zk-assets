export const contractAddresses = {
  Prover: (await getTransactionsFromRunLatestIfAny()).transactions
    .filter(tx => tx.contractName === 'Prover')
    .map(tx => tx.contractAddress)
    .at(0) as Address,
}

type Broadcast = {
  transactions: [{
    contractName: string,
    contractAddress: string
  }]
}

type Address = `0x${string}`

async function getTransactionsFromRunLatestIfAny(): Promise<Broadcast> {
  const rootDir = process.env['ZHOLD_ROOT_DIR']!
  const file = Bun.file(`${rootDir}contracts/broadcast/LocalDeploy.s.sol/1/run-latest.json`)
  if (!(await file.exists()))
    return {
      transactions: [
        {
          contractName: '',
          contractAddress: ''
        }
      ]
    }

  return await file.json() as Broadcast
}
