# v2 backend (tag api-v2-nest-oracle): NestJS 11 + Fastify, built with SWC.
# node-oracledb 6 runs in thin mode, so no Oracle Instant Client is needed.
FROM node:22-alpine AS build
RUN npm install -g pnpm@10.14.0
WORKDIR /app
COPY --from=src . .
RUN pnpm install --frozen-lockfile && pnpm build && pnpm prune --prod

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
EXPOSE 8080
CMD ["node", "dist/main.js"]
