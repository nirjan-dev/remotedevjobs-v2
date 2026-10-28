# RemoteDevJobs

**RemoteDevJobs** is a modern job board platform built to connect developers with remote opportunities. It leverages the power of Nuxt 4 for a performant frontend and a robust backend infrastructure using PostgreSQL and Drizzle ORM.

## Key Features

- **Full-Stack Nuxt 4 Application**: Server-side rendering and static site generation capabilities.
- **Type-Safe Database**: Integrated with **Drizzle ORM** and **PostgreSQL** for reliable data management.
- **Modern UI**: Built with **Tailwind CSS** and **Nuxt UI** for a clean, responsive interface.
- **Content Management**: Includes a blog and content system powered by **Nuxt Content**.
- **Developer Experience**: Dockerized database setup and strict TypeScript configuration.

## Getting Started

Follow these instructions to set up the project on your local machine.

### Prerequisites

- **Node.js**: Version 24 or later (check `.nvmrc`).
- **pnpm**: The preferred package manager.
- **Docker**: Required for running the local PostgreSQL database.

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd remotedevjobs-v2
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Set up environment variables:**

   Copy the example environment file and configure it:

   ```bash
   cp .env.example .env
   ```

   Ensure `DATABASE_URL` is set in your `.env` file (default for local Docker setup):
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/remotedevjobs
   ```

### Local Development

1. **Start the database:**

   Use Docker Compose to spin up the PostgreSQL container:

   ```bash
   pnpm docker:up
   ```

2. **Initialize the database:**

   Push the schema and seed initial data:

   ```bash
   pnpm db:push
   pnpm db:seed
   ```

3. **Start the development server:**

   ```bash
   pnpm dev
   ```

   Visit `http://localhost:3000` to view the application.

## Usage & Commands

This project uses `pnpm` for script management.

| Category | Command | Description |
|----------|---------|-------------|
| **Dev** | `pnpm dev` | Start the development server with hot-reload. |
| | `pnpm build` | Build the application for production. |
| | `pnpm preview` | Preview the production build locally. |
| **Database** | `pnpm db:push` | Push schema changes to the database (prototyping). |
| | `pnpm db:migrate` | Apply migrations to the database. |
| | `pnpm db:studio` | Open Drizzle Studio to inspect the database. |
| | `pnpm db:seed` | Populate the database with seed data. |
| **Docker** | `pnpm docker:up` | Start the database container in detached mode. |
| | `pnpm docker:down` | Stop and remove the database container. |
| **Quality** | `pnpm lint` | Run ESLint to catch errors. |
| | `pnpm typecheck` | Run TypeScript compiler check. |
| | `pnpm test` | Build and run isolated ingestion/worker HTTP regression checks (requires Docker). |

## Internal ingestion and scheduling

The job listings, filters and metadata remain public read-only APIs. Ingestion and
queue execution are privileged operations, not browser links:

| Method | Path | Effect |
|--------|------|--------|
| POST | `/api/ingest/{provider}` | Fetch the provider's jobs and enqueue new links. |
| POST | `/api/queue/process` | Process at most one queued item; an empty queue returns `No jobs in queue`. |

Supported provider names: `devremote`, `fourdayweek`, `himalayas`, `remoteok`,
`remotive`, `trulyremote`, `workingnomads`. These endpoints accept no request body.
GET and HEAD do not run ingestion or the queue worker; the old GET interface is removed.

### Authentication

Set **`NUXT_WORKER_TOKEN`** in the server environment and in the scheduler's secret
store. Generate a random value with `openssl rand -hex 32`. This is private Nuxt
runtime configuration: never put it under `runtimeConfig.public`, use a
`NUXT_PUBLIC_` variable, commit it, or include it in a URL.

Every operational POST requires `Authorization: Bearer <token>`. Missing or
incorrect credentials return **401** with `WWW-Authenticate: Bearer`; a server
without a configured token returns **503**, with no provider fetch or database
work. Query parameters and cookies do not authenticate these calls. The token
grants both ingestion and processing access; keep it only in trusted server-side
schedulers, use HTTPS outside localhost, and rotate it if exposed.

### Scheduler calls and rollout

Production scheduling is **cron-job.org**, folder `remotedevjobs` (id `52231`),
calling the production origin `https://remotedevjobs.net`. Eight jobs map to the
endpoints above: one per provider plus a queue drain. Observed 2026-10-28:
Devremote daily 04:00, Himalayas daily 04:05, RemoteOK daily 05:00, 4DayWeek
daily 06:00, Remotive daily 03:00, TrulyRemote daily 03:00, WorkingNomads weekly
Monday 01:01, queue drain every 30 minutes (per-job timezones observed as
`Asia/Kathmandu`). Preserve each job's schedule, timezone and notifications;
only the request changes. A separate `vercel deployment` job in the same folder
triggers redeploys via a Vercel deploy hook and must not be modified.

Per-job target settings (Advanced tab): **request method POST**, URL unchanged,
**request body empty**, custom header `Authorization: Bearer <token>` holding the
same `NUXT_WORKER_TOKEN` value as the server. cron-job.org supports POST and
arbitrary custom headers, with a 30 s execution timeout and 64 KB output cap
([FAQ](https://cron-job.org/en/faq/)). A GET-only cron service cannot call this
interface directly.

For a local smoke run (the variables must be exported in this shell):

```bash
export BASE_URL=http://localhost:3000
# Set NUXT_WORKER_TOKEN securely to the same value configured on the server.
curl --fail-with-body --request POST \
  --header "Authorization: Bearer ${NUXT_WORKER_TOKEN:?Set the worker token}" \
  "${BASE_URL:?Set the server origin}/api/ingest/remotive"
curl --fail-with-body --request POST \
  --header "Authorization: Bearer ${NUXT_WORKER_TOKEN:?Set the worker token}" \
  "${BASE_URL:?Set the server origin}/api/queue/process"
```

Ingest on the provider's permitted cadence, then schedule worker calls to drain
the queue. An ingestion response reports `queuedCount` and `queuedJobs`; check
the JSON body as well as the HTTP status because existing adapters can return an
`error` body with HTTP 200. Worker success returns `jobId` and `title`.

Rollout: pause the eight jobs, set Production `NUXT_WORKER_TOKEN` in the Vercel
project, deploy by pushing to `main`, edit each job to POST + header + empty
body, verify the persisted settings, then resume. No database migration is
required. Verify first with the isolated fixture suite, not by invoking the live
processing endpoint; after cutover, verify from each job's execution history,
checking the response body as well as the status (adapters can return HTTP 200
with an `error` body). `401` means bad credentials, `503` means the server token
is missing. Never use TEST RUN on ingestion/queue jobs: it triggers real
production work. If a job cannot be migrated, leave it paused; do not restore
anonymous GET execution as a rollback. To disable access, unset the server token
and redeploy; to rotate it, pause calls, update both secret stores, then resume.

Queue retries, atomic claiming and crash recovery are not implemented here.
Keep worker invocations serial: this access-control change does not make concurrent
workers safe or stop a poison item blocking the queue.

### Regression proof

`pnpm test` builds the actual Nitro server and exercises it over loopback HTTP.
The suite starts its own disposable PostgreSQL container with synthetic
credentials, applies the committed schema, and uses synthetic provider responses.
It does not use `.env` database credentials or invoke deployed ingestion/worker
endpoints. Test-only fetch interception blocks external provider access; no test
mode or bypass is added to production handlers.

Checks cover denied callers, missing server configuration, safe GET/HEAD calls
with queued work present, authenticated ingestion → queue → persisted job, and
anonymous public reads. The suite tears down its server processes and database
container. Docker and a usable `postgres:16-alpine` image are required.

## Project Structure

- **`app/`**: Main Nuxt application (pages, components, layouts).
- **`server/`**: Server-side logic, API routes, and database schema.
- **`content/`**: Markdown files for the blog and static pages.
- **`public/`**: Static assets like images and fonts.
- **`drizzle.config.ts`**: Configuration for Drizzle ORM.

## Support & Contributing

If you encounter issues or have questions, please file an issue in the repository issue tracker.

### Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/name`).
3. Commit your changes.
4. Push to the branch.
5. Open a Pull Request.

Please ensure your code passes linting (`pnpm lint`) and type checks (`pnpm typecheck`) before submitting.