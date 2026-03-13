import { type PolicyRepository, type Policy } from './types/policyRepository'

export const inMemoryPolicyRepository: PolicyRepository = {
  listIdentifiers() {
    return repository.map(policy => policy.id)
  },
  getFromId(id) {
    return repository.find(p => p.id === id)
  },
}

const repository: Array<Policy> = [{
  id: 0,
  assetName: 'rwa_1',
  scope: {
    id: 0,
    name: 'hold',
    parameters: {
      validUntil: {
        type: 'number',
        description: 'A UNIX timestamp value with second precision'
      }
    },
  },
  validateParameters: (parameters) => {
    return parameters['validUntil'] !== undefined
  },
  validateParameterValues: (parameters, timestamp) => {
    if (typeof parameters['validUntil'] !== 'number')
      return false

    const v = parameters['validUntil']

    return v > timestamp() && v < timestamp() + 60 * 60 * 24
  }
}]
