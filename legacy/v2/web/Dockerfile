# v2 frontend (tag web-v2-next): Next.js 15 + NextAuth (Keycloak provider).
FROM node:22-alpine
RUN npm install -g pnpm@10.14.0
WORKDIR /web
COPY --from=src . .
# NEXT_PUBLIC_* values are inlined into the client bundle at build time.
ARG NEXT_PUBLIC_REST_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_REST_API_URL=$NEXT_PUBLIC_REST_API_URL NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
RUN pnpm install --frozen-lockfile && pnpm build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "start"]
