import path from "path"

import { applicationFactory } from "./applicationFactory"

const baseAppDir: string = path.join(__dirname, "builds/base")
export const mockAppDir: string = path.join(__dirname, "builds/mocked")

const globalSetup = async (): Promise<void> => {
  const baseApplication = await applicationFactory()
    .setTargetDir(baseAppDir)
    .create()

  const applicationWithMockedDependencies = await baseApplication.clone(
    mockAppDir,
  )

  await applicationWithMockedDependencies
    .editFile("src/components/PaymentProvider.tsx")
    .replacePartialContent(
      'import("./Braintree")',
      'import("./MockedBraintree")',
    )

  await applicationWithMockedDependencies
    .editFile("src/lib/braintree.ts")
    .replaceContent(
      `export async function getClientToken() { return "mockClientToken" }`,
    )

  if (baseApplication.isCurrentBuildOutdated) {
    await applicationWithMockedDependencies.build()
  } else {
    console.log("No changes detected. Skipping `npm run build`")
  }
}

export default globalSetup
