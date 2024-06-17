import {
  create,
  Dropin,
  Options,
  PaymentMethodPayload,
} from "braintree-web-drop-in"

import { useEffect, useRef, useState } from "react"

type BraintreeProps = {
  amount: number
  options: Options
  onSuccess: (payload: PaymentMethodPayload) => void
  onError: (err: unknown) => void
}

const Braintree = ({ onSuccess, onError, options, amount }: BraintreeProps) => {
  const dropinInstance = useRef<Dropin | undefined>(undefined)
  const [isDomLoaded, setIsDomLoaded] = useState(false)

  useEffect(() => {
    /*
      This delay is required to ensure that the DOM is
      loaded before we try to initialize Braintree.
    */
    setIsDomLoaded(true)
  }, [])

  useEffect(() => {
    if (!isDomLoaded) {
      return
    }

    async function handlePaymentMethodRequestable() {
      if (!dropinInstance.current) {
        return
      }

      dropinInstance.current
        .requestPaymentMethod({
          threeDSecure: {
            amount: amount.toPrecision(2),
          },
        })
        .then((payload) => {
          switch (payload.type) {
            case "CreditCard":
              {
                if (!payload.liabilityShifted) {
                  onError("Liability not shifted")
                  return
                }
              }

              onSuccess(payload)
          }
        })
        .catch(onError)
    }

    function initializeBraintree() {
      if (dropinInstance.current) {
        dropinInstance.current.teardown()
      }

      create(options)
        .then((instance) => {
          dropinInstance.current = instance

          instance.on(
            "paymentMethodRequestable",
            handlePaymentMethodRequestable,
          )

          if (instance.isPaymentMethodRequestable()) {
            handlePaymentMethodRequestable()
          }
        })
        .catch(onError)
    }

    initializeBraintree()

    return () => {
      if (dropinInstance.current) {
        dropinInstance.current.teardown()
      }
    }
  }, [onError, onSuccess, options, amount, isDomLoaded])

  return <div data-testid="braintree-payment" id="dropin-container"></div>
}

export default Braintree
