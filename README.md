# Fidechat

Fidechat monorepo: a Discord clone with real-time messaging. It was created by
merging two independent repositories (now archived), keeping the full commit
history of both:

| Workspace  | Package          | Origin (archived)                                                   | Stack                                        |
| ---------- | ---------------- | ------------------------------------------------------------------- | -------------------------------------------- |
| `apps/api` | `@fidechat/api`  | [Datzu712/Fidechat-backend](https://github.com/Datzu712/Fidechat-backend) | NestJS 12 · Fastify · PostgreSQL + Drizzle · Keycloak · Socket.IO |
| `apps/web` | `@fidechat/web`  | [Datzu712/fidechat-web](https://github.com/Datzu712/fidechat-web)         | Next.js 16 · React 19 · Tailwind v4 · Radix UI   |

## Project history

Fidechat is a side project that has gone through three versions. **The first two
were written without AI assistants**; the third is an AI-assisted refactor.

| Version | Dates | Backend | Frontend | Tags | Built with AI |
| ------- | ----- | ------- | -------- | ---- | ------------- |
| **v1** | Nov 2024 – Feb 2025 | Java 21 · Spring Boot 3.1 · JDBC (PostgreSQL) · JWT · WebSockets | React 18 · Vite | `api-v1-java` · `web-v1-vite` | No |
| **v2** | Jul 2025 – Aug 2025 | NestJS 11 · Fastify · Oracle (PL/SQL packages and triggers) · Keycloak · Socket.IO | Next.js 15 · shadcn/ui · NextAuth | `api-v2-nest-oracle` · `web-v2-next` | No |
| **v3** | Aug 2026 – today | NestJS 12 · PostgreSQL + Drizzle · Turborepo monorepo | Next.js 16 · Tailwind v4 | — | Yes, with Claude |

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
```

Screenshots of each version are in [docs/screenshots/](docs/screenshots/README.md).

The v2 environment is in progress. Until then, v2 can be run by hand from its
tags (in v1 and v2 each app had its own `pnpm-lock.yaml` and there was no
workspace, so run the commands inside `apps/api` or `apps/web`):

```bash
git switch --detach api-v2-nest-oracle && cd apps/api \
  && docker compose -f local-docker-compose.yaml up -d && pnpm install && pnpm dev
git switch --detach web-v2-next && cd apps/web && pnpm install && pnpm dev
git switch main   # to go back
```

## Structure

```
fidechat/
├── apps/
│   ├── api/          # NestJS backend   (@fidechat/api)
│   └── web/          # Next.js frontend (@fidechat/web)
├── packages/         # shared code (empty for now)
├── legacy/           # reproducible environments for v1 and v2
├── docs/             # history-map.md (hashes ↔ original repos), screenshots/
├── .github/          # CI workflows
├── package.json      # workspace root
├── pnpm-workspace.yaml
└── turbo.json
```

## Requirements

- Node.js >= 24.15
- pnpm >= 10
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

## Infrastructure services

The compose files live in `apps/api` and are still run from there:

```bash
cd apps/api
cp .env.sample .env
docker compose -f local-docker-compose.yaml up -d   # Postgres + Keycloak
pnpm db:migrate                                     # create the schema with Drizzle
```

The backend production build (`apps/api/dockerfile.prod`) uses the monorepo
root as its context, because there is now a single pnpm lockfile, at the root.

## Per-app documentation

- [apps/api/README.md](apps/api/README.md): endpoints, database schema, Keycloak setup.
- [apps/web/README.md](apps/web/README.md): client features and structure.
