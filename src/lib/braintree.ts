import { BraintreeGateway, Environment } from "braintree"

import { env } from "./env"

const {
  BRAINTREE_MERCHANT_ID,
  BRAINTREE_PUBLIC_KEY,
  BRAINTREE_PRIVATE_KEY,
  BRAINTREE_MERCHANT_ACCOUNT_ID,
} = env

export async function getClientToken() {
  const gateway = new BraintreeGateway({
    environment: Environment.Sandbox,

    merchantId: BRAINTREE_MERCHANT_ID,

    publicKey: BRAINTREE_PUBLIC_KEY,

    privateKey: BRAINTREE_PRIVATE_KEY,
  })

  const { clientToken } = await gateway.clientToken.generate({
    merchantAccountId: BRAINTREE_MERCHANT_ACCOUNT_ID,
  })

  return clientToken
}
