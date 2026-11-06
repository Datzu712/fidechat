# Fidechat

Fidechat monorepo: a Discord clone with real-time messaging. It was created by
merging two independent repositories (now archived), keeping the full commit
history of both:

| Workspace  | Package          | Origin (archived)                                                   | Stack                                        |
| ---------- | ---------------- | ------------------------------------------------------------------- | -------------------------------------------- |
| `apps/api` | `@fidechat/api`  | [Datzu712/Fidechat-backend](https://github.com/Datzu712/Fidechat-backend) | NestJS 12 · Fastify · PostgreSQL + Drizzle · Keycloak · Socket.IO |
| `apps/web` | `@fidechat/web`  | [Datzu712/fidechat-web](https://github.com/Datzu712/fidechat-web)         | Vite · React 19 · Tailwind v4 · Radix UI         |

## Project history

Fidechat started as a university project and has gone through three versions.
**The first two were written without AI assistants**; the third is an
AI-assisted refactor.

- **v1 and v2 were university projects**, each built within a single
  four-month term (cuatrimestre). They were written against a deadline, so the
  code is rushed in places: they are kept here as a record of how the project
  grew, not as examples of best practice.
- **v3 is the final version, and the peak of it all**: the project I started at
  university, rebuilt without a deadline, done properly this time, with
  everything that never fit into a term.

| Version | Dates | Backend | Frontend | Tags | Built with AI |
| ------- | ----- | ------- | -------- | ---- | ------------- |
| **v1** | Nov 2024 – Feb 2025 | Java 21 · Spring Boot 3.1 · JDBC (PostgreSQL) · JWT · WebSockets | React 18 · Vite | `api-v1-java` · `web-v1-vite` | No |
| **v2** | Jul 2025 – Aug 2025 | NestJS 11 · Fastify · Oracle (PL/SQL packages and triggers) · Keycloak · Socket.IO | Next.js 15 · shadcn/ui · NextAuth | `api-v2-nest-oracle` · `web-v2-next` | No |
| **v3** | Aug 2026 – today | NestJS 12 · PostgreSQL + Drizzle · Turborepo monorepo | Vite SPA · Tailwind v4 | — | Yes, with Claude |

**How to verify it:**

- The original repositories are **archived (read-only) on GitHub**, with their
  original hashes, pull requests and Dependabot PRs:
  [Fidechat-backend](https://github.com/Datzu712/Fidechat-backend) and
  [fidechat-web](https://github.com/Datzu712/fidechat-web).
- Merging them here moved the files into `apps/*`, which changes every hash.
  [docs/history-map.md](docs/history-map.md) maps each monorepo commit to its
  original commit on GitHub (171 of 171).
- Every v3 commit, and only those, carries a `Co-Authored-By: Claude …` line.
  To list them: `git log --grep='Co-Authored-By: Claude'`.
- The OpenAI chat bots present since v2 are a **product feature**, not
  AI-generated code.

**Running an old version:** [legacy/](legacy/README.md) has one-command Docker
Compose environments that build the exact code of each tag, with demo data:

```bash
docker compose -f legacy/v1/compose.yaml up --build   # v1 -> http://localhost:4100
docker compose -f legacy/v2/compose.yaml up --build   # v2 -> http://localhost:4200
```

> [!WARNING]
> v1 and v2 are old and **full of known vulnerabilities**: outdated
> dependencies, missing authorization checks and more. They are here to be
> looked at, never to be deployed. Run them only locally, and do not use them
> in production or expose them to a network.

Screenshots of each version are in [docs/screenshots/](docs/screenshots/README.md).

## Structure

```
fidechat/
├── apps/
│   ├── api/          # NestJS backend   (@fidechat/api)
│   └── web/          # Vite SPA frontend (@fidechat/web)
├── packages/         # shared code (empty for now)
├── legacy/           # reproducible environments for v1 and v2
├── docker/           # demo realm and seed for compose.yaml
├── docs/             # history-map.md (hashes ↔ original repos), screenshots/
├── .github/          # CI workflows
├── compose.yaml      # quick launch of v3 (see below)
├── package.json      # workspace root
├── pnpm-workspace.yaml
└── turbo.json
```

## Requirements

- Node.js >= 26.13 (current LTS)
- pnpm >= 12
- Docker + Docker Compose (for Postgres and Keycloak)

## Usage

```bash
pnpm install          # install dependencies for every workspace

pnpm dev              # run api and web together
pnpm build            # build everything
pnpm lint             # lint everything
pnpm test             # test everything
```

Use `--filter` to work on a single workspace:

```bash
pnpm --filter @fidechat/api dev
pnpm --filter @fidechat/web dev
pnpm --filter @fidechat/api add <package>
```

## Quick launch (v3)

To try the current version without setting anything up, `compose.yaml` builds
the api image from your checkout (it also serves the web SPA) and runs it with
PostgreSQL, Keycloak and demo data. It needs only Docker with Compose:

```bash
docker compose up --build   # -> http://localhost:4300
```

Log in as `ana` or `bruno` (or their `@demo.local` emails), password
`demo1234`. Keycloak's console is at http://keycloak.localhost:4380 (`admin` /
`admin`). Stop with `docker compose down`; add `-v` to wipe the database.
The ports are fixed, because the Keycloak realm's redirect URIs use them, and
the demo users and data live in `docker/`.

> [!NOTE]
> **AI bots and `OPENAI_API_KEY`.** The api needs the variable to boot, so
> `compose.yaml` passes the placeholder `not-set` when it is missing; the bots
> still show up online, but stay silent. To give them a real key, set
> `OPENAI_API_KEY` in the shell or in a root `.env` (git-ignored, so it is the
> right place for it). Even with a valid key the bots do not answer yet: v3
> still asks for `gpt-3.5-turbo`, which OpenAI has retired. (ima changed it to the sdk from vercel in the next prs i hope)

## Infrastructure services

The compose files live in `apps/api` and are still run from there:

```bash
cd apps/api
cp .env.sample .env
docker compose -f local-docker-compose.yaml up -d   # Postgres + Keycloak
pnpm db:migrate                                     # create the schema with Drizzle
```

The backend production build (`apps/api/dockerfile.prod`) uses the monorepo
root as its context, because there is now a single pnpm lockfile, at the root. It also builds the web
SPA and serves it from the API, so the browser and the API share one origin.
