"""insert Proposal Agent product into existing databases

Sister to migration 0006 (Invoice Agent). seed_data.py handles the row
for fresh deploys; this migration handles existing databases where the
products table is no longer empty and seed_database() therefore skips
its own seed.

Idempotency:
  - Fresh DB: the row inserts here, then seed_database() runs against
    a non-empty table and correctly skips. No duplicate.
  - Existing DB without proposal-agent: the row inserts.
  - Existing DB where an admin already created a `proposal-agent` row
    via the UI: ON CONFLICT (slug) DO NOTHING silently keeps the
    admin's version.

The dev DB's products table was originally created via
Base.metadata.create_all (pre-Alembic bootstrap), so its created_at /
updated_at columns lack the server-side NOW() default. We populate them
explicitly here so the INSERT doesn't hit a NOT NULL violation on that
environment.

Revision ID: 0008_add_proposal_agent_product
Revises: 0007_products_snapshot
Create Date: 2026-05-11
"""
import json
from typing import Sequence, Union

from alembic import op
from sqlalchemy.sql import text

revision: str = "0008_add_proposal_agent_product"
down_revision: Union[str, None] = "0007_products_snapshot"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Frozen snapshot of the row at this revision. Kept inline (rather than
# imported from app.seed_data) so the migration stays self-contained
# and survives later edits to the canonical seed file.
PROPOSAL_AGENT = {
    "slug": "proposal-agent",
    "icon_name": "FileText",
    "url": "https://digital-foundation.uksouth.cloudapp.azure.com/ProposalAgent/",
    "sort_order": 80,
    "is_visible": True,
    "title_en": "Proposal Agent",
    "title_ar": "وكيل المقترحات",
    "description_en": "AI-powered proposal builder that turns RFP documents and client briefs into polished, structured proposals — ready for review and submission.",
    "description_ar": "أداة بناء مقترحات مدعومة بالذكاء الاصطناعي تحول وثائق طلب العروض وموجزات العملاء إلى مقترحات منظمة جاهزة للمراجعة والتقديم.",
    "problem_en": "Proposal teams spend days assembling each response — extracting requirements from RFPs, hunting through past wins for relevant case studies, tailoring narrative to the client's voice, and reformatting every section to the brand template. Tight deadlines mean cut corners, missed requirements, and inconsistent quality across submissions.",
    "problem_ar": "تقضي فرق المقترحات أيامًا في إعداد كل رد — استخراج المتطلبات من طلبات العروض، والبحث في الفوزات السابقة عن دراسات حالة ذات صلة، وتكييف السرد لصوت العميل، وإعادة تنسيق كل قسم وفق قالب العلامة. تعني المواعيد الضيقة اختصارات وفواتًا للمتطلبات وجودة غير متسقة بين التسليمات.",
    "solution_en": "Proposal Agent ingests the RFP, extracts every requirement into a traceability matrix, and drafts a structured response section by section — pulling relevant case studies from your past wins automatically and enforcing your firm's tone and brand template. Subject-matter experts refine the draft in a single console; the finished document exports in submission-ready form with audit trail.",
    "solution_ar": "يستوعب وكيل المقترحات طلب العرض، ويستخرج كل متطلب إلى مصفوفة تتبع، ويصوغ ردًا منظمًا قسمًا بقسم — ويسحب دراسات الحالة ذات الصلة من فوزاتك السابقة تلقائيًا ويفرض نبرة شركتك وقالب علامتها التجارية. يُحرّر خبراء الموضوع المسودة في وحدة تحكم واحدة، وتُصدَّر الوثيقة النهائية في صيغة جاهزة للتسليم مع سجل تدقيق.",
    "screenshots": [],
    "phases_en": [
        {"name": "Intake", "caption": "Upload the RFP or paste the brief; the agent extracts requirements and structure."},
        {"name": "Draft", "caption": "AI assembles a section-by-section response from past wins and curated playbooks."},
        {"name": "Refine", "caption": "Subject experts edit, re-run, or swap sections until the response reads right."},
        {"name": "Export", "caption": "Export a polished, brand-compliant document ready for review and submission."},
    ],
    "phases_ar": [
        {"name": "استلام", "caption": "ارفع طلب العرض أو ألصق الموجز؛ يستخرج الوكيل المتطلبات والهيكل."},
        {"name": "صياغة", "caption": "يصوغ الذكاء الاصطناعي ردًا قسمًا بقسم من العروض الفائزة ومحتوى مُنسَّق."},
        {"name": "تنقيح", "caption": "يُحرّر خبراء الموضوع ويُعيدون التشغيل حتى يصبح الرد ملائمًا."},
        {"name": "تصدير", "caption": "صدّر وثيقة جاهزة للمراجعة والتسليم متوافقة مع الهوية."},
    ],
    "deliverables_en": [
        "RFP requirement extraction and traceability matrix",
        "Section-by-section drafts wired to past wins and case studies",
        "Brand-compliant document export",
        "Auditable review and approval workflow",
    ],
    "deliverables_ar": [
        "استخراج متطلبات طلب العرض ومصفوفة تتبع",
        "مسودات قسم بقسم مرتبطة بالعروض الفائزة ودراسات الحالة",
        "تصدير وثيقة متوافقة مع الهوية",
        "سير عمل مراجعة وموافقة قابل للتدقيق",
    ],
    "industries": ["public-sector", "financial-services", "energy-resources"],
}


def upgrade() -> None:
    p = PROPOSAL_AGENT
    op.get_bind().execute(
        text(
            """
            INSERT INTO products (
                id, slug, icon_name, url, sort_order, is_visible,
                screenshots, title_en, title_ar,
                description_en, description_ar,
                problem_en, problem_ar, solution_en, solution_ar,
                phases_en, phases_ar,
                deliverables_en, deliverables_ar,
                industries,
                created_at, updated_at
            )
            VALUES (
                gen_random_uuid(), :slug, :icon_name, :url, :sort_order, :is_visible,
                CAST(:screenshots AS jsonb), :title_en, :title_ar,
                :description_en, :description_ar,
                :problem_en, :problem_ar, :solution_en, :solution_ar,
                CAST(:phases_en AS jsonb), CAST(:phases_ar AS jsonb),
                CAST(:deliverables_en AS jsonb), CAST(:deliverables_ar AS jsonb),
                CAST(:industries AS jsonb),
                NOW(), NOW()
            )
            ON CONFLICT (slug) DO NOTHING
            """
        ),
        {
            "slug": p["slug"],
            "icon_name": p["icon_name"],
            "url": p["url"],
            "sort_order": p["sort_order"],
            "is_visible": p["is_visible"],
            "screenshots": json.dumps(p["screenshots"]),
            "title_en": p["title_en"],
            "title_ar": p["title_ar"],
            "description_en": p["description_en"],
            "description_ar": p["description_ar"],
            "problem_en": p["problem_en"],
            "problem_ar": p["problem_ar"],
            "solution_en": p["solution_en"],
            "solution_ar": p["solution_ar"],
            "phases_en": json.dumps(p["phases_en"]),
            "phases_ar": json.dumps(p["phases_ar"]),
            "deliverables_en": json.dumps(p["deliverables_en"]),
            "deliverables_ar": json.dumps(p["deliverables_ar"]),
            "industries": json.dumps(p["industries"]),
        },
    )


def downgrade() -> None:
    # Only deletes the row we inserted — an admin-created product with
    # the same slug (which our INSERT skipped) is not touched here either.
    op.get_bind().execute(
        text("DELETE FROM products WHERE slug = :slug"),
        {"slug": PROPOSAL_AGENT["slug"]},
    )
