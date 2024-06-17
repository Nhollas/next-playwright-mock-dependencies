import fs from "fs-extra"
import path from "path"
import { exec } from "child_process"

const rootFilesToCopy = [
  "tsconfig.json",
  "package.json",
  "package-lock.json",
  "next.config.mjs",
  "public",
  ".env.local",
  "next-env.d.ts",
  "tailwind.config.ts",
  "postcss.config.mjs",
  ".gitignore",
  "vitest.config.mts",
  "vitest.setup.mts",
]

import { chromium, type FullConfig } from "@playwright/test"

async function globalSetup(config: FullConfig) {
  const tempDir = path.join(__dirname, "temp")

  try {
    // Step 1: Create a temporary directory
    await fs.ensureDir(tempDir)

    // Step 2: Copy src from root directory to the temporary directory, excluding specified files and directories
    await fs.copy(
      path.join(__dirname, "../src"), // Adjusted path to point to the root directory
      path.join(tempDir, "src"),
    )

    for (const file of rootFilesToCopy) {
      await fs.copy(file, path.join(tempDir, file))
    }

    // Step 3: Modify files in the temporary directory to mock dependencies
    // (You would need to add the actual logic for modifying your files here)
    // Example:
    const filePath = path.join(tempDir, "src/components/PaymentProvider.tsx")
    let fileContent = await fs.readFile(filePath, "utf-8")
    fileContent = fileContent.replace(
      /import\("\.\/Braintree"\)/g,
      'import("./MockedBraintree")',
    )
    await fs.writeFile(filePath, fileContent)

    // Step 4: Run `npm run build` to create a build based on the modified files
    await new Promise((resolve, reject) => {
      exec("npm run build", { cwd: tempDir }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Build failed: ${stderr}`)
          reject(error)
        } else {
          console.log(`Build success: ${stdout}`)
          resolve(stdout)
        }
      })
    })
  } catch (error) {
    console.error(`Error during global setup: ${error}`)
    throw error
  }
}

export default globalSetup
