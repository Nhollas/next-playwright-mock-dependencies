import { Options, PaymentMethodPayload } from "braintree-web-drop-in"

type MockedBraintreeProps = {
  amount: number
  options: Options
  onSuccess: (payload: PaymentMethodPayload) => void
  onError: (err: unknown) => void
}

const MockedBraintree = ({ onSuccess, amount }: MockedBraintreeProps) => {
  return (
    <div>
      <h1>Mock Braintree</h1>
      <p>Amount: {amount}</p>
      <button
        onClick={() =>
          onSuccess({
            nonce: "mock-nonce",
            details: {
              cardholderName: "John Doe",
              expirationMonth: "12",
              expirationYear: "2026",
              bin: "400000",
              cardType: "Visa",
              lastFour: "1000",
              lastTwo: "00",
            },
            type: "CreditCard",
            liabilityShifted: true,
            liabilityShiftPossible: true,
            binData: {
              prepaid: "Unknown",
              healthcare: "Unknown",
              debit: "Unknown",
              durbinRegulated: "Unknown",
              commercial: "Unknown",
              payroll: "Unknown",
              issuingBank: "Unknown",
              countryOfIssuance: "Unknown",
              productId: "Unknown",
            },
          })
        }
      >
        Pay
      </button>
    </div>
  )
}

export default MockedBraintree
