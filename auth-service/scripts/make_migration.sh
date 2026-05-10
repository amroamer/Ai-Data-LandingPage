#!/bin/sh
# Generate a new Alembic migration by autogenerating a diff between
# `app/models.py` and the current database schema.
#
# Usage:
#   ./scripts/make_migration.sh "add user avatar column"
#
# Run this from a host with the dev stack up (`docker compose up -d` from
# auth-service/) — it execs into the auth-service container so it sees the
# same Python env and DATABASE_URL as production.
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 \"short description of the change\"" >&2
  exit 1
fi

MESSAGE="$1"

docker compose exec auth-service alembic revision --autogenerate -m "$MESSAGE"

echo
echo "New migration written to auth-service/alembic/versions/."
echo "Review the file, commit it alongside your model changes, then push."
echo "It will be applied automatically the next time the container starts."
