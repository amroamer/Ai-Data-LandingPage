#!/bin/sh
# Run Alembic migrations before starting the API.
#
# Behaviour:
#   - Waits up to 60s for the database to accept connections.
#   - If the schema already exists from a pre-Alembic deploy (the `users`
#     table is present but `alembic_version` is not), stamps the baseline so
#     subsequent migrations apply cleanly without trying to recreate tables.
#   - Runs `alembic upgrade head` to apply any pending migrations.
#   - Execs uvicorn so signals (SIGTERM on container stop) reach the app.
set -e

cd /app

python <<'PY'
import os
import sys
import time

from sqlalchemy import create_engine, inspect, text

from app.config import settings

url = settings.DATABASE_URL_SYNC
engine = create_engine(url)

# Wait for the database to accept connections.
deadline = time.time() + 60
last_err = None
while time.time() < deadline:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        break
    except Exception as exc:
        last_err = exc
        time.sleep(1)
else:
    print(f"DB not reachable within timeout: {last_err}", file=sys.stderr)
    sys.exit(1)

# If a pre-Alembic schema exists, mark the baseline as applied so the
# upgrade below is a no-op rather than a "table already exists" error.
inspector = inspect(engine)
tables = set(inspector.get_table_names())
if "users" in tables and "alembic_version" not in tables:
    print("Pre-Alembic schema detected — stamping baseline revision")
    os.system("alembic stamp 0001_initial_schema")

engine.dispose()
PY

echo "Running database migrations..."
alembic upgrade head

echo "Starting auth-service..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
