#!/usr/bin/env bash
# Pull latest code, rebuild both services, and apply database migrations.
#
# Run this on the deployment server after every push to the main branch.
# Wire it to a webhook, GitHub Actions SSH step, or a simple cron loop —
# this script itself is purely local: it doesn't know how it was triggered.
#
# Pipeline (each stage is idempotent and safe to re-run):
#   1. git pull origin main
#   2. docker compose build  (auth-service + shared-db + frontend)
#   3. docker compose up -d  (recreates containers if their image changed)
#       - On auth-service start, docker-entrypoint.sh runs:
#           a. Waits for Postgres
#           b. alembic upgrade head  → applies any new migrations
#           c. uvicorn starts main:app → lifespan calls seed_database()
#              which inserts DEFAULT_PRODUCTS only when products is empty
#   4. Prune dangling images so disk usage doesn't grow forever
#
# Exit codes:
#   0   success
#   1   git pull, build, or up failed
#   2   smoke test (HTTP health check) failed after restart
set -euo pipefail

# All commands run from the repo root regardless of where the script
# was invoked from. ${BASH_SOURCE[0]} is the path to this script itself.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ANSI helpers — keeps the log skimmable when this runs unattended.
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
log()   { echo -e "${BLUE}[deploy]${NC} $*"; }
ok()    { echo -e "${GREEN}[ ok  ]${NC} $*"; }
warn()  { echo -e "${YELLOW}[warn ]${NC} $*"; }
fail()  { echo -e "${RED}[fail ]${NC} $*" >&2; exit 1; }

log "Starting deployment at $(date -u +'%Y-%m-%dT%H:%M:%SZ')"

# ── Step 1: pull latest code ────────────────────────────────────────────
log "Pulling latest from origin/main"
git fetch --quiet origin main
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)
if [ "$LOCAL" = "$REMOTE" ]; then
    log "Already at latest commit ($LOCAL) — nothing to do"
    exit 0
fi
git pull --ff-only origin main
ok "Now at $(git rev-parse --short HEAD): $(git log -1 --pretty=%s)"

# ── Step 2: rebuild images ──────────────────────────────────────────────
# Frontend uses the root docker-compose.yml (Vite build → nginx).
# Auth-service uses its own compose file (FastAPI + Postgres).
# `--pull` so base images (node, nginx, python, postgres) refresh too.
log "Rebuilding auth-service image"
docker compose -f auth-service/docker-compose.yml build --pull auth-service \
    || fail "auth-service build failed"
ok "auth-service image built"

log "Rebuilding frontend image"
docker compose build --pull app \
    || fail "frontend build failed"
ok "frontend image built"

# ── Step 3: restart containers ──────────────────────────────────────────
# `up -d` only recreates containers whose image actually changed. The
# auth-service entrypoint runs `alembic upgrade head` before the API
# starts, so any new migrations apply automatically on this step.
log "Restarting auth-service (migrations apply automatically)"
docker compose -f auth-service/docker-compose.yml up -d \
    || fail "auth-service restart failed"

log "Restarting frontend"
docker compose up -d \
    || fail "frontend restart failed"
ok "Containers up"

# ── Step 4: smoke tests ─────────────────────────────────────────────────
# Tight retry loop because the auth-service can take a few seconds to
# finish migrations + boot uvicorn after `up -d` returns. Fail loud if
# either service is still down after the timeout — the deploy didn't
# actually succeed in that case.
log "Waiting for auth-service to respond"
for i in {1..30}; do
    if curl -sf -o /dev/null -m 2 http://localhost:8100/auth/api/health; then
        ok "auth-service healthy"
        AUTH_OK=1
        break
    fi
    sleep 2
done
[ "${AUTH_OK:-0}" = "1" ] || { warn "auth-service did not come up in 60s"; exit 2; }

log "Waiting for frontend to respond"
for i in {1..15}; do
    if curl -sf -o /dev/null -m 2 http://localhost:3005/ai-data/; then
        ok "frontend healthy"
        FRONT_OK=1
        break
    fi
    sleep 2
done
[ "${FRONT_OK:-0}" = "1" ] || { warn "frontend did not come up in 30s"; exit 2; }

# ── Step 5: cleanup ─────────────────────────────────────────────────────
log "Pruning dangling images"
docker image prune -f --filter "dangling=true" >/dev/null || warn "image prune failed (continuing)"

# ── Done ────────────────────────────────────────────────────────────────
log "Current alembic version:"
docker compose -f auth-service/docker-compose.yml exec -T auth-service \
    alembic current 2>/dev/null | tail -n 1 || warn "could not read alembic version"

ok "Deployment complete at $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
