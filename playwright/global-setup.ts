import { applicationFactory } from "./applicationFactory"

const globalSetup = async (): Promise<void> => {
  const baseApplication = await applicationFactory().create({
    outputDir: "playwright/builds/base",
  })
  const clonedAppWithMockedDependencies = await baseApplication.clone({
    outputDir: "playwright/builds/mocked",
  })

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
