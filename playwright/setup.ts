import { createServer, Server } from "http"
import { AddressInfo } from "net"
import { parse } from "url"

import next from "next"
import { finalBuildDir } from "./global-setup"

export const setupNextServer = async () => {
  const app = next({ dev: false, dir: finalBuildDir })
  const handle = app.getRequestHandler()

  await app.prepare()

  const server: Server = await new Promise((resolve) => {
    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url as string, true)
      handle(req, res, parsedUrl)
    })

    server.listen((error: any) => {
      if (error) throw error
      resolve(server)
    })
  })

  const port = String((server.address() as AddressInfo).port)

  return port
}
