import fs from "fs-extra"

import path from "path"

import util from "node:util"

const exec = util.promisify(require("node:child_process").exec)

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

/**
 * Recursively gets all file paths from the provided directories.
 * @param filePaths - Array of file or directory paths.
 * @returns Array of all file paths.
 */
export const getAllFilePaths = async (
  filePaths: string[],
): Promise<string[]> => {
  const allFiles = new Set<string>()

  const processFile = async (file: string) => {
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

  await Promise.all(filePaths.map(processFile))

  return Array.from(allFiles)
}

/**
 * Synchronizes a file from source to destination.
 * @param source - Source file path.
 * @param destination - Destination file path.
 * @returns An object indicating whether the file had to be deleted, created, or updated.
 */
export const syncFile = async (
  source: string,
  destination: string,
  targetDirectory: string,
): Promise<{ hasFileChanged: boolean }> => {
  try {
    const [srcExists, destExists] = await Promise.all([
      fs.pathExists(source),
      fs.pathExists(destination),
    ])

    // Calculate the relative path for logging
    const relativeDestPath = path.relative(targetDirectory, destination)

    if (!srcExists && destExists) {
      // Source file or directory was deleted
      console.log(
        `Removing \`${relativeDestPath}\` as it no longer exists in the source.`,
      )
      await fs.remove(destination)
      return { hasFileChanged: true }
    }

    if (srcExists && !destExists) {
      // Destination file or directory does not exist
      await fs.copy(source, destination)
      console.log(`Creating \`${relativeDestPath}\` as it does not exist.`)
      return { hasFileChanged: true }
    }

    if (srcExists && destExists) {
      const [srcContent, destContent] = await Promise.all([
        fs.readFile(source, "utf-8"),
        fs.readFile(destination, "utf-8"),
      ])

      if (srcContent !== destContent) {
        await fs.copy(source, destination)
        console.log(`Updating \`${relativeDestPath}\` as it has changed.`)
        return { hasFileChanged: true }
      }
    }

    return { hasFileChanged: false }
  } catch (error) {
    console.error(`Error syncing file from ${source} to ${destination}:`, error)
    throw error
  }
}

/**
 * Factory function to create an application instance.
 * @returns Application instance.
 */
export const applicationFactory = () => {
  let _targetDirectory: string

  const builder = {
    clone: async ({ outputDir }: { outputDir: string }) => {
      const currentTargetDir = _targetDirectory
      _targetDirectory = path.join(applicationDir, outputDir)

      await fs.remove(_targetDirectory)
      await fs.ensureDir(_targetDirectory)
      await fs.copy(currentTargetDir, _targetDirectory)

      return builder
    },
    editFile: (file: string) => {
      const replacePartialContent = async (
        searchValue: RegExp | string,
        replaceValue: string,
      ) => {
        const filePath = path.join(_targetDirectory, file)
        const fileContent = await fs.readFile(filePath, "utf-8")
        const newContent = fileContent.replace(searchValue, replaceValue)

        await fs.writeFile(filePath, newContent)
      }

      const replaceContent = async (content: string) => {
        const filePath = path.join(_targetDirectory, file)
        await fs.writeFile(filePath, content)
      }

      return {
        replacePartialContent,
        replaceContent,
      }
    },
    build: async () => {
      console.log("Running `npm run build` ...")

      const startTime = Date.now()
      const { stdout, stderr } = await exec("npm run build", {
        cwd: _targetDirectory,
      })

      if (stderr) {
        console.error(stderr)
      }
      console.log(stdout)

      const srcDir = path.join(_targetDirectory, ".next")
      const destDir = path.join(applicationDir, ".next")

      await fs.move(srcDir, destDir, { overwrite: true })

      const endTime = Date.now()
      console.log(`Build completed in ${endTime - startTime}ms.`)
    },
  }

  const self = {
    create: async ({ outputDir }: { outputDir: string }) => {
      _targetDirectory = path.join(applicationDir, outputDir)
      await fs.ensureDir(_targetDirectory)

      const [srcFilePaths, destFilePaths] = await Promise.all([
        getAllFilePaths(appPathsToCopy),
        getAllFilePaths([_targetDirectory]),
      ])

      const haveAnyFilesChanged = await Promise.all(
        srcFilePaths.map(async (file) => {
          const srcPath = path.join(applicationDir, file)
          const destPath = path.join(_targetDirectory, file)

          return await syncFile(srcPath, destPath, _targetDirectory)
        }),
      ).then((results) => results.some((r) => r.hasFileChanged))

      const filesToRemove = destFilePaths.filter(
        (file) =>
          !srcFilePaths.includes(file.replace(_targetDirectory + "/", "")),
      )

      await Promise.all(
        filesToRemove.map(async (file) => {
          await fs.remove(file)

          const relativePath = path.relative(_targetDirectory, file)
          console.log(
            `Removed ${relativePath} from destination as it no longer exists in source.`,
          )
        }),
      )

      const currentBuildExists = await fs.pathExists(
        path.join(applicationDir, ".next"),
      )
      const isCurrentBuildValid =
        haveAnyFilesChanged || filesToRemove.length > 0 || !currentBuildExists

      return { ...builder, isCurrentBuildValid }
    },
  }

  return self
}
