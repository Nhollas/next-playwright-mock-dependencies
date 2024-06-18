import fs from "fs-extra"
import path from "path"
import { exec } from "child_process"

const rootFilesToCopy: string[] = [
  "package.json",
  "next.config.mjs",
  "public",
  ".env.local",
  "src",
]

export const mirrorDir: string = path.join(__dirname, "mirror")
const rootDir: string = path.join(__dirname, "../")

const exclusions = [path.join(rootDir, "src/components/PaymentProvider.tsx")]

const readFile = async (filePath: string): Promise<string> =>
  fs.readFile(filePath, "utf-8")

const writeFile = async (filePath: string, content: string): Promise<void> =>
  fs.writeFile(filePath, content)

const replaceContent = (
  content: string,
  searchValue: RegExp | string,
  replaceValue: string,
): string => content.replace(searchValue, replaceValue)

const mockBraintree = async (mirrorDir: string): Promise<void> => {
  const filePath: string = path.join(
    mirrorDir,
    "src/components/PaymentProvider.tsx",
  )
  const fileContent: string = await readFile(filePath)
  const newContent: string = replaceContent(
    fileContent,
    'import("./Braintree")',
    'import("./MockedBraintree")',
  )
  await writeFile(filePath, newContent)
}

const setupTsConfig = async (mirrorDir: string): Promise<void> => {
  const filePath: string = path.join(mirrorDir, "tsconfig.json")
  const fileContent = `{
  "compilerOptions": {
    "baseUrl": ".",
    "target": "es2015",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true,
    "allowImportingTsExtensions": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}`
  await writeFile(filePath, fileContent)
}

const hasChanged = async (
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

const copyIfChanged = async (
  srcPath: string,
  destPath: string,
  exclusions: string[] = [],
): Promise<boolean> => {
  const { changed, path } = await hasChanged(srcPath, destPath, exclusions)
  if (changed) {
    console.log(`Detected change at ${path}, updating copy.`)
    await fs.copy(srcPath, destPath)
    return true
  }
  return false
}

const runBuild = async (mirrorDir: string): Promise<void> => {
  console.log("Running `npm run build` ...")
  return new Promise((resolve, reject) => {
    exec("npm run build", { cwd: mirrorDir }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Build failed: ${stderr}`)
        reject(error)
      } else {
        console.log(`Build success: ${stdout}`)
        resolve()
      }
    })
  })
}

const globalSetup = async (): Promise<void> => {
  await fs.ensureDir(mirrorDir)

  const changes: boolean[] = await Promise.all(
    rootFilesToCopy.map(async (file) => {
      const srcPath: string = path.join(rootDir, file)
      const destPath: string = path.join(mirrorDir, file)
      return copyIfChanged(srcPath, destPath, exclusions)
    }),
  )

  if (changes.some(Boolean)) {
    await mockBraintree(mirrorDir)
    await setupTsConfig(mirrorDir)
    await runBuild(mirrorDir)
  } else {
    console.log("No changes detected. Skipping `npm run build`")
  }
}

export default globalSetup
