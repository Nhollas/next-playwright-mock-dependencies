import fs from "fs-extra"
import path from "path"

export const getAllFilePaths = async (files: string[]): Promise<string[]> => {
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

export const syncFile = async (
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
