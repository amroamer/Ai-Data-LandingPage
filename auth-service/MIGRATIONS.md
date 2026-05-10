# Database migrations

Schema changes go through Alembic. The container entrypoint runs
`alembic upgrade head` on every start, so any migration committed and pushed
gets applied automatically the next time the service is deployed or
restarted — no manual step on the server.

## Files

- `alembic.ini` — Alembic config (the URL here is a placeholder; the real
  one is read from the `DATABASE_URL` env var in `alembic/env.py`).
- `alembic/env.py` — wires Alembic to `app.config.settings` and
  `app.models.Base.metadata` for autogenerate.
- `alembic/versions/` — one Python file per migration, applied in order of
  their revision graph (`down_revision` chain).
- `docker-entrypoint.sh` — waits for the DB, stamps the baseline if a
  pre-Alembic schema is detected, runs `alembic upgrade head`, then execs
  uvicorn.

## Adding a schema change

1. Edit `app/models.py`.
2. With the dev stack running (`docker compose up -d`), generate a migration:

   ```sh
   ./scripts/make_migration.sh "add user avatar column"
   ```

   This writes a new file to `alembic/versions/`.
3. **Open the generated file and review it.** Autogenerate is good but not
   perfect — verify column types, indexes, and any data backfills it
   missed.
4. Commit the migration file alongside your model change in the same
   commit, push, and let the deploy pipeline rebuild & restart the
   container. The entrypoint applies the migration before serving traffic.

## Running manually

From inside the container:

```sh
alembic current        # show currently-applied revision
alembic history        # full graph
alembic upgrade head   # apply pending migrations
alembic downgrade -1   # roll back one migration (avoid in prod)
```

## Pre-Alembic deployments

The first version of this service used `Base.metadata.create_all` at
startup, leaving production databases with the schema but no
`alembic_version` table. The entrypoint detects this case (tables exist,
no `alembic_version`) and stamps `0001_initial_schema` so the upgrade is a
no-op. After that first stamp, the database is on the regular Alembic
flow and every future migration applies normally.
