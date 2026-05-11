#!/usr/bin/env python3
"""Dump the current products table into a fresh Alembic migration.

Run this whenever you want production to mirror your local DB:

    python scripts/snapshot_products.py

What it does, in order:

  1. Walks ``auth-service/alembic/versions/`` to find the highest
     existing migration number, computes the next one (e.g. 0007 ->
     0008), and reads the latest migration's revision id so the new
     migration's ``down_revision`` chains correctly.

  2. Exec's into the running ``shared-db`` container, runs the same
     ``json_agg(row_to_json(p))`` query used by migration 0007, and
     writes the result to ``0NNN_products_snapshot.json`` next to the
     migration it generates.

  3. Generates ``0NNN_products_snapshot.py`` from a template — same
     UPSERT shape as 0007, just with new revision ids.

  4. Prints the exact git + deploy commands to commit and ship the
     snapshot.

Prerequisites:
  - The auth-service docker-compose stack must be running, since the
    script dumps from the live ``shared-db`` container.
  - This script must live in ``scripts/`` next to the repo root.
  - The ``docker compose`` plugin must be on PATH (the modern form,
    not legacy ``docker-compose``).

Known limitations:
  - The dump's column list is hard-coded. Adding a new column to
    ``Product`` means this script and the embedded template must be
    updated together — see the SELECT statement and the upgrade()
    body in the template below.
  - The migration UPSERTs by ``slug``, so rows in the live DB whose
    slugs don't appear in the snapshot are *left in place* (not
    deleted). This is by design — admins on the server may have added
    products that don't exist locally, and we don't want a snapshot
    sync to silently nuke them. Deleting is an explicit DELETE in a
    follow-up migration if you really want it.
"""
import datetime
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSIONS_DIR = ROOT / "auth-service" / "alembic" / "versions"
COMPOSE_FILE = ROOT / "auth-service" / "docker-compose.yml"


# Column list — must match the Product model exactly. Update this and
# MIGRATION_TEMPLATE together whenever the model gains a new column.
DUMP_QUERY = (
    "SELECT json_agg(row_to_json(p) ORDER BY p.sort_order) FROM ("
    "SELECT slug, icon_name, url, video_url, screenshots, is_visible, "
    "sort_order, title_en, title_ar, description_en, description_ar, "
    "problem_en, problem_ar, solution_en, solution_ar, phases_en, "
    "phases_ar, deliverables_en, deliverables_ar, ppt_filename, "
    "ppt_data, industries FROM products) p"
)


def find_next_number_and_previous_revision() -> tuple[int, str]:
    """Discover the next migration number and the head revision id.

    Returns (NNN, previous_revision_str). Raises if the migrations
    directory is empty or the latest migration's revision line can't
    be parsed.
    """
    files = sorted(VERSIONS_DIR.glob("[0-9][0-9][0-9][0-9]_*.py"))
    if not files:
        raise RuntimeError("No existing migrations found — can't extend the chain")

    last = files[-1]
    number_match = re.match(r"^(\d{4})_", last.name)
    if not number_match:
        raise RuntimeError(f"Couldn't parse migration number from {last.name}")
    next_number = int(number_match.group(1)) + 1

    text = last.read_text(encoding="utf-8")
    rev_match = re.search(r'revision:\s*str\s*=\s*"([^"]+)"', text)
    if not rev_match:
        raise RuntimeError(f"Couldn't find revision id in {last.name}")
    return next_number, rev_match.group(1)


def dump_products(out_path: Path) -> int:
    """Dump the products table to ``out_path`` as a JSON array.

    Uses ``docker compose exec -T shared-db psql -t -A`` so the result
    is the raw JSON string without psql's table-formatting chrome.
    Returns the byte count of the written file.
    """
    cmd = [
        "docker", "compose", "-f", str(COMPOSE_FILE),
        "exec", "-T", "shared-db",
        "psql", "-U", "auth_user", "-d", "auth_db",
        "-t", "-A", "-c", DUMP_QUERY,
    ]
    result = subprocess.run(cmd, capture_output=True, check=True)
    payload = result.stdout

    # Validate that the dump is a non-empty JSON array. psql will emit
    # an empty line if the table happens to be empty, which would let
    # us write a meaningless migration.
    parsed = json.loads(payload)
    if not isinstance(parsed, list) or not parsed:
        raise RuntimeError(
            "Dump returned no products — is the shared-db container running, "
            "and does the products table have rows?"
        )
    out_path.write_bytes(payload)
    return len(payload)


# Migration template. Mirrors 0007_products_snapshot.py exactly except for
# the four substituted placeholders. Curly braces inside the upgrade()
# body are doubled so str.format() leaves them as literal Python.
MIGRATION_TEMPLATE = '''\
"""snapshot every product (including attachments) so server matches local

Generated by scripts/snapshot_products.py. UPSERTs the accompanying
``{json_basename}`` file into the products table — see migration 0007
for the rationale and operational notes.

Revision ID: {revision}
Revises: {down_revision}
Create Date: {iso_date}
"""
import json
import pathlib
from typing import Sequence, Union

from alembic import op
from sqlalchemy.sql import text

revision: str = "{revision}"
down_revision: Union[str, None] = "{down_revision}"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


DATA_FILE = pathlib.Path(__file__).parent / "{json_basename}"


_UPSERT_SQL = text(
    """
    INSERT INTO products (
        id, slug, icon_name, url, video_url, screenshots,
        is_visible, sort_order,
        title_en, title_ar,
        description_en, description_ar,
        problem_en, problem_ar,
        solution_en, solution_ar,
        phases_en, phases_ar,
        deliverables_en, deliverables_ar,
        ppt_filename, ppt_data, industries,
        created_at, updated_at
    )
    VALUES (
        gen_random_uuid(), :slug, :icon_name, :url, :video_url,
        CAST(:screenshots AS jsonb),
        :is_visible, :sort_order,
        :title_en, :title_ar,
        :description_en, :description_ar,
        :problem_en, :problem_ar,
        :solution_en, :solution_ar,
        CAST(:phases_en AS jsonb), CAST(:phases_ar AS jsonb),
        CAST(:deliverables_en AS jsonb), CAST(:deliverables_ar AS jsonb),
        :ppt_filename, :ppt_data, CAST(:industries AS jsonb),
        NOW(), NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET
        icon_name       = EXCLUDED.icon_name,
        url             = EXCLUDED.url,
        video_url       = EXCLUDED.video_url,
        screenshots     = EXCLUDED.screenshots,
        is_visible      = EXCLUDED.is_visible,
        sort_order      = EXCLUDED.sort_order,
        title_en        = EXCLUDED.title_en,
        title_ar        = EXCLUDED.title_ar,
        description_en  = EXCLUDED.description_en,
        description_ar  = EXCLUDED.description_ar,
        problem_en      = EXCLUDED.problem_en,
        problem_ar      = EXCLUDED.problem_ar,
        solution_en     = EXCLUDED.solution_en,
        solution_ar     = EXCLUDED.solution_ar,
        phases_en       = EXCLUDED.phases_en,
        phases_ar       = EXCLUDED.phases_ar,
        deliverables_en = EXCLUDED.deliverables_en,
        deliverables_ar = EXCLUDED.deliverables_ar,
        ppt_filename    = EXCLUDED.ppt_filename,
        ppt_data        = EXCLUDED.ppt_data,
        industries      = EXCLUDED.industries,
        updated_at      = NOW()
    """
)


def upgrade() -> None:
    with open(DATA_FILE, encoding="utf-8") as f:
        products = json.load(f)

    conn = op.get_bind()
    for p in products:
        conn.execute(
            _UPSERT_SQL,
            {{
                "slug":            p["slug"],
                "icon_name":       p["icon_name"],
                "url":             p["url"],
                "video_url":       p["video_url"],
                "screenshots":     json.dumps(p["screenshots"]),
                "is_visible":      p["is_visible"],
                "sort_order":      p["sort_order"],
                "title_en":        p["title_en"],
                "title_ar":        p["title_ar"],
                "description_en":  p["description_en"],
                "description_ar":  p["description_ar"],
                "problem_en":      p["problem_en"],
                "problem_ar":      p["problem_ar"],
                "solution_en":     p["solution_en"],
                "solution_ar":     p["solution_ar"],
                "phases_en":       json.dumps(p["phases_en"]),
                "phases_ar":       json.dumps(p["phases_ar"]),
                "deliverables_en": json.dumps(p["deliverables_en"]),
                "deliverables_ar": json.dumps(p["deliverables_ar"]),
                "ppt_filename":    p["ppt_filename"],
                "ppt_data":        p["ppt_data"],
                "industries":      json.dumps(p["industries"]),
            }},
        )


def downgrade() -> None:
    pass
'''


def main() -> int:
    next_number, prev_revision = find_next_number_and_previous_revision()
    revision_id = f"{next_number:04d}_products_snapshot"
    json_basename = f"{next_number:04d}_products_snapshot.json"
    py_basename = f"{next_number:04d}_products_snapshot.py"
    json_path = VERSIONS_DIR / json_basename
    py_path = VERSIONS_DIR / py_basename

    if json_path.exists() or py_path.exists():
        print(
            f"[abort] {json_basename} or {py_basename} already exists. "
            f"Delete the existing file(s) first if you want to regenerate."
        )
        return 1

    # Plain ASCII output so the script doesn't blow up on Windows cp1252
    # consoles where Unicode arrows / ellipses aren't in the codec.
    print(f"[1/2] Dumping products to {json_path.name}...")
    try:
        size = dump_products(json_path)
    except subprocess.CalledProcessError as exc:
        sys.stderr.write(
            f"[fail] docker compose exec failed (exit {exc.returncode}):\n"
            f"  stderr: {exc.stderr.decode('utf-8', 'replace').strip()}\n"
            f"Is the auth-service stack up? Try: "
            f"docker compose -f {COMPOSE_FILE.relative_to(ROOT)} up -d\n"
        )
        return 2
    print(f"      -> {size:,} bytes")

    print(f"[2/2] Writing {py_path.name}...")
    py_path.write_text(
        MIGRATION_TEMPLATE.format(
            revision=revision_id,
            down_revision=prev_revision,
            iso_date=datetime.date.today().isoformat(),
            json_basename=json_basename,
        ),
        encoding="utf-8",
    )
    print(f"      -> chained on revision {prev_revision}")

    rel_json = json_path.relative_to(ROOT).as_posix()
    rel_py = py_path.relative_to(ROOT).as_posix()
    print()
    print(f"[ok] Snapshot {revision_id} ready.")
    print(f"Review the new files, then:")
    print(f"  git add {rel_json} {rel_py}")
    print(f'  git commit -m "Snapshot products ({revision_id})"')
    print(f"  git push")
    print(f"  # then on the server:")
    print(f"  ./deploy.sh")
    return 0


if __name__ == "__main__":
    sys.exit(main())
