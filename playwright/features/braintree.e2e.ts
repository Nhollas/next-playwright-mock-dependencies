import test from "../fixtures/next-fixture"
import { expect } from "@playwright/test"

test("We replace the braintree dropin with mock component.", async ({
  page,
}) => {
  await page.goto("/")

  await expect(
    page.getByRole("heading", { name: "Mock braintree" }),
  ).toBeVisible()
})
