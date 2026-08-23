#!/bin/bash
# Se ejecuta una sola vez, cuando el volumen de Postgres se inicializa vacio.
# Crea la base de la aplicacion junto a la de Keycloak, en la misma instancia.
set -e

APP_DB="${APP_DB_NAME:-fidechat}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE "$APP_DB"'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$APP_DB')\gexec
EOSQL

echo "Base de datos '$APP_DB' lista."
