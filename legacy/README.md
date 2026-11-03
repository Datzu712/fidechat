# Legacy versions

Docker Compose environments that build and run the **exact code of each old
version's git tags**, with demo data. The tags are never modified; the glue
lives here.

> [!WARNING]
> v1 and v2 were university projects built in one term each, and they are old.
> They have **known vulnerabilities** (outdated dependencies, missing
> authorization checks, hard-coded demo secrets in these environments) and
> rushed code. Run them only on your machine, for reference. Never deploy them
> or use them in production.

| Version | Stack | Tags | URL | Guide |
| ------- | ----- | ---- | --- | ----- |
| v1 | Java + Spring Boot, React + Vite, PostgreSQL | `api-v1-java`, `web-v1-vite` | http://localhost:4100 | [v1/README.md](v1/README.md) |
| v2 | NestJS + Oracle + Keycloak, Next.js | `api-v2-nest-oracle`, `web-v2-next` | http://localhost:4200 | [v2/README.md](v2/README.md) |

Each guide covers how to run the version, its environment variables, and its
known bugs. Both need only Docker with Compose. Screenshots are in
[docs/screenshots/](../docs/screenshots/README.md).
