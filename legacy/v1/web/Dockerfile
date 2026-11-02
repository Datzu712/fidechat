# v1 frontend (tag web-v1-vite): React 18 + Vite, served by nginx.
FROM node:22.10.0-alpine AS build
RUN npm install -g pnpm@9.15.0
WORKDIR /web
COPY --from=src . .
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_NODE_ENV=production VITE_API_URL=$VITE_API_URL VITE_WS_URL=$VITE_WS_URL
RUN pnpm install --frozen-lockfile && pnpm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /web/dist /usr/share/nginx/html
