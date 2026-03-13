type PolicyParameterTypes = 'number' | 'string' | 'boolean'
type PolicyParameters = Record<string, {
  type: PolicyParameterTypes,
  description: string
}>

export type Policy = {
  id: number,
  assetName: string,
  scope: {
    id: number,
    name: string,
    parameters: PolicyParameters
  }
  validateParameters: (parameters: PolicyParameters) => boolean,
  validateParameterValues: (parameters: PolicyParameters, timestamp: () => number) => boolean
}

export type PolicyRepository = {
  listIdentifiers: () => Array<number>
  getFromId: (id: number) => Policy | undefined
}

