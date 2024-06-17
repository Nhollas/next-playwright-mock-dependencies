import { test as setup } from "@playwright/test"
import { promises as fs } from "fs"

setup("Mock dependencies", async ({}) => {
  // change imports to point to mock dependencies.
  // Replace import("./Braintree") with import("./Braintree.mock")
  //"src/components/PaymentProvider.tsx"

  const filePath = "src/components/PaymentProvider.tsx"
  try {
    // Step 1: Read the content of the target file
    let content = await fs.readFile(filePath, "utf8")

    // Step 2: Replace imports with mock dependencies
    content = content.replace(
      /import\("\.\/Braintree"\)/g,
      'import("./BraintreeMock")',
    )

    // Step 3: Write the modified content back to the file
    await fs.writeFile(filePath, content, "utf8")

    console.log("Dependencies have been mocked successfully.")
  } catch (error) {
    console.error("Error mocking dependencies:", error)
  }
})
