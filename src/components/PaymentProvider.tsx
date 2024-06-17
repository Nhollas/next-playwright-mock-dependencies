"use client"

import { Options } from "braintree-web-drop-in"
import dynamic from "next/dynamic"

const DynamicBraintree = dynamic(() => import("./Braintree"), {
  loading: () => <p>Loading...</p>,
})

type PaymentProviderProps = {
  clientToken: string
  amount: number
}

export const PaymentProvider = ({
  clientToken,
  amount,
}: PaymentProviderProps) => {
  const options: Options = {
    authorization: clientToken,
    container: "#dropin-container",
    dataCollector: true,
    threeDSecure: true,
  }

  return (
    <DynamicBraintree
      amount={amount}
      options={options}
      onSuccess={(payload) => console.log("success", payload)}
      onError={(e) => console.error("error", e)}
    />
  )
}
