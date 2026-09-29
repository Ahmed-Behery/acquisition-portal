#!/bin/sh
# Creates the database the e2e suite uses, alongside the development one.
#
# Runs once, on first initialisation of the data volume. Separate databases
# keep `TRUNCATE` in the test suite from ever reaching development data.
set -eu

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  SELECT 'CREATE DATABASE ${POSTGRES_DB}_test'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${POSTGRES_DB}_test')\gexec
EOSQL

echo "Test database '${POSTGRES_DB}_test' is ready."
