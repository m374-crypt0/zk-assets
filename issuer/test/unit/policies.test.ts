import { describe, it, expect } from 'bun:test'
import { testClient } from 'hono/testing'
import { inMemoryPolicyRepository } from 'src/repositories/inMemoryPolicyRepository'
import policy from 'src/handlers/policies'

const should = '<unit> should'

describe('Policy querying', () => {
  const client = testClient(policy, { policyRepository: inMemoryPolicyRepository })

  it(`${should} return a list of policy identifiers`, async () => {
    const res = await client.listIdentifiers.$get()

    expect(await res.json()).toEqual([0])
  })

  it(`${should} error when querying unexisting policy`, async () => {
    const res = await client[':id'].$get({ param: { id: '1' } })

    expect(res.status).toBe(404)
    expect(await res.json()).toHaveProperty('error')
  })

  it(`${should} return policy properties for existing policy identifier`, async () => {
    const res = await client[':id'].$get({ param: { id: '0' } })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      id: 0,
      assetName: 'rwa_gold_one_ounce',
      scope: {
        id: 0,
        name: 'hold',
        parameters: {
          validUntil: {
            type: 'number',
            description: 'A UNIX timestamp value with second precision'
          }
        }
      }
    })
  })
})
