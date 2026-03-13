import customer from "src";

import { randomBytes } from "crypto";

import { createTestClient, defineChain, http, } from "viem";
import { getBlock } from "viem/actions";
import { anvil } from "viem/chains";

import { BN254_FR_MODULUS } from "@aztec/bb.js";

export async function getValidProofForTesting(options: {
  privateInputs: {
    customer_id: string,
    customer_secret: string,
    authorized_sender: string
  },
  publicInputs: {
    policy: {
      id: string,
      scope: {
        id: string,
        parameters: Record<string, string | number | boolean>
      }
    },
    request: {
      sender: string,
      commitment: string
    }
  }
}) {

  const private_inputs = options.privateInputs
  const public_inputs = options.publicInputs

  return await customer.generateProof({ private_inputs, ...public_inputs })
}

export async function getTestingPublicInputs() {
  return {
    policy: getTestingPolicy(),
    request: await getTestingRequest()
  }
}

export function getTestingPolicy() {
  return {
    id: '0',
    scope: {
      id: '0',
      parameters: {
        valid_until: 1
      }
    }
  }
}

export function getTestingPrivateInputs() {
  return {
    customer_id: getTestingCustomerId(),
    authorized_sender: getTestingSender(),
    customer_secret: getTestingCustomerSecret()
  }
}

export function createCustomerSecret() {
  // NOTE: ensuring the secret holds in a Field value
  const customerSecret = BigInt(`0x${randomBytes(32).toString('hex')}`) % BN254_FR_MODULUS

  return customerSecret.toString()
}

export function getTestingCustomerId() {
  return '0';
}

export function getTestingCustomerSecret() {
  return '2'
}

export function getTestingSender() {
  return '0x0000000000000000000000000000000000000001'
}

async function getTestingCommitment() {
  return `0x${(await customer.createCommitment({
    private_inputs: getTestingPrivateInputs(),
    policy: getTestingPolicy()
  })).toString(16)}`
}

async function getTestingRequest() {
  return {
    sender: getTestingSender(),
    commitment: await getTestingCommitment()
  }
}

export async function registerUserUsingIssuerApi(nextSuffix: () => number) {
  const headers = new Headers()
  headers.append('Content-Type', 'application/json')

  const body = JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    // NOTE: Ensuring registration with different yet similar users
    email: `john.doe+${nextSuffix()}@unknown.ufo`
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

export async function recordCompliancyUsingIssuerApi(body: {
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

  const request = new Request({
    url: 'http://localhost:3000/customers/recordCompliancy',
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })

  const response = await fetch(request)

  const json = await response.json()

  const { result } = json as { result: boolean }

  return result
}
export function getRecordCompliancyBodyFromInputs(options: {
  policy: ReturnType<typeof getTestingPolicy>,
  commitment: `0x${string}`,
  customerId: string
}) {
  return {
    commitment: options.commitment,
    policy: {
      id: Number(options.policy.id),
      scope: {
        id: Number(options.policy.scope.id),
        parameters: {
          validUntil: options.policy.scope.parameters.valid_until
        }
      }
    },
    customerId: Number(options.customerId)
  }
}

export async function forwardOnChainTimestamp(seconds: number) {
  const clientConfig: Parameters<typeof createTestClient>[0] = {
    chain: defineChain({
      ...anvil,
      id: 1,
    }),
    mode: 'anvil',
    transport: http(`http://${process.env['ANVIL_HOST']}:${process.env['ANVIL_PORT']}`)
  }

  const client = createTestClient(clientConfig)
  const lastBlock = await getBlock(client)
  const timestamp = lastBlock.timestamp

  await client.setNextBlockTimestamp({ timestamp: timestamp + BigInt(seconds) })
  await client.mine({ blocks: 1 })
}
