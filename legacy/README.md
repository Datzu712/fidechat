# Legacy versions

Docker Compose environments that build and run the **exact code of each old
version's git tags**, with demo data. The tags are never modified; the glue
lives here.

| Version | Tags | URL |
| ------- | ---- | --- |
| v1 (Java + React/Vite) | `api-v1-java`, `web-v1-vite` | http://localhost:4100 |
| v2 (NestJS/Oracle + Next.js) | `api-v2-nest-oracle`, `web-v2-next` | _in progress_ |

v1 demo users: `ana@demo.local` and `bruno@demo.local`, password `demo1234`.

To run v1, build from local checkouts of its tags (works offline and on forks):

```bash
git worktree add ../fidechat-api-v1 api-v1-java
git worktree add ../fidechat-web-v1 web-v1-vite
V1_API_SRC=$PWD/../fidechat-api-v1/apps/api V1_WEB_SRC=$PWD/../fidechat-web-v1/apps/web \
  docker compose -f legacy/v1/compose.yaml up --build
# Or just
docker compose -f legacy/v1/compose.yaml up --build
# if you don't mind downloading the tags from GitHub.
```

Use `down -v` to reset the data.

Known v1 bugs, kept as they were: the API trusts the `authorId` in the message
body, and a channel owner sees their channel once per member.
