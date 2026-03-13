import customer from "src";

import type { PolicyInputs, PrivateInputs, PublicInputs } from "src/types";

import { LocalOnChainProver } from 'src/blockchain/localOnChainProver';
import type { OnChainProver } from "src/blockchain/types/onChainProver";

import { createCustomerSecret, forwardOnChainTimestamp, getRecordCompliancyBodyFromInputs, getTestingCustomerId, getTestingPolicy, getValidProofForTesting, recordCompliancyUsingIssuerApi, registerUserUsingIssuerApi } from "test/utility";

import { beforeAll, describe, expect, it } from "bun:test";

import { toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const should = '<integration> should'

describe('Proof submission to blockchain', () => {
  const createCommitment = async (policy: PolicyInputs) =>
    toHex(await customer.createCommitment({ policy, private_inputs: privateInputs }), { size: 32 })

  // NOTE: testing policy parameter is set to 0, definitely expired
  const policy = getTestingPolicy()

  // NOTE: make sure several registration can be done in the same run
  let emailSuffix = 0

  let sender: `0x${string}`
  let privateInputs: PrivateInputs
  let onChainProver: OnChainProver;

  beforeAll(async () => {
    sender = privateKeyToAccount(process.env['TEST_PRIVATE_KEY_03'] as `0x${string}`).address
    onChainProver = new LocalOnChainProver({ sender })
    await registerUserUsingIssuerApi(() => emailSuffix++)
    privateInputs = {
      authorized_sender: sender,
      customer_id: getTestingCustomerId(),
      customer_secret: createCustomerSecret()
    }
  })

  it(`${should} fail to prove on-chain with an expired policy`, async () => {
    // NOTE: the commitment is correct but not stored on-chain
    const commitment = await createCommitment(policy)

    const publicInputs: PublicInputs = {
      policy,
      request: {
        sender,
        commitment
      }
    }

    const proof = await getValidProofForTesting({ privateInputs, publicInputs });

    expect(await customer.verifyProofLocally({ proof, publicInputs })).toBeTrue()

    expect(async () => customer.verifyProofOnChain({
      onChainProver,
      proof,
      publicInputs
    })).toThrow('ValidityExpired')
  })

  it(`${should} fail to prove on-chain with an unexisting commitment`, async () => {
    // NOTE: ensures this policy parameter is high enough to not fail in the Prover smart contract
    policy.scope.parameters.valid_until = await onChainProver.timestamp() + 3600

    // NOTE: the commitment is correct but not stored on-chain
    const commitment = await createCommitment(policy)

    const publicInputs: PublicInputs = {
      policy,
      request: {
        sender,
        commitment
      }
    }

    const proof = await getValidProofForTesting({ privateInputs, publicInputs });

    expect(await customer.verifyProofLocally({ proof, publicInputs })).toBeTrue()

    expect(async () => customer.verifyProofOnChain({
      onChainProver,
      proof,
      publicInputs
    })).toThrow('InvalidCommitment')
  })

  it(`${should} fail to prove on-chain with mismatch proof and public input set`, async () => {
    // NOTE: ensures this policy parameter is high enough to not fail in the Prover smart contract
    policy.scope.parameters.valid_until = await onChainProver.timestamp() + 3600

    const commitment = await createCommitment(policy)

    await recordCompliancyUsingIssuerApi(getRecordCompliancyBodyFromInputs({
      policy,
      customerId: privateInputs.customer_id,
      commitment
    }))

    const publicInputs: PublicInputs = {
      policy,
      request: {
        sender,
        commitment
      }
    }
    const proof = await getValidProofForTesting({ privateInputs, publicInputs });
    expect(await customer.verifyProofLocally({ proof, publicInputs })).toBeTrue()

    publicInputs.policy.scope.id = '42'

    expect(() => customer.verifyProofOnChain({
      onChainProver,
      proof,
      publicInputs
    })).toThrowError('InvalidProof')
  })

  it(`${should} succeeds to prove on-chain with a valid public input set`, async () => {
    // NOTE: ensures this policy parameter is high enough to not fail in the Prover smart contract
    policy.scope.parameters.valid_until = await onChainProver.timestamp() + 3600

    const commitment = await createCommitment(policy)

    await recordCompliancyUsingIssuerApi(getRecordCompliancyBodyFromInputs({
      policy,
      customerId: privateInputs.customer_id,
      commitment
    }))

    const publicInputs: PublicInputs = {
      policy,
      request: {
        sender,
        commitment
      }
    }

    const proof = await getValidProofForTesting({ privateInputs, publicInputs });
    expect(await customer.verifyProofLocally({ proof, publicInputs })).toBeTrue()

    const result = await customer.verifyProofOnChain({
      onChainProver,
      proof,
      publicInputs
    })

    expect(result).toBeTrue()
  })

  it(`${should} fail to prove on-chain with valid but expired proof`, async () => {
    // NOTE: ensures this policy parameter is high enough to not fail in the Prover smart contract
    policy.scope.parameters.valid_until = await onChainProver.timestamp() + 3600

    const commitment = await createCommitment(policy)

    await recordCompliancyUsingIssuerApi(getRecordCompliancyBodyFromInputs({
      policy,
      customerId: privateInputs.customer_id,
      commitment
    }))

    const publicInputs: PublicInputs = {
      policy,
      request: {
        sender,
        commitment
      }
    }

    const proof = await getValidProofForTesting({ privateInputs, publicInputs });
    expect(await customer.verifyProofLocally({ proof, publicInputs })).toBeTrue()

    await forwardOnChainTimestamp(3600 + 1);

    expect(() => customer.verifyProofOnChain({
      onChainProver,
      proof,
      publicInputs
    })).toThrowError('ValidityExpired')
  })
})
