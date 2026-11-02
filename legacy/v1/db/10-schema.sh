#!/bin/sh
# Loads backup.sql WITHOUT modifying it. It runs without ON_ERROR_STOP because
# the second half of the dump redeclares the uuid-ossp functions (already
# created by 00-extensions.sql), so those "already exists" errors are expected.
# Afterwards, check that the four app tables exist.
set -eu

psql -v ON_ERROR_STOP=0 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
    -f /legacy/backup.sql >/dev/null 2>&1 || true

tables=$(psql -tA --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c \
    "select count(*) from information_schema.tables
     where table_schema = 'public' and table_name in ('user', 'channel', 'message', 'user_channel')")

if [ "$tables" != "4" ]; then
    echo "backup.sql did not create the 4 expected tables (found: $tables)" >&2
    exit 1
fi
echo "v1 schema loaded from backup.sql"
