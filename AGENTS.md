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
- `apps/web` (`@fidechat/web`): Vite SPA, React 19, React Router, Tailwind v4, shadcn/Radix UI, TanStack Query. It has no server: the API is its BFF.
- `packages/shared` (`@fidechat/shared`): the contracts both apps import: socket events, wire shapes and request payloads (see "Cross-app contracts").

## Commands

Run from the repo root. Use `pnpm --filter @fidechat/api <script>` or `pnpm --filter @fidechat/web <script>` to target one app.

```bash
pnpm install
pnpm dev                 # turbo watch: both apps (api: nest --watch on 8080, web: vite on 3000, proxying /api and /socket.io to 8080)
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

`docker compose up --build` at the repo root is a separate, self-contained demo: it builds the api image, which also serves the web SPA (`WEB_DIST_DIR`), with demo data from `docker/` (app 4300, Keycloak 4380). A schema change that breaks `docker/postgres/seed.sql` must update it.

### Tests

The api only has **e2e tests** (`apps/api/tests/*.e2e-spec.ts`), and the web app has none. `test` and `test:e2e` both run the same Jest suite. The tests boot the full `AppModule` and create and delete real users through the Keycloak admin API, so they need Postgres, Keycloak and a complete `.env`. The AI keys are optional: without them the bots stay off. `tests/ai-bots.spec.ts` is a plain unit test that needs no infrastructure.

The api is ESM (`"type": "module"`), so relative and `@/` imports carry the `.js` extension. The tests, however, are compiled to CommonJS by ts-jest (Jest's ESM loader trips on a `require(esm)` cycle inside the Nest packages), and the scripts run Jest as `node --experimental-vm-modules .../jest.js` so it can `require()` the ESM-only Nest 12, uuid and jwks-rsa (jose). Use the `test` script rather than a bare `jest`. Node >= 26.13 (current LTS) is required.

```bash
pnpm --filter @fidechat/api test -- tests/guild.e2e-spec.ts        # single file
pnpm --filter @fidechat/api test -- -t "should allow creating a private guild"   # single test by name
```

### Type checking

**Neither build type-checks.** The api builds with SWC (`nest-cli.json` `builder: swc`), and the web builds with Vite, which only strips types. Run `pnpm typecheck` (part of `pnpm check`); both apps pass with zero errors.

TypeScript is pinned to **6.x** on purpose: TS 7 ships no JS compiler API, which ts-jest, the Nest CLI and the tanstack plugin that oxlint loads all need. `@types/node` tracks the Node 26 runtime, not the latest major.

### Lint / format

The repo uses **oxlint + oxfmt** (ESLint and Prettier were removed; any `eslint-disable` comments left in the code are leftovers). The api lints with `--type-aware` (via `oxlint-tsgolint`). Formatting is 4-space indentation and single quotes, with `printWidth` set to **120 in api and 80 in web**.

tsgolint does not support `baseUrl`, so the api `tsconfig.json` has `paths` without `baseUrl`, and `jest.config.ts` anchors them with a `<rootDir>/` prefix. Do not reintroduce `baseUrl`.

## API architecture (`apps/api`)

**Bootstrap (`src/main.ts`).** The app uses Fastify with a global prefix of `api` and URI versioning, so routes look like `/api/v1/guilds`. Swagger is served at `/api`. `src/instrumentation.ts` loads `dotenv` before anything else.

**Auth is global.** `app.module.ts` registers our own `AuthGuard` (`src/modules/auth/`) as `APP_GUARD`, so every route requires an access token unless it is marked `@Public()`. `TokenVerifier` checks it locally against the realm JWKS (RS256, issuer, `aud` = `urn:fidechat:api`, expiry, `typ: Bearer`) and the gateway uses the same verifier. Keycloak only adds that audience through an Audience mapper on the client (*Included Custom Audience*): the demo realm in `docker/keycloak/` ships it, and a local Keycloak needs it added by hand, or every request gets a 401; there is no introspection, so a revoked token stays valid until it expires. `KeycloakSyncInterceptor` then upserts the Keycloak user into `app_user` on **every** request. That is how users come to exist in the DB, and no signup endpoint exists. Get the caller with `@AuthenticatedUser() user: IReqUser` and use `user.sub` as the user id. Never read owner or author ids from the request body.

**The API is also the browser's BFF** (`src/modules/auth/session/`). `/api/v1/auth/login` and `/callback` run the Keycloak authorization code + PKCE flow and set an HttpOnly `fidechat_sid` cookie; the tokens stay in an in-memory map (single instance, lost on restart, swept every minute). The `/auth` endpoints are rate-limited per IP with `@nestjs/throttler`. `AuthGuard` and the gateway get the token from `SessionService.resolveAccessToken`, which reads that cookie and refreshes the token when needed. **In production the cookie is the only credential**: bearer tokens sent by clients are ignored on REST and on the socket. Cookie-authenticated writes and sockets must come from the `PUBLIC_WEB_URL` origin (CSRF, cross-site WebSocket hijacking); a missing `Origin` is only accepted outside production. Outside production (`development`, `test`) a client bearer token is the fallback, for e2e tests and Postman; `tests/production-auth.e2e-spec.ts` covers the production rule.

`fastify` is pinned to the exact version `@nestjs/platform-fastify` pins; a second copy breaks the plugin types in `main.ts`, so bump both together.

**Env vars** are validated at boot by class-validator (`src/config/environment.ts`, applied through `validateEnv`) and also declared as the ambient `IEnvironmentVariables` in `types/global.d.ts`. A new variable must be added to **both** files, and to `.env.sample`.

**Logging** goes through `nestjs-pino` (`src/config/logger.ts`) to stdout: JSON in production, pino-pretty elsewhere, one line per request, with the request bound to every log made while handling it. Use `Logger` from `@nestjs/common` (`new Logger(Ctx)`), and pass errors as `Error` objects (wrap with `{ cause }`) rather than as extra arguments: the last argument is taken as the context.

**Feature modules (`src/modules/<feature>/`)** follow the pattern controller → service → repository:

- Controllers apply a per-parameter `ValidationPipe` with class-validator `groups` (`'create'` / `'update'`) on DTOs. DTOs are hand-written on purpose and are not derived from Drizzle rows: the DB uses `null` where payloads use absent fields.
- Services hold business rules and emit realtime events through `SocketEmitter`.
- Repositories hold **all** SQL. They wrap unexpected errors in `InternalServerErrorException` and rethrow `NotFoundException` unchanged.

**Data layer (`src/infrastructure/database/`).**

- `DatabaseModule` is `@Global`. Inject the client with `@Inject(DRIZZLE) db: DrizzleDB`.
- The schema lives in `schema/*.ts` and is re-exported from `schema/index.ts`, which is what `drizzle.config.ts` reads. Generated migrations in `drizzle/` are checked in.
- **The database holds no logic**: no stored procedures, functions or triggers. Anything a trigger used to do is now explicit code inside a transaction. For example, `GuildRepository.createGuild` inserts the owner into `guild_users`.
- **Auditing is manual.** A write to `app_user`, `guild`, `guild_users`, `channel` or `message` should call `AuditService.record(tx, {...})` inside the same `db.transaction`, so the audit row commits or rolls back together with the change. `recordSafe` is only for writes outside a transaction. Repository helpers accept `DrizzleExecutor` (`DrizzleDB | DrizzleTx`) so they can compose into a caller's transaction.
- `sql/legacy-oracle/` is the old Oracle PL/SQL, kept for reference only. Its README maps each old package or trigger to the TypeScript that replaced it.

**Realtime (`src/modules/gateway/`).**

- `SocketGateway` is the single `@WebSocketGateway` and only handles the socket lifecycle. It shares the HTTP port, with an optional namespace set by `SOCKET_NAMESPACE`.
- The handshake middleware, installed in `afterInit`, is `HandshakeAuthenticator`: it checks the `Origin` and verifies the token (the session cookie; outside production also `auth.token` or an `access-token` header for Postman), so a refused client gets `connect_error`. The server closes a socket when its token expires and when its session logs out; the client then reconnects if the session is still valid.
- Each socket joins a room named after its user id (`sub`). Services fan out to users with `SocketEmitter.emitToUser`/`emitToUsers`. For guild-wide events they first look up member ids with `UserRepository.getGuildUsers`; there are no guild or channel rooms.
- Presence is `PresenceService`, an in-memory map that broadcasts its own changes and assumes a single API instance.
- Inbound events are manual `socket.on` listeners, not `@SubscribeMessage`, because the global guard and interceptor assume HTTP.

**AI bots (`src/modules/ai/`).** Three bots are defined as data in `BOTS` (`bots.ts`: hard-coded user UUIDs, trigger regex, system prompt); their users are upserted on init and are always shown online. After a human message, `BotConversationService` (message module) waits for 0.6 s of channel silence, then runs one cycle: an LLM router (`AIService.route`) reads the last 20 channel messages and picks who speaks. Bots named in a human message always answer (name detection runs only on human messages) and addressed replies are uncapped. The router may add unnamed speakers up to 2 speakers in total (with 3 bots named, all 3 answer and none is added). Each reply is generated from the last 30 messages: addressed speakers (named or picked as addressed by the router) reply in parallel, each posting when ready, so they do not see each other; spontaneous speakers then take turns after them and see the earlier replies; then at most 1 reaction from a bot that did not speak, which is told whose replies it reacts to so it comments on them (teasing allowed) instead of answering again. Spontaneous replies, reactions included, are capped in code at 1 per bot per channel per 10 minutes (in memory, single instance). Replies are short chat-style messages (a shared `CHAT_STYLE` prompt), go through the Vercel AI SDK, and are paced like typing: the bot's typing status stays on until the reply is posted, and a spontaneous speaker or a reaction pauses to read before answering the other bots. The model comes from `AI_MODEL` (`provider:model`: `anthropic`, `openai`, or `ollama` through its OpenAI-compatible API at `OLLAMA_BASE_URL`; default `anthropic:claude-haiku-5-5`); without that provider's key the bots stay off (Ollama needs none). `AI_ROUTER=off`, or a router failure or invalid output, falls back to name detection: only named bots answer, with no spontaneous replies or reactions.

## Web architecture (`apps/web`)

**One origin.** The browser must see the web app and the API on the same origin, because auth is the API's HttpOnly session cookie: in dev Vite proxies `/api` and `/socket.io` to the API (`vite.config.ts`), and in the production image the API serves the built SPA. The web app has no env vars and never handles tokens.

**Routes and providers.** `src/main.tsx` defines the React Router routes (pages in `src/pages/`). The root route (`src/root-layout.tsx`) wraps everything in `src/providers.tsx`: `QueryProvider` → `AuthProvider` → `SocketProvider` → `AppProvider`.

- `AuthProvider` asks `GET /api/v1/auth/me` once and exposes `status` through `useAuth`. Logging in is a navigation to `/api/v1/auth/login` (`src/pages/login.tsx`); `src/lib/logout.ts` posts `/api/v1/auth/logout` and follows the Keycloak end-session URL.
- `SocketProvider` opens the same-origin Socket.IO connection once the session is authenticated; the cookie authenticates the handshake.

**State model (`src/contexts/providers/AppProvider.tsx`).**

1. When the socket connects, `AppProvider` calls `GET /users/@me/sync` and loads the whole client state into React context: guilds with members, channels with messages, users and presence.
2. Socket events are then applied as incremental updates to that state.
3. A `forceSync` event triggers a full re-sync.

Components read this state through `useAppContext`. `MockDataProvider` is a leftover from the prototype that some layouts still use, and real data comes from `AppProvider`.

**HTTP.** Requests go through `useApi` / `useApiData` / `useApiMutation` (`src/lib/hooks/`), built on an axios client (`src/lib/api/client.ts`) with base URL `/api/v1`; a 401 sends the user to `/login`.

**UI.** `src/components/ui/` contains generated shadcn components (see `components.json`).

## Cross-app contracts (`packages/shared`)

Anything both apps need lives in `@fidechat/shared`, never as a copy in either app. Its `src/` is grouped by kind, one declaration per file, with the kind as the suffix: `enums/*.enum.ts`, `constants/*.constant.ts` (runtime values, e.g. for validation), `types/*.type.ts` (aliases and unions) and `interfaces/{entities,socket,responses,payloads}/*.interface.ts`. Apps import only from the package root (`@fidechat/shared`). It holds no runtime dependencies: Drizzle rows, DTO classes and validation stay in the api.

- **It is compiled.** `tsc` emits ESM to `dist/`, which is what both apps load, so `dev`, `lint` and `typecheck` depend on `^build`. `pnpm dev` runs `turbo watch dev`: an edit in `shared` rebuilds it, restarts the api (`@fidechat/api#dev` is `interruptible`) and Vite hot-reloads the web. With `futureFlags.watchUsingTaskInputs`, that task's `inputs` are only `package.json`, so turbo restarts it for dependency changes and leaves api source edits to `nest --watch` (an empty `inputs` list means "default" and would restart it on every edit).
- **Socket events.** `SocketEvents` plus the `ServerToClientEvents` / `ClientToServerEvents` maps. Adding an event means touching the enum, the map and the handler in `AppProvider`.
- **Wire shapes.** Entities are the JSON the api sends: `T | null` for nullable columns and `createdAt` as an ISO string, not the Drizzle `Date`. Payload interfaces are implemented by the api DTOs (`class GuildDto implements GuildPayload`).

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
