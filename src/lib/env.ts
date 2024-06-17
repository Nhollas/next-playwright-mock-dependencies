import { z } from "zod"

export const env = z
  .object({
    BRAINTREE_MERCHANT_ID: z.string(),
    BRAINTREE_PUBLIC_KEY: z.string(),
    BRAINTREE_PRIVATE_KEY: z.string(),
    BRAINTREE_MERCHANT_ACCOUNT_ID: z.string(),
  })
  .parse(process.env)
