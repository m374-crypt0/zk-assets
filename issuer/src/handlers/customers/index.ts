import { OpenAPIHono } from '@hono/zod-openapi'
import { createMiddleware } from 'hono/factory'
import { LocalOnChainSigner, type PrivateKey } from 'src/blockchain/localOnChainSigner'
import type { OnChainSigner } from 'src/blockchain/types/onChainSigner'
import { inMemoryCustomerRepository } from 'src/repositories/inMemoryCustomerRepository'
import { inMemoryPolicyRepository } from 'src/repositories/inMemoryPolicyRepository'
import type { CustomerRepository } from 'src/repositories/types/customerRepository'
import type { PolicyRepository } from 'src/repositories/types/policyRepository'
import routes from './routes'

type CustomerEnv = {
  Bindings: {
    customerRepository: CustomerRepository,
    policyRepository: PolicyRepository,
    onChainSigner: OnChainSigner,
    isTesting: boolean | undefined
  }
}

const injectRepositories = createMiddleware<CustomerEnv>(async (c, next) => {
  // NOTE: 'test' env set up a testing env (see in customers.test.ts)
  // As a result those lines won't be covered
  if (!c.env.isTesting) {
    c.env.customerRepository = inMemoryCustomerRepository
    c.env.policyRepository = inMemoryPolicyRepository
    c.env.onChainSigner = new LocalOnChainSigner(process.env['TEST_PRIVATE_KEY_01'] as PrivateKey)
  }

  await next()
})

export default new OpenAPIHono<CustomerEnv>()
  .openapi(routes['/recordCompliancy'](injectRepositories),
    async (c) => {
      const params = c.req.valid('json')

      if (!c.env.customerRepository.exists(params.customerId))
        return c.json({ error: 'This customer does not exist' }, 400)

      const policy = c.env.policyRepository.getFromId(params.policy.id)

      if (policy === undefined)
        return c.json({ error: 'This policy does not exist' }, 400)

      if (!policy.validateParameters(params.policy.scope.parameters))
        return c.json({ error: 'Bad policy parameters' }, 400)

      if (!policy.validateParameterValues(params.policy.scope.parameters))
        return c.json({ error: 'Bad policy parameter values' }, 400)

      let result: string

      try {
        result = await c.env.onChainSigner.storeCommitment(params.commitment)
      } catch (error) {
        const e = error as Error
        return c.json({ error: e.message }, 500)
      }

      return c.json({ result }, 200)
    })
