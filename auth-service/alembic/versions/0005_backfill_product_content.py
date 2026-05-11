"""backfill phases/deliverables for sahab+khda, industries for all seed products

Migration 0002 only seeded the four originally-shipped products
(creative-content, data-owner, compliance, ea-arch) with phases and
deliverables. The two products added afterwards (sahab, khda) and the
industries column added by 0004 still need a one-time backfill on any
deployment that already has those rows.

This migration UPDATEs by slug, so:
  - Fresh deploys: products table is empty when this runs, so every
    UPDATE is a no-op. The first-startup seed in app/seed_data.py then
    inserts complete rows with all the new fields.
  - Existing deploys: pre-existing rows for the six known slugs are
    enriched in place. Admin-customised content (e.g. someone already
    filled in phases via the UI) is overwritten by this script, which
    is the right tradeoff for "I want the canonical seed everywhere".

Adding a new product later: prefer extending app/seed_data.py for fresh
deploys and writing a fresh migration here for existing deploys.

Revision ID: 0005_backfill_product_content
Revises: 0004_add_product_industries
Create Date: 2026-05-11
"""
import json
from typing import Sequence, Union

from alembic import op
from sqlalchemy.sql import text

revision: str = "0005_backfill_product_content"
down_revision: Union[str, None] = "0004_add_product_industries"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Industry slugs match `src/data/industries.js` on the frontend and the
# `_ALL_INDUSTRIES` constant in `app/seed_data.py`. Kept inline rather
# than imported so this migration is a self-contained snapshot.
ALL_INDUSTRIES = ["public-sector", "financial-services", "energy-resources"]


# Phases + deliverables for the two slugs migration 0002 didn't cover.
# Content matches `app/seed_data.py` at this revision; if you change
# seed_data later, write a new migration rather than editing this one.
EXTRA_PHASE_SEED = {
    "sahab": {
        "phases_en": [
            {"name": "Connect", "caption": "Plug into your enterprise data sources with out-of-the-box connectors."},
            {"name": "Govern", "caption": "Apply policies, lineage, and access controls across every dataset."},
            {"name": "Catalog", "caption": "Auto-catalogue assets with business definitions and quality scores."},
            {"name": "Serve", "caption": "Expose curated, query-ready data through a single discovery layer."},
        ],
        "phases_ar": [
            {"name": "اتصال", "caption": "اتصل بمصادر بيانات المؤسسة بموصلات جاهزة."},
            {"name": "حوكمة", "caption": "طبّق السياسات والمسارات وضوابط الوصول على كل مجموعة بيانات."},
            {"name": "فهرسة", "caption": "فهرسة الأصول تلقائيًا مع التعريفات التجارية ومقاييس الجودة."},
            {"name": "تقديم", "caption": "اعرض البيانات المنسقة الجاهزة للاستعلام عبر طبقة اكتشاف موحدة."},
        ],
        "deliverables_en": [
            "Unified ingestion across enterprise sources",
            "Automated lineage and policy enforcement",
            "Central data catalogue with business glossary",
            "Single discovery and access layer for analysts",
        ],
        "deliverables_ar": [
            "استيعاب موحّد عبر مصادر المؤسسة",
            "تطبيق المسارات والسياسات تلقائيًا",
            "فهرس بيانات مركزي مع قاموس الأعمال",
            "طبقة اكتشاف ووصول واحدة للمحللين",
        ],
    },
    "khda": {
        "phases_en": [
            {"name": "Ingest", "caption": "Standardize submissions from schools, training providers, and licensing systems."},
            {"name": "Govern", "caption": "Apply KHDA-specific quality and compliance rules at the source."},
            {"name": "Compute", "caption": "Recompute education indicators automatically on every refresh."},
            {"name": "Publish", "caption": "Expose policy-ready dashboards with full source-to-screen lineage."},
        ],
        "phases_ar": [
            {"name": "استيعاب", "caption": "توحيد التقارير من المدارس ومزودي التدريب وأنظمة الترخيص."},
            {"name": "حوكمة", "caption": "تطبيق قواعد الجودة والامتثال الخاصة بهيئة المعرفة عند المصدر."},
            {"name": "حساب", "caption": "إعادة حساب مؤشرات التعليم تلقائيًا مع كل تحديث."},
            {"name": "نشر", "caption": "لوحات معلومات جاهزة للسياسات مع تتبع كامل من المصدر إلى الشاشة."},
        ],
        "deliverables_en": [
            "Standardized ingestion across reporting entities",
            "KHDA-specific governance and quality rules",
            "Auto-recomputed sector indicators",
            "End-to-end lineage from source to dashboard",
        ],
        "deliverables_ar": [
            "استيعاب موحّد عبر الكيانات المُبلِّغة",
            "قواعد حوكمة وجودة خاصة بهيئة المعرفة",
            "مؤشرات قطاعية محسوبة تلقائيًا",
            "تتبع شامل من المصدر إلى لوحة المعلومات",
        ],
    },
}


# Industry assignments per slug. compliance is the only one that doesn't
# cover energy-resources — its NDMO / PDPL / SAMA / DGA / SDAIA rulesets
# are public-sector + financial-services in scope. khda is education-
# sector (public-sector). Everything else is broadly cross-industry.
INDUSTRY_SEED = {
    "creative-content": ALL_INDUSTRIES,
    "sahab": ALL_INDUSTRIES,
    "data-owner": ALL_INDUSTRIES,
    "compliance": ["public-sector", "financial-services"],
    "ea-arch": ALL_INDUSTRIES,
    "khda": ["public-sector"],
}


def upgrade() -> None:
    conn = op.get_bind()

    # Phases / deliverables for the two slugs 0002 missed. Only fills in
    # rows where the field is still the empty array — never overwrites
    # whatever an admin has typed in through the UI.
    for slug, content in EXTRA_PHASE_SEED.items():
        conn.execute(
            text(
                """
                UPDATE products
                SET phases_en       = CAST(:phases_en AS jsonb),
                    phases_ar       = CAST(:phases_ar AS jsonb),
                    deliverables_en = CAST(:deliverables_en AS jsonb),
                    deliverables_ar = CAST(:deliverables_ar AS jsonb)
                WHERE slug = :slug
                  AND phases_en = '[]'::jsonb
                  AND deliverables_en = '[]'::jsonb
                """
            ),
            {
                "slug": slug,
                "phases_en": json.dumps(content["phases_en"]),
                "phases_ar": json.dumps(content["phases_ar"]),
                "deliverables_en": json.dumps(content["deliverables_en"]),
                "deliverables_ar": json.dumps(content["deliverables_ar"]),
            },
        )

    # Industries for every known seed slug. Only overwrites untagged rows
    # so admins who already curated their own tags keep them.
    for slug, industries in INDUSTRY_SEED.items():
        conn.execute(
            text(
                """
                UPDATE products
                SET industries = CAST(:industries AS jsonb)
                WHERE slug = :slug
                  AND industries = '[]'::jsonb
                """
            ),
            {"slug": slug, "industries": json.dumps(industries)},
        )


def downgrade() -> None:
    # Best-effort revert: clears phases / deliverables / industries for
    # the slugs we touched. Won't restore other content that pre-existed
    # but is mostly here for symmetry with `upgrade`.
    conn = op.get_bind()
    for slug in list(EXTRA_PHASE_SEED) + list(INDUSTRY_SEED):
        conn.execute(
            text(
                """
                UPDATE products
                SET phases_en       = '[]'::jsonb,
                    phases_ar       = '[]'::jsonb,
                    deliverables_en = '[]'::jsonb,
                    deliverables_ar = '[]'::jsonb,
                    industries      = '[]'::jsonb
                WHERE slug = :slug
                """
            ),
            {"slug": slug},
        )
