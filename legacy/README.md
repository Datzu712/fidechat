# Legacy versions

Docker Compose environments that build and run the **exact code of each old
version's git tags**, with demo data. The tags are never modified; the glue
lives here.

| Version | Tags | URL |
| ------- | ---- | --- |
| v1 (Java + React/Vite) | `api-v1-java`, `web-v1-vite` | http://localhost:4100 |
| v2 (NestJS/Oracle + Next.js) | `api-v2-nest-oracle`, `web-v2-next` | http://localhost:4200 |

Demo users in both: Ana and Bruno, password `demo1234` (v1 logs in with
`ana@demo.local`, v2 through Keycloak with `ana` or `ana@demo.local`).

To run a version, build from local checkouts of its tags (works offline and on forks):

```bash
git worktree add ../fidechat-api-v1 api-v1-java
git worktree add ../fidechat-web-v1 web-v1-vite
V1_API_SRC=$PWD/../fidechat-api-v1/apps/api V1_WEB_SRC=$PWD/../fidechat-web-v1/apps/web \
  docker compose -f legacy/v1/compose.yaml up --build
# Or just
docker compose -f legacy/v1/compose.yaml up --build
# if you don't mind downloading the tags from GitHub.
```

v2 works the same way with `api-v2-nest-oracle`, `web-v2-next`, `V2_API_SRC`,
`V2_WEB_SRC` and `legacy/v2/compose.yaml`. Use `down -v` to reset the data.

v2 notes: Oracle XE 18 only has an x86-64 image. The AI bots answer only if you
export `OPENAI_API_KEY` before starting it. They ask for `gpt-3.5-turbo`, which
OpenAI retired, so `legacy/v2/openai-proxy` swaps it for `gpt-4o-mini` (override
with `OPENAI_REPLACEMENT_MODEL`).

Known v1 bugs, kept as they were: the API trusts the `authorId` in the message
body, and a channel owner sees their channel once per member.

Known v2 bug, kept as it was: if a channel is empty when the page loads, the
client crashes when that channel's first message arrives (`t.messages is not
iterable`). The seed gives every channel a message so the demo avoids it.
