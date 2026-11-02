# Fidechat

Monorepo de Fidechat: un clon de Discord con mensajería en tiempo real.
Nace de la fusión de dos repositorios independientes (hoy archivados),
conservando el historial de commits completo de ambos:

| Workspace  | Paquete          | Origen (archivado)                                                  | Stack                                        |
| ---------- | ---------------- | ------------------------------------------------------------------- | -------------------------------------------- |
| `apps/api` | `@fidechat/api`  | [Datzu712/Fidechat-backend](https://github.com/Datzu712/Fidechat-backend) | NestJS 12 · Fastify · PostgreSQL + Drizzle · Keycloak · Socket.IO |
| `apps/web` | `@fidechat/web`  | [Datzu712/fidechat-web](https://github.com/Datzu712/fidechat-web)         | Next.js 16 · React 19 · Tailwind v4 · Radix UI   |

## Historia del proyecto

Fidechat es un side project que ha pasado por tres versiones. **Las dos primeras
se escribieron sin asistentes de IA**; la tercera es un refactor asistido por IA.

| Versión | Fechas | Backend | Frontend | Tags | Hecho con IA |
| ------- | ------ | ------- | -------- | ---- | ------------ |
| **v1** | nov 2024 – feb 2025 | Java 21 · Spring Boot 3.1 · JDBC (PostgreSQL) · JWT · WebSockets | React 18 · Vite | `api-v1-java` · `web-v1-vite` | No |
| **v2** | jul 2025 – ago 2025 | NestJS 11 · Fastify · Oracle (paquetes PL/SQL y triggers) · Keycloak · Socket.IO | Next.js 15 · shadcn/ui · NextAuth | `api-v2-nest-oracle` · `web-v2-next` | No |
| **v3** | ago 2026 – hoy | NestJS 12 · PostgreSQL + Drizzle · monorepo Turborepo | Next.js 16 · Tailwind v4 | — | Sí, con Claude |

**Cómo verificarlo:**

- Los repositorios originales están **archivados (solo lectura) en GitHub**, con sus
  hashes, pull requests y PRs de Dependabot originales:
  [Fidechat-backend](https://github.com/Datzu712/Fidechat-backend) y
  [fidechat-web](https://github.com/Datzu712/fidechat-web).
- Al fusionarlos aquí los archivos se movieron a `apps/*`, lo que cambia los hashes.
  [docs/history-map.md](docs/history-map.md) relaciona cada commit del monorepo con
  su commit original en GitHub (171 de 171).
- Todos los commits de v3, y solo esos, llevan la línea
  `Co-Authored-By: Claude …`. Para listarlos:
  `git log --grep='Co-Authored-By: Claude'`.
- Los bots de chat con OpenAI que aparecen desde v2 son una **funcionalidad del
  producto**, no código generado con IA.

**Cómo levantar una versión antigua:** cada tag deja el código exactamente como
estaba, con sus propias instrucciones y archivos de Docker.

```bash
# v1: backend Java (requiere JDK 21) y frontend Vite
git switch --detach api-v1-java && cd apps/api && ./mvnw spring-boot:run
git switch --detach web-v1-vite && cd apps/web && pnpm install && pnpm dev

# v2: backend NestJS con Oracle XE + Keycloak, frontend Next.js
git switch --detach api-v2-nest-oracle && cd apps/api \
  && docker compose -f local-docker-compose.yaml up -d && pnpm install && pnpm dev
git switch --detach web-v2-next && cd apps/web && pnpm install && pnpm dev
```

En v1 y v2 cada app tenía su propio `pnpm-lock.yaml` y no existía el workspace, así
que los comandos se ejecutan dentro de `apps/api` o `apps/web`. Para volver:
`git switch main`.

## Estructura

```
fidechat/
├── apps/
│   ├── api/          # backend NestJS  (@fidechat/api)
│   └── web/          # frontend Next.js (@fidechat/web)
├── packages/         # código compartido (vacío por ahora)
├── docs/             # history-map.md: hashes del monorepo ↔ repos originales
├── .github/          # workflows de CI
├── package.json      # raíz del workspace
├── pnpm-workspace.yaml
└── turbo.json
```

## Requisitos

- Node.js >= 24.15
- pnpm >= 10
- Docker + Docker Compose (para Postgres y Keycloak)

## Uso

```bash
pnpm install          # instala las dependencias de todos los workspaces

pnpm dev              # levanta api y web a la vez
pnpm build            # compila todo
pnpm lint             # lint de todo
pnpm test             # tests de todo
```

Para trabajar sobre un solo workspace se usa `--filter`:

```bash
pnpm --filter @fidechat/api dev
pnpm --filter @fidechat/web dev
pnpm --filter @fidechat/api add <paquete>
```

## Servicios de infraestructura

Los compose files viven en `apps/api` y siguen ejecutándose desde ahí:

```bash
cd apps/api
cp .env.sample .env
docker compose -f local-docker-compose.yaml up -d   # Postgres + Keycloak
pnpm db:migrate                                     # crea el schema con Drizzle
```

El build de producción del backend (`apps/api/dockerfile.prod`) usa la raíz del
monorepo como contexto, porque el lockfile de pnpm ahora es único y vive ahí.

## Documentación por app

- [apps/api/README.md](apps/api/README.md) — endpoints, esquema de base de datos, setup de Keycloak.
- [apps/web/README.md](apps/web/README.md) — features y estructura del cliente.
