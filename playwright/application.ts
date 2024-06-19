import fs from "fs-extra"

import path from "path"

import { exec } from "child_process"
import { getAllFilePaths, syncFile } from "./factory/helpers"

const applicationDir = path.join(__dirname, "../")

const appPathsToCopy: string[] = [
  "package.json",
  "next.config.mjs",
  "public",
  ".env.local",
  "src",
  "tsconfig.json",
  "vitest.config.mts",
  "tailwind.config.ts",
  "postcss.config.mjs",
  "vitest.setup.mts",
]

export const application = () => {
  let targetDir: string

  const builder = {
    clone: async (_targetDir: string) => {
      await fs.remove(_targetDir)
      await fs.ensureDir(_targetDir)

      await fs.copy(targetDir, _targetDir)

      targetDir = _targetDir

      return builder
    },
    setupMock: (file: string) => {
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
    setTargetDir: (_targetDir: string) => {
      targetDir = _targetDir
      return self
    },
    create: async () => {
      await fs.ensureDir(targetDir)

      const [srcFilePaths, destFilePaths] = await Promise.all([
        getAllFilePaths(appPathsToCopy),
        getAllFilePaths([targetDir]),
      ])

      const syncResults: boolean[] = await Promise.all(
        srcFilePaths.map(async (file) => {
          const srcPath = path.join(applicationDir, file)
          const destPath = path.join(targetDir, file)

          const { changed } = await syncFile(srcPath, destPath)
          return changed
        }),
      )

      const filesToRemove = destFilePaths.filter(
        (file) => !srcFilePaths.includes(file.replace(targetDir + "/", "")),
      )

      await Promise.all(
        filesToRemove.map(async (file) => {
          await fs.remove(file)
          console.log(
            `Removed ${file} from destination as it no longer exists in source.`,
          )
        }),
      )

      const isCurrentBuildOutdated =
        syncResults.some((r) => r) || filesToRemove.length > 0

      return { ...builder, isCurrentBuildOutdated, dir: targetDir }
    },
  }

  return self
}
