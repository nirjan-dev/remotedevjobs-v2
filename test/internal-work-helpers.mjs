import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { spawn, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile, access } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createServer as createNetServer } from 'node:net'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const exec = promisify(execFile)
const root = fileURLToPath(new URL('../', import.meta.url))
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const tables = ['benefits', 'companies', 'durations', 'experience_levels', 'job_queues', 'jobs', 'jobs_to_benefits', 'jobs_to_locations', 'jobs_to_tags', 'locations', 'roles', 'tags']
export const fixtureJob = {
  id: 980001,
  title: 'Senior Backend Engineer',
  company_name: 'Regression Fixture Company',
  company_logo_url: 'https://fixture.invalid/logo.png',
  url: 'https://fixture.invalid/jobs/backend-980001',
  job_type: 'full_time',
  publication_date: '2026-01-01T12:00:00Z',
  candidate_required_location: 'Worldwide',
  salary: '$100000',
  description: '<p>Synthetic backend engineering with health insurance.</p>',
  tags: ['Node.js'],
}
export const queuedJob = {
  title: fixtureJob.title,
  description: fixtureJob.description,
  link: fixtureJob.url,
  slug: 'regression-worker-fixture',
  salary: fixtureJob.salary,
  postedAt: fixtureJob.publication_date,
  company: { name: fixtureJob.company_name, slug: 'regression-fixture-company', logo: '', description: '' },
  duration: { name: 'Full Time', slug: 'full-time' },
  role: { name: 'Backend', slug: 'backend' },
  experienceLevel: { name: 'Senior', slug: 'senior' },
  locations: [{ name: 'Worldwide', slug: 'worldwide' }],
  tags: [{ name: 'Node.js', slug: 'nodejs' }],
  benefits: [{ name: 'health insurance', slug: 'health-insurance' }],
}

async function reservePort() {
  const listener = createNetServer()
  listener.listen(0, '127.0.0.1')
  await once(listener, 'listening')
  const { port } = listener.address()
  await new Promise((resolve, reject) => listener.close(error => error ? reject(error) : resolve()))
  return port
}

async function stopChild(child) {
  if (!child.pid) return
  if (child.exitCode !== null || child.signalCode !== null) return
  const exited = once(child, 'exit')
  child.kill('SIGTERM')
  const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
  try {
    await exited
  }
  finally {
    clearTimeout(timer)
  }
}

export class InternalWorkHarness {
  token = `test-only-${randomBytes(24).toString('hex')}`
  container = `rdj-internal-test-${randomUUID()}`
  apps = []
  providerRequests = []

  async start() {
    await access(new URL('../.output/server/index.mjs', import.meta.url)).catch(() => {
      throw new Error('Missing production output: run pnpm build before node --test test/internal-work.test.mjs')
    })
    this.fixture = createServer((request, response) => {
      this.providerRequests.push(request.url)
      response.setHeader('content-type', 'application/json')
      if (new URL(request.url, 'http://127.0.0.1').pathname !== '/remotive') {
        response.writeHead(404).end('{}')
        return
      }
      response.end(JSON.stringify({ jobs: [fixtureJob] }))
    })
    this.fixture.listen(0, '127.0.0.1')
    await once(this.fixture, 'listening')
    this.fixtureOrigin = `http://127.0.0.1:${this.fixture.address().port}`

    const user = 'regression'
    const password = randomBytes(24).toString('hex')
    await exec('docker', ['run', '--pull=never', '--rm', '--detach', '--name', this.container,
      '--publish', '127.0.0.1::5432', '--env', `POSTGRES_USER=${user}`,
      '--env', `POSTGRES_PASSWORD=${password}`, '--env', 'POSTGRES_DB=regression', 'postgres:16-alpine'], { timeout: 30000 })
    const { stdout } = await exec('docker', ['port', this.container, '5432/tcp'], { timeout: 10000 })
    const match = stdout.trim().match(/^127\.0\.0\.1:(\d+)$/)
    assert.ok(match, `Expected a loopback-only Postgres mapping, received ${stdout}`)
    this.databaseURL = `postgresql://${user}:${password}@127.0.0.1:${match[1]}/regression`
    this.pool = new pg.Pool({ connectionString: this.databaseURL, connectionTimeoutMillis: 1000, max: 2 })
    let databaseReady = false
    for (let i = 0; i < 100; i++) {
      try {
        await this.pool.query('SELECT 1')
        databaseReady = true
        break
      }
      catch {
        await delay(100)
      }
    }
    assert.ok(databaseReady, 'Disposable Postgres did not become ready')
    const migration = await readFile(new URL('../server/database/0000_watery_enchantress.sql', import.meta.url), 'utf8')
    await this.pool.query(migration)
    this.app = await this.startApp(this.token)
  }

  async startApp(token) {
    const port = await reservePort()
    // Do not inherit DATABASE_URL, .env loading options, Nuxt overrides, or provider credentials.
    const env = {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      TMPDIR: process.env.TMPDIR || '/tmp',
      NODE_ENV: 'production',
      TZ: 'UTC',
      HOST: '127.0.0.1', PORT: String(port),
      NITRO_HOST: '127.0.0.1', NITRO_PORT: String(port),
      DATABASE_URL: this.databaseURL,
      NUXT_WORKER_TOKEN: token,
      INTERNAL_WORK_FIXTURE_ORIGIN: this.fixtureOrigin,
    }
    const child = spawn(process.execPath, ['--import', fileURLToPath(new URL('./provider-preload.mjs', import.meta.url)), '.output/server/index.mjs'], {
      cwd: root, env, stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    })
    const app = { child, origin: `http://127.0.0.1:${port}`, logs: '', spawnError: null }
    this.apps.push(app)
    child.on('error', (error) => {
      app.spawnError = error
    })
    for (const stream of [child.stdout, child.stderr]) {
      stream.on('data', (chunk) => {
        app.logs = (app.logs + chunk).slice(-16000)
      })
    }
    for (let i = 0; i < 150; i++) {
      if (app.spawnError) throw app.spawnError
      if (child.exitCode !== null || child.signalCode !== null) throw new Error(`Production server exited before ready:\n${app.logs}`)
      try {
        const response = await fetch(`${app.origin}/api/jobs`, { signal: AbortSignal.timeout(1000) })
        await response.text()
        if (response.ok) return app
      }
      catch { /* The listener may not have bound yet. */ }
      await delay(100)
    }
    throw new Error(`Production server did not become ready:\n${app.logs}`)
  }

  async request(path, options = {}, app = this.app) {
    const response = await fetch(new URL(path, app.origin), { ...options, redirect: 'manual', signal: AbortSignal.timeout(10000) })
    const text = await response.text()
    // Error payloads may legitimately reflect a query parameter supplied by the caller.
    if (!path.includes(this.token)) {
      assert.ok(!text.includes(this.token), 'Server-only worker token leaked into an HTTP response')
    }
    return { status: response.status, headers: response.headers, text, json: () => JSON.parse(text) }
  }

  async attempts(app = this.app) {
    const id = randomUUID()
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => finish(new Error(`Provider instrumentation did not respond:\n${app.logs}`)), 3000)
      const onMessage = (message) => {
        if (message?.type === 'internal-work-attempts' && message.id === id) finish(null, message.attempts)
      }
      const finish = (error, value) => {
        clearTimeout(timer)
        app.child.off('message', onMessage)
        error ? reject(error) : resolve(value)
      }
      app.child.on('message', onMessage)
      app.child.send({ type: 'internal-work-attempts', id }, (error) => {
        if (error) finish(error)
      })
    })
  }

  async snapshot() {
    const state = {}
    for (const table of tables) {
      const { rows } = await this.pool.query(`SELECT to_jsonb(t) AS row FROM "${table}" t ORDER BY to_jsonb(t)::text`)
      state[table] = rows.map(item => item.row)
    }
    return state
  }

  async reset() {
    await this.pool.query(`TRUNCATE ${tables.map(table => `"${table}"`).join(', ')} CASCADE`)
  }

  async seedQueue() {
    await this.pool.query('INSERT INTO job_queues (link, job_details) VALUES ($1, $2)', [queuedJob.link, JSON.stringify(queuedJob)])
  }

  async assertNoWork(action, app = this.app) {
    const before = await this.snapshot()
    const attempts = await this.attempts(app)
    const hits = this.providerRequests.length
    const response = await action()
    // Check mutation first so the baseline failure records the original GET side effect.
    assert.deepEqual(await this.snapshot(), before, 'Rejected/read-only request changed the database')
    assert.deepEqual(await this.attempts(app), attempts, 'Rejected/read-only request attempted provider I/O')
    assert.equal(this.providerRequests.length, hits, 'Rejected/read-only request contacted the provider fixture')
    return response
  }

  close() {
    this.closing ??= this.closeResources()
    return this.closing
  }

  async closeResources() {
    const errors = []
    for (const app of this.apps.reverse()) {
      try {
        await stopChild(app.child)
      }
      catch (error) {
        errors.push(error)
      }
    }
    if (this.pool) {
      try {
        await this.pool.end()
      }
      catch (error) {
        errors.push(error)
      }
    }
    if (this.fixture) {
      this.fixture.closeAllConnections()
      await new Promise(resolve => this.fixture.close(resolve))
    }
    // Address the known generated name, including when docker run partially failed.
    try {
      await exec('docker', ['rm', '--force', this.container], { timeout: 15000 })
    }
    catch (error) {
      if (!String(error.stderr).includes('No such container')) errors.push(error)
    }
    if (errors.length) throw new AggregateError(errors, 'Disposable fixture cleanup failed')
  }
}
