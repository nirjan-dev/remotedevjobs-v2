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