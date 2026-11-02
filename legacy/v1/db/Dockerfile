# PostgreSQL with the original v1 schema (apps/api/backup.sql from tag api-v1-java).
FROM postgres:17.2-alpine

COPY --from=src backup.sql /legacy/backup.sql
COPY 00-extensions.sql 20-seed.sql /docker-entrypoint-initdb.d/
COPY --chmod=755 10-schema.sh /docker-entrypoint-initdb.d/
