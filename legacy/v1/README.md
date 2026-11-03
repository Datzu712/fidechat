# Fidechat v1 (Nov 2024 – Feb 2025)

Java 21 + Spring Boot 3.1 backend, React 18 + Vite frontend, PostgreSQL 17.
Built from tags `api-v1-java` and `web-v1-vite`.

> [!WARNING]
> University project with known vulnerabilities. Local use only; see
> [legacy/README.md](../README.md).

## Run it

From the repository root, build from local checkouts of the tags (works
offline and on forks):

```bash
git worktree add ../fidechat-api-v1 api-v1-java
git worktree add ../fidechat-web-v1 web-v1-vite
V1_API_SRC=$PWD/../fidechat-api-v1/apps/api V1_WEB_SRC=$PWD/../fidechat-web-v1/apps/web \
  docker compose -f legacy/v1/compose.yaml up --build
# Or just
docker compose -f legacy/v1/compose.yaml up --build
# if you don't mind downloading the tags from GitHub.
```

Open http://localhost:4100 and log in with `ana@demo.local` or
`bruno@demo.local`, password `demo1234`. You can also sign up a new user.

Stop with `docker compose -f legacy/v1/compose.yaml down`; add `-v` to wipe the
database and start again from the seed.

## Environment variables

All optional. Set them in the shell, or in a `legacy/v1/.env` file (Compose
reads it automatically; it is git-ignored):

| Variable | Default | What it does |
| -------- | ------- | ------------ |
| `V1_PORT` | `4100` | Port the app is published on. |
| `V1_API_SRC` | the `api-v1-java` tag on GitHub | Backend source: a git URL or an **absolute** path to `apps/api` of a checkout. |
| `V1_WEB_SRC` | the `web-v1-vite` tag on GitHub | Frontend source: a git URL or an **absolute** path to `apps/web` of a checkout. |

```bash
# legacy/v1/.env
V1_PORT=4100
V1_API_SRC=/home/you/code/fidechat-api-v1/apps/api
V1_WEB_SRC=/home/you/code/fidechat-web-v1/apps/web
```

The app's own settings (database credentials, JWT secrets) are fixed demo
values in `compose.yaml`; edit them there if you need to.

## How it is put together

```
browser ──► web (nginx :4100) ──► /api, /ws ──► api (Spring Boot :8080) ──► db (PostgreSQL 17)
              └─ static React build
```

- **db** loads the tag's `backup.sql` unmodified (`db/10-schema.sql`), after
  creating the `uuid-ossp` extension it depends on, then the demo seed.
- **api** is built with the same Maven image the original Dockerfile used.
- **web** is served by nginx on the same origin as `/api` and `/ws`, because v1
  keeps the session in a `Secure`, same-site cookie.

## Known v1 bugs, kept as they were

- The API trusts the `authorId` sent in the message body, so a user can post as
  someone else.
- A channel owner sees their channel once per member.
- Timestamps mix local time and UTC.
- A newly created channel only shows up in the sidebar after a reload.
