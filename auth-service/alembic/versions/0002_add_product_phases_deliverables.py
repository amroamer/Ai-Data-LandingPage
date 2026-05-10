"""add phases + deliverables JSONB to products and seed existing rows

Adds four nullable-defaulting JSONB columns to ``products``:

  * ``phases_en`` / ``phases_ar``    — list of {"name", "caption"} objects
  * ``deliverables_en`` / ``deliverables_ar`` — list of strings

These power the new "How it works" + "Key capabilities" sections in the
landing-page product modal. The four pre-existing seed products
(creative-content, data-owner, compliance, ea-arch) are populated with the
content previously held in the i18n JSON bundle so the modal keeps rendering
the same copy after the cutover.

Revision ID: 0002_add_product_phases_deliverables
Revises: 0001_initial_schema
Create Date: 2026-05-10
"""
import json
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
from sqlalchemy.sql import text

revision: str = "0002_phases_deliverables"
down_revision: Union[str, None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Seed data lifted verbatim from the previous i18n entries
# (en.json / ar.json → products.bySlug.*) so the visible content
# is unchanged after the cutover.
SEED = {
    "creative-content": {
        "phases_en": [
            {"name": "Brief", "caption": "Describe the deck or upload a short brief in plain language."},
            {"name": "Generate", "caption": "AI assembles slides from the curated KPMG template library."},
            {"name": "Review", "caption": "Edit, re-run, or swap sections until the deck reads exactly right."},
            {"name": "Export", "caption": "Download a fully branded, presentation-ready PowerPoint."},
        ],
        "phases_ar": [
            {"name": "موجز", "caption": "صف العرض المطلوب أو ارفع موجزًا قصيرًا بلغة بسيطة."},
            {"name": "توليد", "caption": "يقوم الذكاء الاصطناعي بتجميع الشرائح من مكتبة قوالب KPMG."},
            {"name": "مراجعة", "caption": "حرّر، أعد التشغيل، أو بدّل الأقسام حتى يصبح العرض مثاليًا."},
            {"name": "تصدير", "caption": "نزّل ملف PowerPoint جاهزًا للعرض ومتوافقًا مع الهوية."},
        ],
        "deliverables_en": [
            "AI-generated narrative tuned to the brief",
            "Curated KPMG template library",
            "Brand-compliant typography and layout",
            "Editable slides ready to refine",
        ],
        "deliverables_ar": [
            "محتوى ذكاء اصطناعي مُصمَّم وفق الموجز",
            "مكتبة قوالب KPMG المنسقة",
            "طباعة وتخطيط متوافقان مع الهوية",
            "شرائح قابلة للتحرير جاهزة للتنقيح",
        ],
    },
    "data-owner": {
        "phases_en": [
            {"name": "Discover", "caption": "Connect your data assets and let the agent profile them continuously."},
            {"name": "Classify", "caption": "Auto-suggested classifications, business definitions, and PII flags."},
            {"name": "Validate", "caption": "Owners review and approve in a single console — no spreadsheets."},
            {"name": "Govern", "caption": "Continuous monitoring of quality, lineage, and PII drift."},
        ],
        "phases_ar": [
            {"name": "اكتشاف", "caption": "اربط أصول البيانات ودع الوكيل يقوم بتوصيفها باستمرار."},
            {"name": "تصنيف", "caption": "اقتراحات تلقائية للتصنيف والتعريفات وإشارات المعلومات الحساسة."},
            {"name": "تحقق", "caption": "يراجع المالكون ويوافقون من خلال وحدة تحكم واحدة."},
            {"name": "حوكمة", "caption": "مراقبة مستمرة للجودة والمسارات وانحراف المعلومات الحساسة."},
        ],
        "deliverables_en": [
            "Continuous asset profiling across sources",
            "Auto-suggested classification and definitions",
            "PII detection across structured and semi-structured data",
            "Quality rules generated from observed patterns",
        ],
        "deliverables_ar": [
            "توصيف مستمر للأصول عبر المصادر",
            "اقتراحات تصنيف وتعريفات تلقائية",
            "اكتشاف المعلومات الحساسة عبر البيانات المنظمة وشبه المنظمة",
            "قواعد جودة مولّدة من الأنماط الملاحظة",
        ],
    },
    "compliance": {
        "phases_en": [
            {"name": "Encode", "caption": "Each regulation codified as a machine-readable ruleset, kept up to date."},
            {"name": "Scan", "caption": "Continuous checks against your live policies, controls, and data flows."},
            {"name": "Map", "caption": "Findings pre-mapped to NDMO, PDPL, SAMA, DGA, and SDAIA clauses."},
            {"name": "Remediate", "caption": "Audit-ready evidence trails and remediation guidance."},
        ],
        "phases_ar": [
            {"name": "ترميز", "caption": "كل لائحة مُقنّنة كقواعد قابلة للقراءة الآلية ومُحدَّثة باستمرار."},
            {"name": "مسح", "caption": "فحص مستمر لسياساتك وضوابطك وتدفقات البيانات الحية."},
            {"name": "ربط", "caption": "النتائج مرتبطة مسبقًا ببنود NDMO وPDPL وSAMA وDGA وSDAIA."},
            {"name": "معالجة", "caption": "مسارات أدلة جاهزة للتدقيق وإرشادات معالجة."},
        ],
        "deliverables_en": [
            "Multi-framework ruleset (NDMO, PDPL, SAMA, DGA, SDAIA)",
            "Continuous compliance scanning",
            "Pre-mapped regulatory findings",
            "Audit-ready evidence trails",
        ],
        "deliverables_ar": [
            "قواعد متعددة الأطر (NDMO، PDPL، SAMA، DGA، SDAIA)",
            "فحص امتثال مستمر",
            "نتائج مرتبطة بالأطر التنظيمية",
            "مسارات أدلة جاهزة للتدقيق",
        ],
    },
    "ea-arch": {
        "phases_en": [
            {"name": "Ingest", "caption": "Pulls your existing architecture inventory and capability map."},
            {"name": "Generate", "caption": "Drafts target-state blueprints, capability mappings, and ADRs."},
            {"name": "Review", "caption": "Architects refine and sign off in minutes, not weeks."},
            {"name": "Refresh", "caption": "Re-runs on schedule and flags drift between artefacts and reality."},
        ],
        "phases_ar": [
            {"name": "استيعاب", "caption": "يسحب جرد البنية الحالية وخريطة القدرات."},
            {"name": "توليد", "caption": "يصوغ مخططات الحالة المستهدفة وخرائط القدرات وقرارات التصميم."},
            {"name": "مراجعة", "caption": "يُنقّح المعماريون ويعتمدون خلال دقائق لا أسابيع."},
            {"name": "تحديث", "caption": "يعمل على جدول زمني، ويكتشف الانحراف بين الوثائق والواقع."},
        ],
        "deliverables_en": [
            "Target-state architecture blueprints",
            "Capability-to-system mapping",
            "Architecture Decision Records (ADRs)",
            "Drift detection on a recurring schedule",
        ],
        "deliverables_ar": [
            "مخططات بنية الحالة المستهدفة",
            "خرائط القدرات إلى الأنظمة",
            "سجلات قرارات التصميم (ADRs)",
            "اكتشاف الانحراف على جدول زمني متكرر",
        ],
    },
}


def upgrade() -> None:
    # Add the four new JSONB columns. Default to empty arrays so any existing
    # rows (and any rows that get inserted before the seed runs) are valid.
    for col in ("phases_en", "phases_ar", "deliverables_en", "deliverables_ar"):
        op.add_column(
            "products",
            sa.Column(
                col,
                postgresql.JSONB(astext_type=sa.Text()),
                nullable=False,
                server_default=sa.text("'[]'::jsonb"),
            ),
        )

    # Seed the four pre-existing products with the content previously held
    # in i18n. Other rows (admin-created since) keep their empty defaults.
    conn = op.get_bind()
    for slug, content in SEED.items():
        conn.execute(
            text(
                """
                UPDATE products
                SET phases_en       = CAST(:phases_en AS jsonb),
                    phases_ar       = CAST(:phases_ar AS jsonb),
                    deliverables_en = CAST(:deliverables_en AS jsonb),
                    deliverables_ar = CAST(:deliverables_ar AS jsonb)
                WHERE slug = :slug
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


def downgrade() -> None:
    op.drop_column("products", "deliverables_ar")
    op.drop_column("products", "deliverables_en")
    op.drop_column("products", "phases_ar")
    op.drop_column("products", "phases_en")
