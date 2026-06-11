#!/usr/bin/env bash
set -e

echo "===================================================="
echo "Internal Container: Initializing Database User & Schema"
echo "===================================================="

DB_HOST="db"

echo "Waiting for PostgreSQL database on $DB_HOST:5432 to be ready..."
until pg_isready -h "$DB_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  echo "Database is unavailable - sleeping for 1 second..."
  sleep 1
done

echo "Database is online! Executing SQL user provisioning..."

# Authenticate non-interactively using the master admin password
export PGPASSWORD="$POSTGRES_PASSWORD"

psql -h "$DB_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<EOF
BEGIN;

-- 1. Create or update the application user role safely
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$APP_DB_USER') THEN
        CREATE USER $APP_DB_USER WITH ENCRYPTED PASSWORD '$APP_DB_PASSWORD';
    ELSE
        ALTER USER $APP_DB_USER WITH ENCRYPTED PASSWORD '$APP_DB_PASSWORD';
    END IF;
END
\$\$;

-- 2. Grant connection rights to the database
GRANT CONNECT ON DATABASE $POSTGRES_DB TO $APP_DB_USER;

-- 3. AUTOMATION FIX: Change ownership of the public schema to the app user
-- This allows the app user to create tables (crucial for Alembic migrations)
ALTER SCHEMA public OWNER TO $APP_DB_USER;

-- 4. Explicitly grant create and usage rights on the schema as a safety fallback
GRANT CREATE, USAGE ON SCHEMA public TO $APP_DB_USER;

-- 5. Grant permissions on any pre-existing tables/sequences (if volume already had data)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $APP_DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $APP_DB_USER;

-- 6. Establish default privileges for any tables/sequences created by other users in the future
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO $APP_DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO $APP_DB_USER;

COMMIT;
EOF

unset PGPASSWORD

echo "SUCCESS: Database user '$APP_DB_USER' is now the owner of the public schema!"
echo "===================================================="