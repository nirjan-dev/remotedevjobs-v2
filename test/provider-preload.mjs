// Loaded only by the disposable production server spawned by the HTTP tests.
import http from 'node:http'
import https from 'node:https'
import { syncBuiltinESMExports } from 'node:module'

const fixture = new URL(process.env.INTERNAL_WORK_FIXTURE_ORIGIN)
if (fixture.hostname !== '127.0.0.1' || fixture.protocol !== 'http:') {
  throw new Error('The provider fixture must be an HTTP loopback listener')
}
const attempts = []
const loopback = hostname => ['127.0.0.1', 'localhost', '[::1]', '::1'].includes(hostname)
const originalFetch = globalThis.fetch

globalThis.fetch = async function (input, init) {
  const url = new URL(input instanceof Request ? input.url : input)
  if (loopback(url.hostname)) return originalFetch(input, init)
  attempts.push(url.href)
  if (url.origin === 'https://remotive.com' && url.pathname === '/api/remote-jobs') {
    const target = new URL('/remotive', fixture)
    target.search = url.search
    return originalFetch(target, init)
  }
  throw new Error(`Test blocked outbound fetch: ${url.origin}${url.pathname}`)
}

// Also prevent accidental provider access via Node's HTTP clients rather than fetch.
for (const client of [http, https]) {
  for (const method of ['request', 'get']) {
    const original = client[method]
    client[method] = function (input, ...rest) {
      const hostname = typeof input === 'string' || input instanceof URL
        ? new URL(input).hostname
        : input.hostname || input.host || 'localhost'
      if (!loopback(hostname)) {
        attempts.push(`${method}:${hostname}`)
        throw new Error(`Test blocked outbound HTTP: ${hostname}`)
      }
      return original.call(this, input, ...rest)
    }
  }
}
syncBuiltinESMExports()

// A round trip makes denied-call assertions independent of IPC delivery timing.
process.on('message', (message) => {
  if (message?.type === 'internal-work-attempts') {
    process.send?.({ type: 'internal-work-attempts', id: message.id, attempts })
  }
})
