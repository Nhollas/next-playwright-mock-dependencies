import path from "path"

import { applicationFactory } from "./applicationFactory"

const baseAppBuildDirectory: string = path.join(__dirname, "builds/base")
export const mockedAppBuildDirectory: string = path.join(
  __dirname,
  "builds/mocked",
)

const globalSetup = async (): Promise<void> => {
  const baseApplication = await applicationFactory().create(
    baseAppBuildDirectory,
  )
  const clonedAppWithMockedDependencies = await baseApplication.clone(
    mockedAppBuildDirectory,
  )

  await clonedAppWithMockedDependencies
    .editFile("src/components/PaymentProvider.tsx")
    .replacePartialContent(
      'import("./Braintree")',
      'import("./MockedBraintree")',
    )

  await clonedAppWithMockedDependencies
    .editFile("src/lib/braintree.ts")
    .replaceContent(
      `export async function getClientToken() { return "mockClientToken" }`,
    )

  if (baseApplication.isCurrentBuildOutdated) {
    await clonedAppWithMockedDependencies.build()
  } else {
    console.log("No changes detected. Skipping `npm run build`")
  }
}

export default globalSetup
