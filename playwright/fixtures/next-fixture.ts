import { test as base } from "@playwright/test"

import { setupNextServer } from "../setup"
import { buildLocalUrl, createTestUtils } from "../utils"
import { mockAppDir } from "playwright/global-setup"

export const test = base.extend<
  {
    utils: ReturnType<typeof createTestUtils>
  },
  {
    port: string
  }
>({
  baseURL: async ({ port }, use) => {
    await use(buildLocalUrl(port))
  },
  utils: async ({ page }, use) => {
    const u = createTestUtils({ page })

    await use(u)
  },
  port: [
    async ({}, use) => {
      const port = await setupNextServer(mockAppDir)

      await use(port)
    },
    { auto: true, scope: "worker" },
  ],
})

export default test
