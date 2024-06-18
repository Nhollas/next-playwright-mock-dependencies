import fs from "fs-extra"

import path from "path"

import { exec } from "child_process"
import { hasChanged } from "./factory/helpers"

const applicationDir = path.join(__dirname, "../")

const appFilesToCopy: string[] = [
  "package.json",
  "next.config.mjs",
  "public",
  ".env.local",
  "src",
  "tsconfig.json",
  "vitest.config.mts",
  "vitest.setup.mts",
]

export const applicationFactory = () => {
  let targetDir: string

  let excludedFilePaths: string[] = []

  let isCurrentBuildOutdated: boolean = false

  const factory = {
    setupMock: (file: string) => {
      excludedFilePaths.push(path.join(applicationDir, file))

      const replacePartialContent = async (
        searchValue: RegExp | string,

        replaceValue: string,
      ) => {
        const filePath = path.join(targetDir, file)
        const fileContent = await fs.readFile(filePath, "utf-8")
        const newContent = fileContent.replace(searchValue, replaceValue)

        await fs.writeFile(filePath, newContent)
      }

      const replaceContent = async (content: string) => {
        const filePath = path.join(targetDir, file)

        await fs.writeFile(filePath, content)
      }

      return {
        replacePartialContent,
        replaceContent,
      }
    },
    isCurrentBuildOutdated,
    build: async () => {
      console.log("Running `npm run build` ...")

      return new Promise<void>((resolve, reject) => {
        exec("npm run build", { cwd: targetDir }, (error, stdout, stderr) => {
          if (error) {
            console.error(`Build failed: ${stderr}`)
            reject(error)
          } else {
            console.log(`Build success: ${stdout}`)
            resolve()
          }
        })
      })
    },
  }

  const self = {
    setTargetDir: (targetDir: string) => {
      const factory = applicationFactory()
      factory.setDir(targetDir)

      return factory
    },

    setDir: (dir: string) => {
      targetDir = dir
    },
    setupMock: (file: string) => {
      excludedFilePaths.push(path.join(applicationDir, file))

      const replacePartialContent = async (
        searchValue: RegExp | string,

        replaceValue: string,
      ) => {
        const filePath = path.join(targetDir, file)
        const fileContent = await fs.readFile(filePath, "utf-8")
        const newContent = fileContent.replace(searchValue, replaceValue)

        await fs.writeFile(filePath, newContent)
      }

      const replaceContent = async (content: string) => {
        const filePath = path.join(targetDir, file)

        await fs.writeFile(filePath, content)
      }

      return {
        replacePartialContent,
        replaceContent,
      }
    },

    create: async () => {
      await fs.ensureDir(targetDir)

      const result: boolean[] = await Promise.all(
        appFilesToCopy.map(async (file) => {
          const srcPath = path.join(applicationDir, file)
          const destPath = path.join(targetDir, file)

          const { changed, path: source } = await hasChanged(srcPath, destPath)
          if (changed) {
            console.log(`Detected change at ${source}, updating copy.`)
            await fs.copy(srcPath, destPath)
            return true
          }
          return false
        }),
      )

      console.log("result", result)

      isCurrentBuildOutdated = result.some((value) => value)

      return { isCurrentBuildOutdated, factory }
    },
  }

  return self
}
