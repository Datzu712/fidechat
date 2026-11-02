# Oracle XE 18.4 (same release as v2's original compose) with the v2 schema,
# PL/SQL packages and triggers from apps/api/sql of tag api-v2-nest-oracle.
# The gvenzl image is used because it runs init scripts on first start.
FROM gvenzl/oracle-xe:18.4.0-slim

COPY --from=src sql/ /legacy/sql/
COPY 10-schema.sql 20-seed.sql /container-entrypoint-initdb.d/
