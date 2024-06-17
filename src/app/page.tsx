import { PaymentProvider } from "@/components/PaymentProvider"
import { getClientToken } from "@/lib/braintree"

export default async function Home() {
  const token = await getClientToken()

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <PaymentProvider clientToken={token} amount={10} />
    </main>
  )
}
