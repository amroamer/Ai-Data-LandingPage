"""snapshot every product (including attachments) so server matches local

UPSERTs every row in the accompanying ``0007_products_snapshot.json`` file
into the ``products`` table. The snapshot was dumped from the dev DB at
authoring time and includes the full content set per product:

  * Identity:        slug, icon_name, url, sort_order, is_visible
  * Bilingual copy:  title / description / problem / solution (en + ar)
  * Modal content:   phases / deliverables (en + ar)
  * Attachments:     screenshots (base64 data URIs), ppt_filename, ppt_data
  * Filtering:       industries

ON CONFLICT (slug) DO UPDATE refreshes every non-key field, so this
migration is the canonical "make production look like the snapshot"
operation. Once applied (Alembic only runs it once), subsequent admin
edits on the server persist. To re-sync later, dump a new snapshot and
write a fresh migration with a new revision id — never edit this file
after it's been deployed.

Two operational notes:

  * The JSON file lives next to this script (``__file__`` parent) and
    is COPYed into the auth-service Docker image by the existing
    ``COPY . .`` step in auth-service/Dockerfile. No build changes
    needed.
  * Each row carries up to ~2MB of base64 screenshot data; UPSERTing 6
    rows takes a couple of seconds. Well within PostgreSQL query
    size limits.

Revision ID: 0007_products_snapshot
Revises: 0006_add_invoice_agent_product
Create Date: 2026-05-11
"""
import json
import pathlib
from typing import Sequence, Union

from alembic import op
from sqlalchemy.sql import text

revision: str = "0007_products_snapshot"
down_revision: Union[str, None] = "0006_add_invoice_agent_product"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Companion JSON file with the full product snapshot. Sits in the same
# directory as this script so it travels with the migration through any
# packaging step that respects the alembic/versions/ folder structure.
DATA_FILE = pathlib.Path(__file__).parent / "0007_products_snapshot.json"


# UPSERT statement reused for every row. Pulled out of the loop so the
# psycopg2 prepare cache can reuse it across all six executions.
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
        # JSONB columns must arrive as serialised strings then cast back
        # to jsonb on the server side — psycopg2 can't infer the cast
        # from a Python list/dict in a parameterised statement.
        conn.execute(
            _UPSERT_SQL,
            {
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
            },
        )


def downgrade() -> None:
    # Snapshot migrations have no meaningful inverse — we can't restore
    # the pre-snapshot state without remembering what was there. To roll
    # back a specific row, write a fresh migration with a new revision id.
    pass
