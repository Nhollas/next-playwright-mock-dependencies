import fs from "fs-extra"

import path from "path"

import { exec } from "child_process"

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

const getAllFilePaths = async (files: string[]): Promise<string[]> => {
  const allFiles = new Set<string>()

  for (const file of files) {
    const stats = await fs.stat(file)

    if (stats.isDirectory()) {
      const subFiles = await fs.readdir(file)
      const subPaths = subFiles.map((subFile) => path.join(file, subFile))

      const subFilePaths = await getAllFilePaths(subPaths)
      subFilePaths.forEach((subFilePath) => allFiles.add(subFilePath))
    } else {
      allFiles.add(file)
    }
  }

  return Array.from(allFiles)
}

const syncFile = async (
  source: string,
  destination: string,
): Promise<{ changed: boolean; path: string }> => {
  const srcExists = await fs.pathExists(source)
  const destExists = await fs.pathExists(destination)

  if (!srcExists && destExists) {
    // Source file or directory was deleted
    console.log(`Removing ${destination} as it no longer exists in the source.`)
    await fs.remove(destination)
    return { changed: true, path: source }
  }

  if (srcExists && !destExists) {
    // Destination file or directory does not exist
    await fs.copy(source, destination)
    console.log(`Creating ${destination} as it does not exist.`)
    return { changed: true, path: source }
  }

  if (srcExists && destExists) {
    const [srcContent, destContent] = await Promise.all([
      fs.readFile(source, "utf-8"),
      fs.readFile(destination, "utf-8"),
    ])

    if (srcContent !== destContent) {
      await fs.copy(source, destination)
      console.log(`Updating ${destination} as it has changed.`)
      return { changed: true, path: source }
    }
  }

  return { changed: false, path: source }
}

export const applicationFactory = () => {
  let targetDir: string

  const builder = {
    clone: async (_targetDir: string) => {
      await fs.remove(_targetDir)
      await fs.ensureDir(_targetDir)

      await fs.copy(targetDir, _targetDir)

      targetDir = _targetDir

      return builder
    },
    editFile: (file: string) => {
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
