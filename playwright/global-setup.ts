import path from "path"

import { application } from "./application"

const mirrorBuildDir: string = path.join(__dirname, "builds/mirror")
export const finalBuildDir: string = path.join(__dirname, "builds/final")

const globalSetup = async (): Promise<void> => {
  const mirrorApp = await application().setTargetDir(mirrorBuildDir).clone()

  const finalizedApp = await application()
    .setTargetDir(finalBuildDir)
    .clone(true)

  await finalizedApp
    .setupMock("src/components/PaymentProvider.tsx")
    .replacePartialContent(
      'import("./Braintree")',
      'import("./MockedBraintree")',
    )

  await finalizedApp
    .setupMock("src/lib/braintree.ts")
    .replaceContent(
      `export async function getClientToken() { return "mockClientToken" }`,
    )

  if (mirrorApp.isCurrentBuildOutdated) {
    await finalizedApp.build()
  } else {
    console.log("No changes detected. Skipping `npm run build`")
  }
}

export default globalSetup
