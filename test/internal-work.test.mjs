import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { InternalWorkHarness, fixtureJob } from './internal-work-helpers.mjs'

const harness = new InternalWorkHarness()
const endpoints = [
  '/api/ingest/devremote',
  '/api/ingest/fourdayweek',
  '/api/ingest/himalayas',
  '/api/ingest/remoteok',
  '/api/ingest/remotive',
  '/api/ingest/trulyremote',
  '/api/ingest/workingnomads',
  '/api/queue/process',
]
const authorized = () => ({ authorization: `Bearer ${harness.token}` })
const rejectedMethod = status => assert.ok([404, 405].includes(status), `Expected method rejection (404/405), received ${status}`)

// Register teardown before setup so partially failed fixture startup is cleaned up too.
const interrupts = new Map(['SIGINT', 'SIGTERM'].map((signal, index) => {
  const listener = () => {
    void harness.close().then(
      () => process.exit(index === 0 ? 130 : 143),
      (error) => {
        console.error(error)
        process.exit(1)
      },
    )
  }
  process.once(signal, listener)
  return [signal, listener]
}))
after(async () => {
  try {
    await harness.close()
  }
  finally {
    for (const [signal, listener] of interrupts) process.off(signal, listener)
  }
})
before(async () => {
  await harness.start()
}, { timeout: 120000 })

// Keep this as an independently selectable, security-invariant test. Against the
// original build it fails after reporting the actual GET response and mutation.
test('unauthenticated worker GET cannot mutate a seeded queue', { timeout: 30000 }, async (t) => {
  await harness.reset()
  await harness.seedQueue()
  const before = await harness.snapshot()
  const response = await harness.request('/api/queue/process')
  const state = await harness.snapshot()
  t.diagnostic(`GET /api/queue/process: status=${response.status}; body=${response.text}; queue=${before.job_queues.length}->${state.job_queues.length}; jobs=${before.jobs.length}->${state.jobs.length}`)
  assert.deepEqual(state, before, 'Anonymous worker GET mutated the seeded queue/database')
  assert.deepEqual(await harness.attempts(), [], 'Anonymous worker GET attempted provider I/O')
  assert.equal(harness.providerRequests.length, 0)
  rejectedMethod(response.status)
})

test('all internal POST routes reject absent, invalid, or non-header credentials without work', { timeout: 120000 }, async (t) => {
  await harness.reset()
  await harness.seedQueue()
  const variants = [
    { name: 'anonymous', options: {} },
    { name: 'wrong bearer', options: { headers: { authorization: 'Bearer wrong-test-token' } } },
    { name: 'wrong same-length bearer', options: { headers: { authorization: `Bearer ${harness.token.slice(0, -1)}${harness.token.endsWith('a') ? 'b' : 'a'}` } } },
    { name: 'malformed scheme', options: { headers: { authorization: `Basic ${harness.token}` } } },
    { name: 'missing bearer value', options: { headers: { authorization: 'Bearer' } } },
    { name: 'extra bearer material', options: { headers: { authorization: `Bearer ${harness.token} extra` } } },
    { name: 'query-only token', query: `?token=${harness.token}&workerToken=${harness.token}`, options: {} },
    { name: 'cookie-only token', options: { headers: { cookie: `token=${harness.token}; workerToken=${harness.token}; NUXT_WORKER_TOKEN=${harness.token}` } } },
    { name: 'body-only token', options: { headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: harness.token, workerToken: harness.token }) } },
  ]
  for (const endpoint of endpoints) {
    for (const variant of variants) {
      await t.test(`${endpoint}: ${variant.name}`, async () => {
        const response = await harness.assertNoWork(() => harness.request(endpoint + (variant.query || ''), { method: 'POST', ...variant.options }))
        assert.equal(response.status, 401)
        assert.equal(response.headers.get('www-authenticate'), 'Bearer')
      })
    }
  }
  assert.deepEqual(await harness.attempts(), [])
  assert.equal(harness.providerRequests.length, 0)
})

test('GET HEAD and unsupported methods never perform internal work even with a valid token', { timeout: 120000 }, async (t) => {
  await harness.reset()
  await harness.seedQueue()
  for (const endpoint of endpoints) {
    for (const method of ['GET', 'HEAD', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
      for (const authenticated of [false, true]) {
        await t.test(`${method} ${endpoint}: ${authenticated ? 'valid token' : 'anonymous'}`, async () => {
          const response = await harness.assertNoWork(() => harness.request(endpoint, { method, headers: authenticated ? authorized() : {} }))
          // OPTIONS may be answered generically, but must never execute the handler.
          if (method === 'OPTIONS') assert.ok(response.status < 500)
          else rejectedMethod(response.status)
          if (method === 'HEAD') assert.equal(response.text, '')
        })
      }
    }
  }
  assert.deepEqual(await harness.attempts(), [])
  assert.equal(harness.providerRequests.length, 0)
})

test('unconfigured worker secret fails closed on every internal POST route', { timeout: 120000 }, async (t) => {
  await harness.reset()
  await harness.seedQueue()
  const app = await harness.startApp('')
  for (const endpoint of endpoints) {
    for (const authenticated of [false, true]) {
      await t.test(`${endpoint}: ${authenticated ? 'bearer supplied' : 'anonymous'}`, async () => {
        const response = await harness.assertNoWork(() => harness.request(endpoint, {
          method: 'POST', headers: authenticated ? authorized() : {},
        }, app), app)
        assert.equal(response.status, 503)
      })
    }
  }
  assert.deepEqual(await harness.attempts(app), [])
  assert.equal(harness.providerRequests.length, 0)
})

test('authorized ingestion and processing persist a real relational job while public reads stay anonymous', { timeout: 60000 }, async () => {
  await harness.reset()
  const hitsBefore = harness.providerRequests.length
  const attemptsBefore = (await harness.attempts()).length
  const ingestion = await harness.request('/api/ingest/remotive', { method: 'POST', headers: authorized() })
  assert.equal(ingestion.status, 200, ingestion.text)
  assert.equal(ingestion.json().queuedCount, 1)
  assert.equal(harness.providerRequests.length, hitsBefore + 1)
  assert.equal(new URL(harness.providerRequests.at(-1), harness.fixtureOrigin).pathname, '/remotive')
  const attempts = await harness.attempts()
  assert.equal(attempts.length, attemptsBefore + 1)
  assert.equal(new URL(attempts.at(-1)).origin, 'https://remotive.com')
  const queued = await harness.snapshot()
  assert.equal(queued.job_queues.length, 1)
  assert.equal(queued.jobs.length, 0)
  assert.equal(queued.job_queues[0].link, fixtureJob.url)
  assert.equal(queued.job_queues[0].job_details.title, fixtureJob.title)
  assert.equal(queued.job_queues[0].job_details.company.name, fixtureJob.company_name)

  const processed = await harness.request('/api/queue/process', { method: 'POST', headers: authorized() })
  assert.equal(processed.status, 200, processed.text)
  const state = await harness.snapshot()
  assert.equal(state.job_queues.length, 0)
  for (const [table, rows] of Object.entries(state)) {
    if (table !== 'job_queues') assert.equal(rows.length, 1, `Expected one persisted ${table} record`)
  }
  const job = state.jobs[0]
  assert.equal(job.id, processed.json().jobId)
  assert.equal(job.link, fixtureJob.url)
  assert.equal(job.title, fixtureJob.title)
  assert.equal(job.description, fixtureJob.description)
  assert.equal(job.salary, fixtureJob.salary)
  assert.equal(job.posted_at, fixtureJob.publication_date.replace('Z', ''))
  assert.equal(state.companies[0].name, fixtureJob.company_name)
  for (const [column, table] of [['company_id', 'companies'], ['duration_id', 'durations'], ['role_id', 'roles'], ['experience_level_id', 'experience_levels']]) {
    assert.equal(job[column], state[table][0].id, `Persisted ${column} references its lookup`)
  }
  for (const [join, lookup, foreignKey] of [['jobs_to_locations', 'locations', 'location_id'], ['jobs_to_tags', 'tags', 'tag_id'], ['jobs_to_benefits', 'benefits', 'benefit_id']]) {
    assert.equal(state[join][0].job_id, job.id)
    assert.equal(state[join][0][foreignKey], state[lookup][0].id)
  }
  assert.deepEqual(await harness.attempts(), attempts, 'Queue processing must not fetch providers')

  const empty = await harness.assertNoWork(() => harness.request('/api/queue/process', { method: 'POST', headers: authorized() }))
  assert.equal(empty.status, 200)
  assert.equal(empty.json().message, 'No jobs in queue')

  const listing = await harness.assertNoWork(() => harness.request('/api/jobs'))
  assert.equal(listing.status, 200)
  assert.equal(listing.json().meta.total, 1)
  assert.equal(listing.json().data[0].id, job.id)
  const detail = await harness.assertNoWork(() => harness.request(`/api/jobs/${job.slug}`))
  assert.equal(detail.status, 200)
  assert.equal(detail.json().id, job.id)
  const filters = await harness.assertNoWork(() => harness.request('/api/filters'))
  assert.equal(filters.status, 200)
  assert.ok(filters.json().roles.some(role => role.slug === state.roles[0].slug))
  const metadata = await harness.assertNoWork(() => harness.request(`/api/metadata/company/${state.companies[0].slug}`))
  assert.equal(metadata.status, 200)
  assert.equal(metadata.json().name, fixtureJob.company_name)
  const sitemap = await harness.assertNoWork(() => harness.request('/api/_sitemap-urls'))
  assert.equal(sitemap.status, 200)
  assert.ok(sitemap.json().some(entry => new URL(entry.loc).pathname === `/jobs/${job.slug}`))

  // Inspect real Nuxt HTML/payload serialization, not source/runtime-config internals.
  const beforePage = await harness.snapshot()
  const page = await harness.request('/')
  assert.deepEqual(await harness.snapshot(), beforePage, 'Public page request changed the database')
  assert.equal(page.status, 200)
  assert.ok(!page.text.includes(harness.token), 'Private worker secret leaked into serialized Nuxt output')
})
