import path from "path"

import { applicationFactory } from "./applicationFactory"

const mirrorBuildDir: string = path.join(__dirname, "builds/mirror")
export const finalBuildDir: string = path.join(__dirname, "builds/final")

const globalSetup = async (): Promise<void> => {
  const { isCurrentBuildOutdated } = await applicationFactory()
    .setTargetDir(mirrorBuildDir)
    .create()

  const { factory: finalBuild } = await applicationFactory()
    .setTargetDir(finalBuildDir)
    .create()

  await finalBuild
    .setupMock("src/components/PaymentProvider.tsx")
    .replacePartialContent(
      'import("./Braintree")',
      'import("./MockedBraintree")',
    )

  await finalBuild
    .setupMock("src/lib/braintree.ts")
    .replaceContent(
      `export async function getClientToken() { return "mockClientToken" }`,
    )

  if (isCurrentBuildOutdated) {
    await finalBuild.build()
  } else {
    console.log("No changes detected. Skipping `npm run build`")
  }
}

export default globalSetup
