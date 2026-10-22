// Local preview: node server.mjs → http://localhost:3002/?surface=entrance-led
// Serves index.html and runs api/occupy.js the way Vercel would.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import handler from './api/occupy.js'
import live from './api/occupy/live.js'

const PORT = Number(process.env.PORT) || 3002

createServer(async (req, res) => {
  const path = new URL(req.url, 'http://x').pathname
  if (path === '/api/occupy/live') {
    let raw = ''
    for await (const chunk of req) raw += chunk
    req.body = raw
    const shim = {
      setHeader: (k, v) => res.setHeader(k, v),
      status(code) { res.statusCode = code; return this },
      json(body) { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(body)) },
    }
    return live(req, shim)
  }
  if (path === '/api/occupy') {
    const shim = {
      setHeader: (k, v) => res.setHeader(k, v),
      status(code) { res.statusCode = code; return this },
      json(body) { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(body)) },
    }
    return handler(req, shim)
  }
  if (path === '/' || path === '/occupy' || path === '/index.html') {
    res.setHeader('content-type', 'text/html; charset=utf-8')
    return res.end(await readFile(new URL('./index.html', import.meta.url)))
  }
  res.statusCode = 404
  res.end('not found')
}).listen(PORT, () => console.log(`Normies NODE: http://localhost:${PORT}/?surface=entrance-led`))
