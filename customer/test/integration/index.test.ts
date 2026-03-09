import customer from "src";

import { LocalOnChainProver } from 'src/blockchain/localOnChainProver';
import type { OnChainProver } from "src/blockchain/types/onChainProver";
import { privateKeyToAccount } from "viem/accounts";

import { createCustomerSecret, getValidProofAndPublicInputs } from "test/utility";

import { describe, expect, it } from "bun:test";

const should = '<integration> should'

describe('Proof submission to blockchain', () => {
  it(`${should} fail to prove on-chain with an unexisting commitment`, async () => {
    const { proof, publicInputs } = await getValidProofAndPublicInputs();
    expect(await customer.verifyProofLocally({ proof, publicInputs })).toBeTrue()

    publicInputs.request.commitment = '42'
    const onChainProver: OnChainProver = new LocalOnChainProver()

    expect(async () => customer.verifyProofOnChain({
      onChainProver,
      proof,
      publicInputs
    })).toThrow('InvalidCommitment')
  })

  it(`${should} fail to prove on-chain with an invalid public input set`, async () => {
    const privateInputs: Parameters<typeof getValidProofAndPublicInputs>[0] = {
      customer_id: (await registerUserUsingIssuerApi()).toString(),
      customer_secret: createCustomerSecret(),
      authorized_sender: privateKeyToAccount(process.env['TEST_PRIVATE_KEY_03']! as `0x${string}`).address
    }

    const { proof, publicInputs } = await getValidProofAndPublicInputs(privateInputs);
    expect(await customer.verifyProofLocally({ proof, publicInputs })).toBeTrue()

    await recordCompliancyUsingIssuerApi({
      customerId: Number(privateInputs.customer_id),
      policy: {
        id: Number(publicInputs.policy.id),
        scope: {
          id: Number(publicInputs.policy.scope.id),
          parameters: {
            validUntil: Number(publicInputs.policy.scope.parameters.valid_until)
          }
        }
      },
      commitment: `0x${BigInt(publicInputs.request.commitment).toString(16)}`
    })

    publicInputs.request.sender = '0xb27542cc8c84c215fa2e4932cfc61245cd1a1514'
    const onChainProver: OnChainProver = new LocalOnChainProver()

    expect(async () => customer.verifyProofOnChain({
      onChainProver,
      proof,
      publicInputs
    })).toThrow('InvalidProof')
  })
})

async function recordCompliancyUsingIssuerApi(options: {
  customerId: number,
  policy: {
    id: number,
    scope: {
      id: number,
      parameters: Record<string, string | number | boolean>
    }
  },
  commitment: string
}) {
  const headers = new Headers()
  headers.append('Content-Type', 'application/json')

  const body = JSON.stringify({
    customerId: options.customerId,
    policy: options.policy,
    commitment: options.commitment
  })

  const request = new Request({
    url: 'http://localhost:3000/customers/recordCompliancy',
    method: 'POST',
    headers,
    body
  })

  const response = await fetch(request)

  const { result } = await response.json() as { result: boolean }

  return result
}

async function registerUserUsingIssuerApi() {
  const headers = new Headers()
  headers.append('Content-Type', 'application/json')

  const body = JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@unknown.ufo'
  })

  const request = new Request({
    url: 'http://localhost:3000/prospects/register',
    method: 'POST',
    headers,
    body
  })

  const response = await fetch(request)

  const { id } = await response.json() as { id: number }

  return id
}
