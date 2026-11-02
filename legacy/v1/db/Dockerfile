# PostgreSQL with the original v1 schema (apps/api/backup.sql from tag api-v1-java).
FROM postgres:17.2-alpine

COPY --from=src backup.sql /legacy/backup.sql
COPY 00-extensions.sql 10-schema.sql 20-seed.sql /docker-entrypoint-initdb.d/
