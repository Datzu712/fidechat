# Fidechat

Monorepo de Fidechat: un clon de Discord con mensajería en tiempo real.
Nace de la fusión de dos repositorios independientes, conservando el historial
de commits completo de ambos:

| Workspace  | Paquete          | Origen                                                              | Stack                                        |
| ---------- | ---------------- | ------------------------------------------------------------------- | -------------------------------------------- |
| `apps/api` | `@fidechat/api`  | [Datzu712/Fidechat-backend](https://github.com/Datzu712/Fidechat-backend) | NestJS 11 · Fastify · Oracle 18c · Keycloak · Socket.IO |
| `apps/web` | `@fidechat/web`  | [Datzu712/fidechat-web](https://github.com/Datzu712/fidechat-web)         | Next.js 15 · React 19 · Tailwind · Radix UI   |

## Estructura

```
fidechat/
├── apps/
│   ├── api/          # backend NestJS  (@fidechat/api)
│   └── web/          # frontend Next.js (@fidechat/web)
├── packages/         # código compartido (vacío por ahora)
├── .github/          # workflows de CI
├── package.json      # raíz del workspace
├── pnpm-workspace.yaml
└── turbo.json
```

## Requisitos

- Node.js >= 20
- pnpm >= 10
- Docker + Docker Compose (para Oracle, Postgres y Keycloak)

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
docker compose -f local-docker-compose.yaml up -d
```

El build de producción del backend (`apps/api/dockerfile.prod`) usa la raíz del
monorepo como contexto, porque el lockfile de pnpm ahora es único y vive ahí.

## Documentación por app

- [apps/api/README.md](apps/api/README.md) — endpoints, esquema de base de datos, setup de Keycloak.
- [apps/web/README.md](apps/web/README.md) — features y estructura del cliente.
