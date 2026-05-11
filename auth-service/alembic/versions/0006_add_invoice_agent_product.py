"""insert Invoice Agent product into existing databases

`DEFAULT_PRODUCTS` in `app/seed_data.py` handles fresh deploys (the
seed function inserts everything when the products table is empty).
Existing deployments already have rows, so seed_database is a no-op and
the new product never lands without an explicit migration — this one.

Uses `INSERT ... ON CONFLICT (slug) DO NOTHING` so:
  - On a brand-new DB this migration runs *before* seed_database, the
    products table is empty, and the INSERT inserts. Then
    seed_database runs, sees the table is no longer empty, and
    correctly skips its own seed. (No duplicates.)
  - On an existing DB without invoice-agent, the row is inserted.
  - On an existing DB that already has invoice-agent (admin created
    it via the UI), the conflict on `slug` is silently ignored —
    admin's version wins.

Revision ID: 0006_add_invoice_agent_product
Revises: 0005_backfill_product_content
Create Date: 2026-05-11
"""
import json
from typing import Sequence, Union

from alembic import op
from sqlalchemy.sql import text

revision: str = "0006_add_invoice_agent_product"
down_revision: Union[str, None] = "0005_backfill_product_content"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Frozen snapshot of the seed row at this revision. Kept inline (rather
# than imported from app.seed_data) so the migration is self-contained
# and survives later edits to the canonical seed file.
INVOICE_AGENT = {
    "slug": "invoice-agent",
    "icon_name": "Receipt",
    "url": "https://digital-foundation.uksouth.cloudapp.azure.com/InvoiceAgent",
    "sort_order": 70,
    "is_visible": True,
    "title_en": "Invoice Agent",
    "title_ar": "وكيل الفواتير",
    "description_en": "AI-powered invoice processing that ingests, extracts, validates, and routes supplier invoices end-to-end — from any channel to your ERP.",
    "description_ar": "وكيل ذكاء اصطناعي لمعالجة الفواتير يستوعب ويستخرج ويتحقق ويوجّه فواتير الموردين من البداية إلى النهاية — من أي قناة إلى نظام تخطيط موارد المؤسسة لديك.",
    "problem_en": "Accounts payable teams process thousands of invoices each month across dozens of formats — PDFs, scanned images, EDI feeds, email attachments — each requiring manual extraction, validation against POs and contracts, and routing to the right approver. The result is multi-day cycle times, missed early-pay discounts, frequent matching errors, and a brittle audit trail that struggles under regulator review.",
    "problem_ar": "تعالج فرق الحسابات الدائنة آلاف الفواتير شهريًا بصيغ مختلفة — PDF وصور ممسوحة وموجزات EDI ومرفقات بريد إلكتروني — كل منها يتطلب استخراجًا يدويًا ومطابقة مع أوامر الشراء والعقود وتوجيهًا إلى المُعتمِد المناسب. والنتيجة دورة معالجة تستغرق أيامًا وخصومات السداد المبكر مفقودة وأخطاء مطابقة متكررة وسجل تدقيق هش يصعب على المراجعين.",
    "solution_en": "Invoice Agent ingests invoices from every channel — email, scanned uploads, EDI feeds — into a single processing queue. Domain-trained AI extracts line items, totals, tax codes, and supplier metadata, then runs three-way matches against purchase orders and master contracts. Exceptions get routed to the right approver automatically; cleanly matched invoices post to your ERP in real time, every step captured in a tamper-evident audit log.",
    "solution_ar": "يستوعب وكيل الفواتير الفواتير من كل قناة — البريد الإلكتروني والمسح الضوئي وموجزات EDI — في قائمة معالجة موحدة. يستخرج الذكاء الاصطناعي المُدرَّب على المجال البنود والإجماليات والأكواد الضريبية وبيانات المورد، ثم يُجري مطابقات ثلاثية مقابل أوامر الشراء والعقود الرئيسية. تُوجَّه الاستثناءات تلقائيًا إلى المُعتمِد المناسب، وتُرحَّل الفواتير المُطابَقة بنظافة إلى نظام ERP فورًا، وكل خطوة مُسجَّلة في سجل تدقيق غير قابل للتلاعب.",
    "screenshots": [],
    "phases_en": [
        {"name": "Ingest", "caption": "Pulls invoices from email, scan drops, and EDI feeds into a single queue."},
        {"name": "Extract", "caption": "Domain-trained AI extracts line items, totals, tax codes, and supplier metadata."},
        {"name": "Validate", "caption": "Three-way matches against POs and contracts; flags exceptions for review."},
        {"name": "Post", "caption": "Routes approvals automatically and posts cleared invoices to your ERP in real time."},
    ],
    "phases_ar": [
        {"name": "استيعاب", "caption": "يسحب الفواتير من البريد الإلكتروني والملفات الممسوحة وموجزات EDI إلى قائمة انتظار واحدة."},
        {"name": "استخراج", "caption": "ذكاء اصطناعي مُدرَّب على المجال يستخرج البنود والإجماليات والأكواد الضريبية وبيانات المورد."},
        {"name": "تحقق", "caption": "مطابقة ثلاثية مقابل أوامر الشراء والعقود؛ يُعلّم الاستثناءات للمراجعة."},
        {"name": "ترحيل", "caption": "يوجه الموافقات تلقائيًا ويُرحّل الفواتير المعتمدة إلى نظام تخطيط موارد المؤسسة فورًا."},
    ],
    "deliverables_en": [
        "Multi-channel intake (email, scan, EDI)",
        "AI-driven line-item extraction with line-level accuracy",
        "Automated PO and contract matching",
        "Real-time ERP posting with tamper-evident audit trail",
    ],
    "deliverables_ar": [
        "استيعاب متعدد القنوات (بريد إلكتروني، مسح، EDI)",
        "استخراج البنود بدقة سطر بسطر مدعوم بالذكاء الاصطناعي",
        "مطابقة أوامر الشراء والعقود تلقائيًا",
        "ترحيل فوري إلى نظام ERP مع سجل تدقيق غير قابل للتلاعب",
    ],
    "industries": ["public-sector", "financial-services"],
}


def upgrade() -> None:
    p = INVOICE_AGENT
    # Explicitly populate created_at / updated_at via NOW() — environments
    # that bootstrapped via Base.metadata.create_all (rather than running
    # migration 0001) lack the SQL-level `server_default=NOW()` for those
    # columns, so omitting them would trip a NOT NULL violation here.
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
        {"slug": INVOICE_AGENT["slug"]},
    )
