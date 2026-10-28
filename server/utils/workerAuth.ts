import { Buffer } from 'node:buffer'
import { timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

export function requireWorkerAuthorization(event: H3Event) {
  const token = useRuntimeConfig(event).workerToken
  if (!token) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Worker access is not configured',
    })
  }

  const credentials = getHeader(event, 'authorization')?.match(/^Bearer ([^\s]+)$/i)
  const supplied = Buffer.from(credentials?.[1] ?? '')
  const expected = Buffer.from(token)

  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    setResponseHeader(event, 'WWW-Authenticate', 'Bearer')
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }
}
