# Legacy versions

Docker Compose environments that build and run the **exact code of each old
version's git tags**, with demo data. The tags are never modified; the glue
lives here. These files are v3 tooling written with AI; the code they run is not.

| Version | Tags | Run | URL |
| ------- | ---- | --- | --- |
| v1 (Java + React/Vite) | `api-v1-java`, `web-v1-vite` | `docker compose -f legacy/v1/compose.yaml up --build` | http://localhost:4100 |
| v2 (NestJS/Oracle + Next.js) | `api-v2-nest-oracle`, `web-v2-next` | _in progress_ | |

v1 demo users: `ana@demo.local` and `bruno@demo.local`, password `demo1234`.

Use `down -v` to reset the data. To build from a local clone instead of GitHub
(offline or a fork), point the sources at checkouts of the tags:

```bash
git worktree add ../fidechat-api-v1 api-v1-java
git worktree add ../fidechat-web-v1 web-v1-vite
V1_API_SRC=$PWD/../fidechat-api-v1/apps/api V1_WEB_SRC=$PWD/../fidechat-web-v1/apps/web \
  docker compose -f legacy/v1/compose.yaml up --build
```

Known v1 bugs, kept as they were: the API trusts the `authorId` in the message
body, and a channel owner sees their channel once per member.
