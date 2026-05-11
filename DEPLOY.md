# Deployment

Every deploy automatically runs database migrations and seeds first-time
data. You don't need to manage migrations by hand — they're part of the
container startup contract.

## What happens on every deploy

When `auth-service` starts, [`auth-service/docker-entrypoint.sh`](auth-service/docker-entrypoint.sh)
runs this pipeline:

1. **Wait** up to 60s for Postgres to accept connections.
2. **Stamp baseline** if the schema exists from a pre-Alembic install
   (tables present but no `alembic_version` row). Prevents
   "table already exists" errors on the first migration run.
3. **`alembic upgrade head`** — applies every migration in
   [`auth-service/alembic/versions/`](auth-service/alembic/versions/)
   that hasn't been applied yet. PostgreSQL DDL is transactional, so a
   mid-migration failure rolls back cleanly.
4. **`uvicorn app.main:app`** — starts the API. Its lifespan calls
   `seed_database()`, which:
   - Creates the bootstrap admin if no admin exists.
   - Inserts default `settings` rows that are missing.
   - **Inserts the full `DEFAULT_PRODUCTS` set from
     [`auth-service/app/seed_data.py`](auth-service/app/seed_data.py)
     only if the `products` table is currently empty.** Existing rows
     are never re-inserted — admin edits and deletes survive every
     restart.

The whole pipeline is **idempotent**. Running `deploy.sh` again with no
changes is a no-op past the `git pull` check.

## Running a deploy

On the server:

```bash
./deploy.sh
```

That's the whole interface. The script:

- Pulls `origin/main` (no-op if already at HEAD).
- Rebuilds both Docker images with `--pull` so base images refresh.
- Restarts containers — which triggers the migration + seed pipeline.
- Smokes `:8100/auth/api/health` and `:3005/ai-data/` before declaring
  success.
- Prunes dangling images so disk usage doesn't creep.

Logs are tagged `[deploy] / [ ok  ] / [warn ] / [fail ]` so they
skim well in CI output or `journalctl`.

## Wiring it to commit + push

Pick one of these — the script is the same in every case.

### Option A — GitHub Actions over SSH (recommended)

Add `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: SSH and run deploy.sh
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /path/to/AI-Data-Landing-Page
            ./deploy.sh
```

Set these secrets in your repo (`Settings → Secrets and variables → Actions`):

- `DEPLOY_HOST` — server hostname or IP
- `DEPLOY_USER` — SSH user
- `DEPLOY_SSH_KEY` — private key with permission to `git pull` and run docker

### Option B — Cron poll (no GitHub setup needed)

Add to root's crontab on the server:

```cron
*/2 * * * * cd /path/to/AI-Data-Landing-Page && ./deploy.sh >> /var/log/deploy.log 2>&1
```

The script's early-exit on `LOCAL = REMOTE` makes this cheap (one
`git fetch` every 2 minutes).

### Option C — Webhook receiver (most responsive)

Use [`webhook`](https://github.com/adnanh/webhook) on the server:

```yaml
# /etc/webhook/hooks.yaml
- id: ai-data-deploy
  execute-command: /path/to/AI-Data-Landing-Page/deploy.sh
  command-working-directory: /path/to/AI-Data-Landing-Page
  trigger-rule:
    match:
      type: payload-hmac-sha1
      secret: "<webhook secret matching GitHub>"
      parameter:
        source: header
        name: X-Hub-Signature
```

Point a GitHub webhook (`Settings → Webhooks → Add webhook`) at
`https://your-server/hooks/ai-data-deploy` with the same secret.

## Adding new application data later

There are two paths depending on who needs to see the new data:

### For fresh deploys only

Add a new entry to `DEFAULT_PRODUCTS` in
[`auth-service/app/seed_data.py`](auth-service/app/seed_data.py). It'll
land on any deploy where the `products` table is still empty — typically
brand-new environments.

**Existing deploys won't see it** because `seed_database()` only seeds
when the table is empty. This is intentional: it stops admin-deleted
products from being resurrected on every restart.

### For both fresh and existing deploys

Write a new Alembic migration that `INSERT`s the row(s). See
[`auth-service/alembic/versions/0005_backfill_product_content.py`](auth-service/alembic/versions/0005_backfill_product_content.py)
for a worked example — it backfills phases/deliverables/industries for
products that existed before those columns did.

Migrations are the right tool for any data that needs to land in
already-running databases. They run automatically on the next deploy.

## Manual escape hatches

```bash
# Show current DB version
docker compose -f auth-service/docker-compose.yml exec auth-service alembic current

# Show full migration chain
docker compose -f auth-service/docker-compose.yml exec auth-service alembic history

# Force-apply migrations without restarting the container
docker compose -f auth-service/docker-compose.yml exec auth-service alembic upgrade head

# Roll back the most recent migration
docker compose -f auth-service/docker-compose.yml exec auth-service alembic downgrade -1

# Compare the live DB schema with the SQLAlchemy model (should be silent)
docker compose -f auth-service/docker-compose.yml exec auth-service alembic check
```

## Wiping a stuck environment

Use only if you really want to lose data:

```bash
# Stop everything
docker compose -f auth-service/docker-compose.yml down -v   # -v wipes the postgres volume
docker compose down

# Bring it back up — migrations run from scratch, seed_database() repopulates
./deploy.sh
```
