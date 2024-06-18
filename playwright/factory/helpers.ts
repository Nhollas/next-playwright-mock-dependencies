import fs from "fs-extra"
import path from "path"

export const hasChanged = async (
  source: string,
  destination: string,
  exclusions: string[] = [],
): Promise<{ changed: boolean; path?: string }> => {
  try {
    const srcExists = await fs.pathExists(source)
    const destExists = await fs.pathExists(destination)

    if (!srcExists && destExists) {
      // Source file or directory was deleted
      console.log(
        `Removing ${destination} as it no longer exists in the source.`,
      )
      await fs.remove(destination)
      return { changed: false }
    }

    if (srcExists && !destExists) {
      // Destination file or directory does not exist
      return { changed: true, path: source }
    }

    const srcStats = await fs.stat(source)
    const destStats = await fs.stat(destination)

    if (srcStats.isDirectory() && destStats.isDirectory()) {
      const srcFiles = await fs.readdir(source)
      const destFiles = await fs.readdir(destination)

      const allFiles = new Set([...srcFiles, ...destFiles])

      for (const file of allFiles) {
        const srcFilePath = path.join(source, file)
        const destFilePath = path.join(destination, file)

        if (exclusions.includes(srcFilePath)) {
          continue
        }

        const result = await hasChanged(srcFilePath, destFilePath, exclusions)
        if (result.changed) {
          return result
        }
      }

      return { changed: false }
    } else {
      const [srcContent, destContent] = await Promise.all([
        fs.readFile(source, "utf-8"),
        fs.readFile(destination, "utf-8"),
      ])

      return { changed: srcContent !== destContent, path: source }
    }
  } catch (error) {
    return { changed: true, path: source }
  }
}
