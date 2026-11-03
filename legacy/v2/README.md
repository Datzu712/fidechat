# Fidechat v2 (Jul – Aug 2025)

NestJS 11 + Fastify backend on Oracle XE 18.4 (PL/SQL packages and triggers),
Keycloak 26 for auth, Next.js 15 + NextAuth frontend, Socket.IO.
Built from tags `api-v2-nest-oracle` and `web-v2-next`.

> [!WARNING]
> University project with known vulnerabilities. Local use only; see
> [legacy/README.md](../README.md).

## Run it

From the repository root, build from local checkouts of the tags (works
offline and on forks):

```bash
git worktree add ../fidechat-api-v2 api-v2-nest-oracle
git worktree add ../fidechat-web-v2 web-v2-next
V2_API_SRC=$PWD/../fidechat-api-v2/apps/api V2_WEB_SRC=$PWD/../fidechat-web-v2/apps/web \
  docker compose -f legacy/v2/compose.yaml up --build
# Or just
docker compose -f legacy/v2/compose.yaml up --build
# if you don't mind downloading the tags from GitHub.
```

Open http://localhost:4200. You are sent to Keycloak; log in as `ana` or
`bruno` (or their `@demo.local` emails), password `demo1234`.

Stop with `docker compose -f legacy/v2/compose.yaml down`; add `-v` to wipe
Oracle and start again from the seed. A fresh start takes about 20 seconds.

Oracle XE 18 only has an x86-64 image, so this does not run natively on ARM
machines such as Apple Silicon.

## Environment variables

All optional. Set them in the shell, or in a `legacy/v2/.env` file (Compose
reads it automatically; it is git-ignored, so it is the right place for an API
key):

| Variable | Default | What it does |
| -------- | ------- | ------------ |
| `V2_API_SRC` | the `api-v2-nest-oracle` tag on GitHub | Backend source: a git URL or an **absolute** path to `apps/api` of a checkout. |
| `V2_WEB_SRC` | the `web-v2-next` tag on GitHub | Frontend source: a git URL or an **absolute** path to `apps/web` of a checkout. |
| `OPENAI_API_KEY` | not set | Makes the AI bots answer. Without it they show up online but stay silent. |
| `OPENAI_REPLACEMENT_MODEL` | `gpt-4o-mini` | Model used instead of the retired `gpt-3.5-turbo` (see below). |

```bash
# legacy/v2/.env
OPENAI_API_KEY=sk-...
V2_API_SRC=/home/you/code/fidechat-api-v2/apps/api
V2_WEB_SRC=/home/you/code/fidechat-web-v2/apps/web
```

The ports (4200 web, 4201 API, 4280 Keycloak) are fixed, because the Keycloak
realm's redirect URIs and the token issuer are built from them. The app's own
settings (Oracle and Keycloak credentials, client secret, NextAuth secret) are
fixed demo values in `compose.yaml` and `keycloak/realm-fidechat.json`.

## Talking to the AI bots

With `OPENAI_API_KEY` set, mention a bot in any message: `chat yipiyi` (or
`gpt`), `chayanne`, or `pedro pascal`. Each one has its own personality.

v2 asks OpenAI for `gpt-3.5-turbo`, which has been retired. The API reaches
OpenAI through `openai-proxy/`, which forwards every request unchanged except
for swapping that model name.

## Admin access

- **Keycloak console:** http://keycloak.localhost:4280, user `admin`, password
  `admin`.
- **Oracle:** not published to the host. Open SQL*Plus inside the container
  with `docker compose -f legacy/v2/compose.yaml exec oracle sqlplus admin/admin@//localhost:1521/XEPDB1`.

## How it is put together

| Service | What it is |
| ------- | ---------- |
| `oracle` | Oracle XE 18.4 (`gvenzl/oracle-xe` slim image, which ships a ready database). Loads the tag's `init.sql`, `pkg_*.sql` and `triggers.sql` unmodified into the original `ADMIN` schema, then the demo seed. |
| `keycloak` | Keycloak 26.3 with an imported realm: client `fidechat` and the demo users, whose ids match the Oracle seed. |
| `api` | The NestJS API, built from the tag. |
| `web` | The Next.js app, built from the tag. |
| `openai-proxy` | Swaps the retired model name; see above. |

Keycloak is published as `keycloak.localhost:4280`. Browsers resolve
`*.localhost` to your machine, and inside Docker the same name is a network
alias, so the token issuer is identical for the browser, the API and NextAuth,
which v2 checks in all three places.

## Known v2 bugs, kept as they were

- If a channel is empty when the page loads, the client crashes when that
  channel's first message arrives (`t.messages is not iterable`). The seed gives
  every channel a message so the demo avoids it.
- Users see their own "is typing" indicator.
- The public server list shows "No description available" even when the server
  has one.
