# Legacy versions

One-command, reproducible environments for the old versions of Fidechat. Each
one builds the **exact code of its git tags** and never modifies it: the tags
are the record of what was written before AI assistance, so all the glue
(Dockerfiles, nginx, seed data) lives here instead.

> The files in this folder are v3 tooling, written with AI assistance. The
> application code they build and run is not.

| Version | Tags | Stack | URL |
| ------- | ---- | ----- | --- |
| v1 | `api-v1-java`, `web-v1-vite` | Java 21 · Spring Boot 3.1 · PostgreSQL · React 18 · Vite | http://localhost:4100 |
| v2 | `api-v2-nest-oracle`, `web-v2-next` | NestJS 11 · Oracle XE · Keycloak · Next.js 15 | _work in progress_ |

## Running v1

```bash
docker compose -f legacy/v1/compose.yaml up --build
```

Then open http://localhost:4100 and log in with one of the demo users:

| Email | Password |
| ----- | -------- |
| `ana@demo.local` | `demo1234` |
| `bruno@demo.local` | `demo1234` |

Ana owns the `#general` channel and Bruno is a member, so messages show up in
real time on both sides. You can also sign up a new user from the UI.

Stop it with `docker compose -f legacy/v1/compose.yaml down` (add `-v` to wipe
the database and start from the seed again). Set `V1_PORT` to use a port other
than 4100.

### Without access to GitHub

By default the build contexts point at the tags on
`https://github.com/Datzu712/fidechat`. If that repository is private, you are
offline, or you are working on a fork, export the tags from your local clone:

```bash
legacy/export-tags.sh v1
docker compose --env-file legacy/.src/v1.env -f legacy/v1/compose.yaml up --build
```

`export-tags.sh` uses `git archive`, so the exported folders contain exactly
what the tags contain. They go to `legacy/.src/`, which is git-ignored.

## How v1 is put together

```
browser ──► web (nginx :4100) ──► /api, /ws ──► api (Spring Boot :8080) ──► db (PostgreSQL 17)
              └─ static React build
```

- **db**: loads `apps/api/backup.sql` from the tag untouched. The dump creates
  the tables before the `uuid-ossp` functions they use as defaults, so the
  extension is created first (`00-extensions.sql`) and the expected
  "already exists" errors from the dump are ignored. `10-schema.sh` then checks
  that the four tables exist. `20-seed.sql` adds the demo data.
- **api**: built with the same `maven:3.9.9-eclipse-temurin-21` image as the
  original Dockerfile. The pom has no Spring Boot parent, so `package` produces
  a thin jar (the original ran `mvn spring-boot:run`); the image runs it with
  the runtime dependencies on the classpath instead.
- **web**: built with pnpm from the tag's lockfile and served by nginx, which
  also proxies `/api` and `/ws` to the backend. v1 keeps the session in a
  `Secure`, same-site cookie, so frontend and API must share one origin.
  Browsers treat `localhost` as secure, which is why plain HTTP works.

## Known issues in the original v1 code

These are bugs in v1 itself. They are left as they were on purpose.

- `POST /api/channels/{id}/messages` trusts the `authorId` sent in the request
  body, so a logged-in user can post as someone else.
- The channel list query joins `user_channel` and also matches `owner_id`, so a
  channel owner sees their channel once per member once it has two or more.
