import { z } from '@hono/zod-openapi'
import { policyParametersSchema } from '../policies/schemas'

export const recordCompliancyQueryParamsSchema = z.object({
  customerId: z
    .number()
    .min(0)
    .openapi({
      description: 'The identifier of a registered customer',
      example: 0
    }),
  policy: z
    .object({
      id: z
        .number()
        .min(0)
        .openapi({
          description: 'The identifier of an existing policy',
          example: 0
        }),
      scope: z
        .object({
          id: z
            .number()
            .min(0)
            .openapi({
              description: 'The identifier of the policy scope',
              example: 0
            })
          ,
          parameters: policyParametersSchema
        })
    })
    .openapi({
      description: 'The policy and its parameters'
    }),
  commitment: z
    .string()
    .regex(/^0x[0-9A-F]{64}$/i)
    .nonempty()
    .openapi({
      description: `A commitment, computed by the client and recorded on-chain
 given he customer is eligible regarding the policy. The value of this
 commitment is verified on-chain before store, to ensure it is
 cryptographically correct and not already stored`
    })
})
  .openapi({
    description: `Parameters needed to ensure a customer is compliant regarding a policy.
 A valid commitment must be provided for on-chain storage`
  })


export const recordCompliancyResponseSchema = z.object({
  result: z
    .string()
    .nonempty()
    .openapi({
      description: 'result of the compliancy check',
      example: true
    })
})
  .openapi({
    description: 'The result of compliancy between a customer and a specific policy. If true, the commitment is stored on-chain'
  })

export const recordCompliancyResponseErrorSchema = z.object({
  error: z
    .string()
    .min(1)
})
  .openapi({
    description: 'Explains the cause of error'
  })
