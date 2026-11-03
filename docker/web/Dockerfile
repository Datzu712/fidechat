# Fidechat web (Next.js). The build context is the monorepo root:
#   docker build -f docker/web/Dockerfile .
FROM node:26-alpine
RUN npm install -g pnpm@12.16.1
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile --filter @fidechat/web...

COPY apps/web ./apps/web
# NEXT_PUBLIC_* values are inlined into the client bundle at build time.
ARG NEXT_PUBLIC_REST_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_REST_API_URL=$NEXT_PUBLIC_REST_API_URL NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
RUN pnpm --filter @fidechat/web build

ENV NODE_ENV=production
WORKDIR /repo/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
