# AGENTS.md

Guidance for AI coding agents. Claude Code reads it through `CLAUDE.md`. Keep it short: durable rules and non-obvious facts only.

## Invariants

These are not suggestions. If one blocks the task, stop and ask.

1. **Never work on `main`.** Start every change on a branch named `<type>/<topic>` with a Conventional Commit type, for example `fix/message-author-check`. `main` only moves through merged pull requests. `.githooks/` refuses commits on `main` and pushes to it (`pnpm install` enables them), and a Claude Code hook refuses edits while on `main`. Never bypass them with `--no-verify` or by changing `core.hooksPath`.
2. **Done means verified.** `pnpm check` (lint, type check, format) must pass. When you touch `apps/api`, also run the e2e tests if the infrastructure is up. If you could not run something, say so; never claim it passed.
3. **YAGNI and KISS: no unapproved abstractions.** Solve the task in front of you with the simplest code that works, following the patterns already in the repo. Do not add new layers, base classes, generic helpers, config options, dependencies or "future-proofing" unless the user approved them first for a stated reason. Do not act on assumptions: if a requirement is unclear, ask instead of guessing. Three similar lines are better than a premature abstraction.
4. **Never modify the legacy tags** (`api-v1-java`, `web-v1-vite`, `api-v2-nest-oracle`, `web-v2-next`) or rewrite history. They prove v1 and v2 predate AI. `legacy/` only holds the glue that runs them, and their bugs stay as they were.
5. **Never read, print or commit secrets**, such as `.env` files, keys or tokens. Read `.env.sample` instead.
6. **Identity comes from the token.** Take the user id from `user.sub`, never from the request body, and check that the caller may act on the resource (author, owner, guild member).
7. **No Markdown sprawl.** Do not add docs to explain a change: the why goes in the commit and the pull request. Only update this file or a README when a durable fact changes.
8. **All repo text in English**, including code comments, docs, commits and pull requests. Older Spanish text can stay unless you are editing it.

## Workflow

- **Size the task first.** For a small, clear change, just do it. If the change spans both apps, changes a contract or the schema, or is ambiguous, write a short plan and confirm it before editing.
- **One concern per branch and pull request.** Commits follow Conventional Commits with a scope (`feat(api)!: ...`, `chore(monorepo): ...`).
- **Write tests first** when a runnable test can express the expected behavior, for example api e2e tests for authorization rules.
- **Before opening a pull request**, run `pnpm check` and review your own diff (`/code-review` in Claude Code). Open it with `gh pr create`. The description is the spec: what changed, why, and how it was verified.
- **The human merges.** Agents do not merge pull requests, push to `main`, force-push shared branches or move tags.

## Overview

Fidechat is a Discord clone. It is a pnpm + Turborepo monorepo formed by merging two repos, with the full history of both kept:

- `apps/api` (`@fidechat/api`): NestJS 12 on Fastify, PostgreSQL via Drizzle ORM, Keycloak auth, Socket.IO.
- `apps/web` (`@fidechat/web`): Next.js 16 App Router, React 19, Tailwind v4, shadcn/Radix UI, NextAuth (Keycloak provider), TanStack Query.
- `packages/` is empty for now. **No code is shared between apps**, so types and socket event names are duplicated on both sides (see "Cross-app contracts").

## Commands

Run from the repo root. Use `pnpm --filter @fidechat/api <script>` or `pnpm --filter @fidechat/web <script>` to target one app.

```bash
pnpm install
pnpm dev                 # both apps (api: nest --watch, web: next dev, Turbopack by default)
pnpm check              # lint + typecheck + format check: the definition of done
pnpm build | lint | typecheck | test | format
pnpm --filter @fidechat/api lint:fix     # also available for web
```

Infrastructure (Postgres + Keycloak) and all DB commands run from `apps/api`:

```bash
cd apps/api && cp .env.sample .env
docker compose -f local-docker-compose.yaml up -d
pnpm db:migrate          # apply drizzle/ migrations
pnpm db:generate         # after editing schema/*.ts: generate a new SQL migration (commit it)
pnpm db:push | db:studio
```

Default local ports: API and Socket.IO on 8080 (`API_PORT`), Keycloak on 8081, web on 3000.

`docker compose up --build` at the repo root is a separate, self-contained demo: it builds both apps from the checkout into containers, with demo data from `docker/` (web 4300, API 4301, Keycloak 4380). A schema change that breaks `docker/postgres/seed.sql` must update it.

### Tests

The api only has **e2e tests** (`apps/api/tests/*.e2e-spec.ts`), and the web app has none. `test` and `test:e2e` both run the same Jest suite. The tests boot the full `AppModule` and create and delete real users through the Keycloak admin API, so they need Postgres, Keycloak and a complete `.env` (including `OPENAI_API_KEY`, since env validation fails without it).

The scripts run Jest as `node --experimental-vm-modules .../jest.js`: Nest 12, uuid and jwks-rsa (jose) are ESM-only, and Jest can only `require()` them with that flag. Use the `test` script rather than a bare `jest`. Node >= 26.13 (current LTS) is required.

```bash
pnpm --filter @fidechat/api test -- tests/guild.e2e-spec.ts        # single file
pnpm --filter @fidechat/api test -- -t "should allow creating a private guild"   # single test by name
```

### Type checking

**Neither build type-checks.** The api builds with SWC (`nest-cli.json` `builder: swc`), and the web has `typescript.ignoreBuildErrors: true`. Run `pnpm typecheck` (part of `pnpm check`); both apps pass with zero errors.

TypeScript is pinned to **6.x** on purpose: TS 7 ships no JS compiler API, which ts-jest, the Nest CLI and the tanstack plugin that oxlint loads all need. `@types/node` tracks the Node 26 runtime, not the latest major.

### Lint / format

The repo uses **oxlint + oxfmt** (ESLint and Prettier were removed; any `eslint-disable` comments left in the code are leftovers). The api lints with `--type-aware` (via `oxlint-tsgolint`). Formatting is 4-space indentation and single quotes, with `printWidth` set to **120 in api and 80 in web**.

tsgolint does not support `baseUrl`, so the api `tsconfig.json` has `paths` without `baseUrl`, and `jest.config.ts` anchors them with a `<rootDir>/` prefix. Do not reintroduce `baseUrl`.

## API architecture (`apps/api`)

**Bootstrap (`src/main.ts`).** The app uses Fastify with a global prefix of `api` and URI versioning, so routes look like `/api/v1/guilds`. Swagger is served at `/api`. `src/instrumentation.ts` loads `dotenv` before anything else.

**Auth is global.** `app.module.ts` registers our own `AuthGuard` (`src/modules/auth/`) as `APP_GUARD`, so every route requires an access token unless it is marked `@Public()`. `TokenVerifier` checks it locally against the realm JWKS (RS256, issuer, `aud` = `urn:fidechat:api`, expiry, `typ: Bearer`) and the gateway uses the same verifier. Keycloak only adds that audience through an Audience mapper on the client (*Included Custom Audience*): the demo realm in `docker/keycloak/` ships it, and a local Keycloak needs it added by hand, or every request gets a 401; there is no introspection, so a revoked token stays valid until it expires. `KeycloakSyncInterceptor` then upserts the Keycloak user into `app_user` on **every** request. That is how users come to exist in the DB, and no signup endpoint exists. Get the caller with `@AuthenticatedUser() user: IReqUser` and use `user.sub` as the user id. Never read owner or author ids from the request body.

**The API is also the browser's BFF** (`src/modules/auth/session/`). `/api/v1/auth/login` and `/callback` run the Keycloak authorization code + PKCE flow and set an HttpOnly `fidechat_sid` cookie; the tokens stay in an in-memory map (single instance, lost on restart). `AuthGuard` and the gateway get the token from `SessionService.resolveAccessToken`, which reads that cookie and refreshes the token when needed. **In production the cookie is the only credential**: bearer tokens sent by clients are ignored on REST and on the socket. Cookie-authenticated writes and sockets must come from the `PUBLIC_WEB_URL` origin (CSRF, cross-site WebSocket hijacking); a missing `Origin` is only accepted outside production. Outside production (`development`, `test`) a client bearer token is the fallback, for e2e tests and Postman; `tests/production-auth.e2e-spec.ts` covers the production rule.

`fastify` is pinned to the exact version `@nestjs/platform-fastify` pins; a second copy breaks the plugin types in `main.ts`, so bump both together.

**Env vars** are validated at boot by class-validator (`src/config/environment.ts`, applied through `validateEnv`) and also declared as the ambient `IEnvironmentVariables` in `types/global.d.ts`. A new variable must be added to **both** files, and to `.env.sample`.

**Feature modules (`src/modules/<feature>/`)** follow the pattern controller → service → repository:

- Controllers apply a per-parameter `ValidationPipe` with class-validator `groups` (`'create'` / `'update'`) on DTOs. DTOs are hand-written on purpose and are not derived from Drizzle rows: the DB uses `null` where payloads use absent fields.
- Services hold business rules and emit realtime events through `GatewayService`.
- Repositories hold **all** SQL. They wrap unexpected errors in `InternalServerErrorException` and rethrow `NotFoundException` unchanged.

**Data layer (`src/infrastructure/database/`).**

- `DatabaseModule` is `@Global`. Inject the client with `@Inject(DRIZZLE) db: DrizzleDB`.
- The schema lives in `schema/*.ts` and is re-exported from `schema/index.ts`, which is what `drizzle.config.ts` reads. Generated migrations in `drizzle/` are checked in.
- **The database holds no logic**: no stored procedures, functions or triggers. Anything a trigger used to do is now explicit code inside a transaction. For example, `GuildRepository.createGuild` inserts the owner into `guild_users`.
- **Auditing is manual.** A write to `app_user`, `guild`, `guild_users`, `channel` or `message` should call `AuditService.record(tx, {...})` inside the same `db.transaction`, so the audit row commits or rolls back together with the change. `recordSafe` is only for writes outside a transaction. Repository helpers accept `DrizzleExecutor` (`DrizzleDB | DrizzleTx`) so they can compose into a caller's transaction.
- `sql/legacy-oracle/` is the old Oracle PL/SQL, kept for reference only. Its README maps each old package or trigger to the TypeScript that replaced it.

**Realtime (`src/modules/gateway/gateway.service.ts`).**

- A single `@WebSocketGateway` shares the HTTP port, with an optional namespace set by `SOCKET_NAMESPACE`.
- The handshake token (the session cookie; outside production also `auth.token` or an `access-token` header for Postman) is verified against the Keycloak JWKS.
- Each socket joins a room named after its user id (`sub`). Services fan out to users with `emitToUser`/`emitToUsers`. For guild-wide events they first look up member ids with `UserRepository.getGuildUsers`; there are no guild or channel rooms.
- Presence (`#activeUsers`) is an in-memory map, which assumes a single API instance.

**AI bots (`src/modules/ai/`).** Three bot users with hard-coded UUIDs (`IAUserModels`) are upserted on module init and are always shown online. When a non-bot message matches a bot's name pattern, `MessageService` generates the reply asynchronously (fire-and-forget) through OpenAI and toggles the bot's typing status.

## Web architecture (`apps/web`)

**Provider chain (`src/app/providers.tsx`).** The order is `QueryProvider` → `SessionProvider` → `SocketProvider` → `AppProvider`:

- NextAuth runs with the Keycloak provider and a JWT session strategy. Access-token refresh is implemented in `src/app/api/auth/[...nextauth]/route.ts`, and the access token is exposed as `session.accessToken`.
- `SocketProvider` opens the Socket.IO connection once the session is authenticated, passing the access token.

**State model (`src/contexts/providers/AppProvider.tsx`).**

1. When the socket connects, `AppProvider` calls `GET /users/@me/sync` and loads the whole client state into React context: guilds with members, channels with messages, users and presence.
2. Socket events are then applied as incremental updates to that state.
3. A `forceSync` event triggers a full re-sync.

Components read this state through `useAppContext`. `MockDataProvider` is a leftover from the prototype that some layouts still use, and real data comes from `AppProvider`.

**HTTP.** Requests go through `useApi` / `useApiData` / `useApiMutation` (`src/lib/hooks/`), built on an axios client (`src/lib/api/client.ts`) with base URL `${NEXT_PUBLIC_REST_API_URL}/api/v1`, a bearer token from the session, and re-sign-in on 401.

**UI and env.** `src/components/ui/` contains generated shadcn components (see `components.json`). The web app has no `.env` sample; the required variables are typed in `global-types/node-env.d.ts`. `NEXT_PUBLIC_SOCKET_URL` must point at the API origin, because Socket.IO is served on the API port.

## Cross-app contracts (keep in sync by hand)

- **Socket events.** Defined in the api `SocketEvents` enum (`gateway.service.ts`) and the `ServerToClientEvents` payload types (`apps/api/types/socket.d.ts`). The web side mirrors them in `src/constants/socketEvents.ts` and the handler types in `src/hooks/useSocketsEvents.ts`. Adding an event means touching all four, plus the handler in `AppProvider`.
- **Response shapes.** The api returns camelCase Drizzle rows. The web mirrors them in `src/types/*.d.ts`, and `SyncAppStateResponse` in `src/contexts/appContext.ts` mirrors `SyncRepository`.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
