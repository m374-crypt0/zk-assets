import { beforeEach, describe, expect, it } from 'bun:test'
import { testClient } from 'hono/testing'
import { LocalOnChainSigner, type PrivateKey } from 'src/blockchain/localOnChainSigner'
import customers from 'src/handlers/customers'
import { clearRepository, inMemoryCustomerRepository } from 'src/repositories/inMemoryCustomerRepository'
import { inMemoryPolicyRepository } from 'src/repositories/inMemoryPolicyRepository'
import { thirtyDaysLaterFromEpochInSeconds } from 'src/utility/time'

const should = '<integration> should'

describe('Customer compliancy recording', () => {
  const tcg = testCommitmentGenerator()

  const getNextCommitment = () => tcg.next().value

  beforeEach(() => {
    clearRepository
  })

  it(`${should} fail if the signer is not the issuer`, async () => {
    const wrongLocalChainSigner = new LocalOnChainSigner(process.env['TEST_PRIVATE_KEY_02'] as PrivateKey)
    const client = testClient(customers, {
      customerRepository: inMemoryCustomerRepository,
      policyRepository: inMemoryPolicyRepository,
      onChainSigner: wrongLocalChainSigner,
      isTesting: true
    })

    createTestCustomerInRepository()

    const res = await client.recordCompliancy.$post({
      json: {
        customerId: 0,
        policy: {
          id: 0,
          scope: {
            id: 0,
            parameters: {
              validUntil: thirtyDaysLaterFromEpochInSeconds() - 1
            }
          }
        },
        commitment: getNextCommitment()
      }
    })

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({
      error: 'OwnableUnauthorizedAccount'
    })
  })

  it(`${should} succeed to store on-chain commitment with the signer is the issuer`, async () => {
    const client = testClient(customers, {})

    createTestCustomerInRepository()

    const res = await client.recordCompliancy.$post({
      json: {
        customerId: 0,
        policy: {
          id: 0,
          scope: {
            id: 0,
            parameters: {
              validUntil: thirtyDaysLaterFromEpochInSeconds() - 1
            }
          }
        },
        commitment: getNextCommitment()
      }
    })

    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toHaveProperty('result')
  })

  it(`${should} fail when attemtping to store the same commitment twice`, async () => {
    const client = testClient(customers, {})

    createTestCustomerInRepository()

    const commitment = getNextCommitment()

    await client.recordCompliancy.$post({
      json: {
        customerId: 0,
        policy: {
          id: 0,
          scope: {
            id: 0,
            parameters: {
              validUntil: thirtyDaysLaterFromEpochInSeconds() - 1
            }
          }
        },
        commitment
      }
    })

    const res = await client.recordCompliancy.$post({
      json: {
        customerId: 0,
        policy: {
          id: 0,
          scope: {
            id: 0,
            parameters: {
              validUntil: thirtyDaysLaterFromEpochInSeconds() - 1
            }
          }
        },
        commitment
      }
    })

    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json).toEqual({
      error: 'DuplicateCommitment'
    })
  })
})

function createTestCustomerInRepository() {
  inMemoryCustomerRepository.register({
    firstName: 'a',
    lastName: 'a',
    email: 'a@a.a'
  })
}

function* testCommitmentGenerator(): Generator<string, string, unknown> {
  let value = 0

  while (true)
    yield '0x' + `0000000000000000000000000000000000000000000000000000000000000000${Number(value++).toString(16)}`.slice(-64)
}
