import path from "path"

import { projectCloner } from "./projectCloner"

const mirrorBuildDir: string = path.join(__dirname, "builds/mirror")
export const finalBuildDir: string = path.join(__dirname, "builds/final")

const globalSetup = async (): Promise<void> => {
  const mirrorBuild = await projectCloner().setTargetDir(mirrorBuildDir).clone()

  const finalBuild = await projectCloner()
    .setTargetDir(finalBuildDir)
    .clone(true)

  await finalBuild.builder
    .setupMock("src/components/PaymentProvider.tsx")
    .replacePartialContent(
      'import("./Braintree")',
      'import("./MockedBraintree")',
    )

  await finalBuild.builder
    .setupMock("src/lib/braintree.ts")
    .replaceContent(
      `export async function getClientToken() { return "mockClientToken" }`,
    )

  if (mirrorBuild.isCurrentBuildOutdated) {
    await finalBuild.builder.build()
  } else {
    console.log("No changes detected. Skipping `npm run build`")
  }
}

export default globalSetup
