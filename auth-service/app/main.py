import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from sqlalchemy import select

from app.auth import hash_password
from app.config import settings
from app.database import async_session, engine
from app.models import AppAccess, Product, Setting, User, UserRole
from app.routers import auth, products as products_router, settings as settings_router, users

logger = logging.getLogger("auth-service")

# Slugs of every app that participates in this SSO universe. The seed code
# below grants the bootstrap admin access to all of them. Must stay in sync
# with the same constant in routers/auth.py.
VALID_APP_SLUGS = [
    "slides-generator",
    "ai-badges",
    "cloud-sahab",
    "data-owner",
    "ai-data-landing",
    "ragflow",
]


# One-time product seed. Populates the products table on first startup so
# the landing page has content out of the box. Subsequent runs see existing
# rows and do nothing — admins can add/edit/delete from the UI thereafter.
DEFAULT_PRODUCTS = [
    {
        "slug": "creative-content",
        "icon_name": "Presentation",
        "url": "https://digital-foundation.uksouth.cloudapp.azure.com/slide-generator/login",
        "sort_order": 10,
        "title_en": "Creative Content Agent",
        "title_ar": "وكيل المحتوى الإبداعي",
        "description_en": "AI-powered presentation builder that transforms briefs into polished, brand-compliant KPMG slide decks in seconds.",
        "description_ar": "أداة بناء عروض تقديمية مدعومة بالذكاء الاصطناعي تحول الموجزات إلى عروض شرائح KPMG ممتثلة للعلامة التجارية في ثوانٍ.",
        "problem_en": "Consultants spend hours hand-crafting decks for every client engagement — copying boilerplate slides, hunting for logos, and reformatting content to match brand guidelines. The result is wasted billable time and inconsistent visual quality.",
        "problem_ar": "يقضي الاستشاريون ساعات في إعداد العروض التقديمية يدويًا لكل ارتباط مع العميل — نسخ شرائح نمطية، والبحث عن الشعارات، وإعادة تنسيق المحتوى ليتوافق مع إرشادات العلامة التجارية. والنتيجة هي وقت مدفوع ضائع وجودة بصرية غير متسقة.",
        "solution_en": "Creative Content Agent turns a short brief into a fully branded slide deck in seconds. It assembles slides from a curated KPMG template library, populates them with AI-generated narrative tuned to the brief, and enforces typography, colour, and layout rules so every output looks like it came from the same studio.",
        "solution_ar": "يحوّل وكيل المحتوى الإبداعي موجزًا قصيرًا إلى عرض شرائح كامل بالعلامة التجارية في ثوانٍ. يجمع الشرائح من مكتبة قوالب KPMG المنسقة، ويملأها بسرد مولّد بالذكاء الاصطناعي مضبوط على الموجز، ويفرض قواعد الطباعة واللون والتخطيط لتبدو كل المخرجات وكأنها صادرة من نفس الاستوديو.",
    },
    {
        "slug": "sahab",
        "icon_name": "Warehouse",
        "url": "https://digital-foundation.uksouth.cloudapp.azure.com/cloudsahab/",
        "sort_order": 20,
        "title_en": "Sahab Data Platform",
        "title_ar": "منصة بيانات سحاب",
        "description_en": "A centralized, governed data platform for ingestion, transformation, cataloging, and serving — built for Middle East enterprise scale.",
        "description_ar": "منصة بيانات مركزية ومحوكمة لاستيعاب البيانات وتحويلها وفهرستها وتقديمها — مبنية لنطاق مؤسسات الشرق الأوسط.",
        "problem_en": "Enterprise data lives in dozens of disconnected systems, each with its own schema, refresh cadence, and access policy. Analytics teams spend more time wrangling pipelines than producing insights, and governance is enforced inconsistently — if at all.",
        "problem_ar": "تعيش بيانات المؤسسات في عشرات الأنظمة المنفصلة، لكل منها مخططه الخاص ووتيرة تحديثه وسياسة وصوله. يقضي فريق التحليلات وقتًا أطول في تنظيم خطوط الأنابيب مما يقضيه في إنتاج الرؤى، وتُطبَّق الحوكمة بشكل غير متسق — إن طُبقت أصلًا.",
        "solution_en": "Sahab unifies ingestion, transformation, cataloging, and serving on a single governed substrate. Out-of-the-box connectors pull from common enterprise sources, lineage is captured automatically, and a central catalogue makes discovery and access requests a one-click flow — without sacrificing the controls regulators expect.",
        "solution_ar": "يوحّد سحاب الاستيعاب والتحويل والفهرسة والتقديم على ركيزة محوكمة واحدة. يسحب الموصلات الجاهزة من مصادر المؤسسات الشائعة، ويُلتقط النسب تلقائيًا، ويجعل الفهرس المركزي اكتشاف البيانات وطلبات الوصول تدفقًا بنقرة واحدة — دون التضحية بالضوابط التي يتوقعها المنظمون.",
    },
    {
        "slug": "data-owner",
        "icon_name": "DatabaseZap",
        "url": "https://digital-foundation.uksouth.cloudapp.azure.com/dataowner/",
        "sort_order": 30,
        "title_en": "Data Owner Agent",
        "title_ar": "وكيل مالك البيانات",
        "description_en": "An intelligent assistant that helps data owners manage classification, business definitions, quality rules, and PII detection across their data assets.",
        "description_ar": "مساعد ذكي يساعد مالكي البيانات على إدارة التصنيف والتعريفات التجارية وقواعد الجودة واكتشاف المعلومات الشخصية عبر أصول بياناتهم.",
        "problem_en": "Data ownership at scale is a thankless job: thousands of tables, no canonical definitions, ambiguous classification, and no easy way to spot PII before it leaks downstream. Owners default to manual spot-checks and stale spreadsheets.",
        "problem_ar": "ملكية البيانات على نطاق واسع مهمة شاقة: آلاف الجداول، لا تعريفات قياسية، تصنيف غامض، ولا طريقة سهلة لاكتشاف المعلومات الشخصية قبل تسربها لاحقًا. يلجأ المالكون إلى الفحوصات اليدوية وجداول البيانات القديمة.",
        "solution_en": "Data Owner Agent profiles assets continuously, suggests classifications and business definitions, flags PII candidates, and auto-generates quality rules from observed patterns. Owners review and approve in a single console — turning weeks of manual stewardship into hours of curation.",
        "solution_ar": "يقوم وكيل مالك البيانات بتحليل الأصول باستمرار، ويقترح التصنيفات والتعريفات التجارية، ويُعلِّم المعلومات الشخصية المحتملة، ويُولّد قواعد الجودة تلقائيًا من الأنماط الملاحظة. يراجع المالكون ويوافقون من وحدة تحكم واحدة — محوّلين أسابيع من الإشراف اليدوي إلى ساعات من التنسيق.",
    },
    {
        "slug": "compliance",
        "icon_name": "ShieldCheck",
        "url": "https://digital-foundation.uksouth.cloudapp.azure.com/AICompAgent/login",
        "sort_order": 40,
        "title_en": "Compliance Platform",
        "title_ar": "منصة الامتثال",
        "description_en": "Automated regulatory compliance checker against regional frameworks (NDMO, PDPL, SAMA, DGA, SDAIA).",
        "description_ar": "مدقق امتثال تنظيمي تلقائي مقابل الأطر الإقليمية (NDMO، PDPL، SAMA، DGA، SDAIA).",
        "problem_en": "Regional data and AI regulations (NDMO, PDPL, SAMA, DGA, SDAIA) overlap and evolve constantly. Compliance teams chase each new directive with manual gap assessments, leaving organizations exposed during the lag.",
        "problem_ar": "تتداخل لوائح البيانات والذكاء الاصطناعي الإقليمية (NDMO، PDPL، SAMA، DGA، SDAIA) وتتطور باستمرار. تطارد فرق الامتثال كل توجيه جديد بتقييمات فجوات يدوية، مما يترك المؤسسات معرضة خلال فترة التأخير.",
        "solution_en": "The Compliance Platform encodes each framework as a machine-readable ruleset and runs continuous checks against your live policies, controls, and data flows. Findings come pre-mapped to the originating regulation, with remediation guidance and audit-ready evidence trails.",
        "solution_ar": "تُشفِّر منصة الامتثال كل إطار كمجموعة قواعد قابلة للقراءة آليًا، وتُجري فحوصات مستمرة على سياساتك وضوابطك وتدفقات بياناتك المباشرة. تأتي النتائج مرتبطة مسبقًا باللائحة الأصلية، مع إرشادات المعالجة وسجلات الأدلة الجاهزة للتدقيق.",
    },
    {
        "slug": "ea-arch",
        "icon_name": "Layers",
        "url": "https://digital-foundation.uksouth.cloudapp.azure.com/EAArchAgent/",
        "sort_order": 50,
        "title_en": "EA Arch Agent",
        "title_ar": "وكيل هندسة المؤسسة",
        "description_en": "An enterprise-architecture assistant that drafts target-state blueprints, traces capability-to-system mappings, and accelerates architecture reviews.",
        "description_ar": "مساعد هندسة مؤسسات يصيغ مخططات الحالة المستهدفة، ويتتبع ربط القدرات بالأنظمة، ويسرّع مراجعات البنية المعمارية.",
        "problem_en": "Enterprise architects burn weeks producing target-state diagrams, capability maps, and ADRs by hand. By the time the artefacts are reviewed, the underlying systems have already drifted — making the documents stale on arrival.",
        "problem_ar": "يقضي مهندسو المؤسسات أسابيع في إنتاج مخططات الحالة المستهدفة وخرائط القدرات وسجلات قرارات البنية يدويًا. وبحلول وقت مراجعة المخرجات، تكون الأنظمة الأساسية قد انجرفت بالفعل — مما يجعل الوثائق قديمة عند وصولها.",
        "solution_en": "EA Arch Agent ingests your existing architecture inventory and generates target-state blueprints, capability-to-system mappings, and decision records in minutes. It keeps artefacts in lockstep with reality by re-running on schedule and flagging drift, so reviews focus on judgment, not redrawing boxes.",
        "solution_ar": "يستوعب وكيل هندسة المؤسسة جرد البنية الموجود لديك ويُولّد مخططات الحالة المستهدفة وخرائط ربط القدرات بالأنظمة وسجلات القرار في دقائق. يحافظ على تزامن المخرجات مع الواقع عبر إعادة التشغيل المجدولة والإشارة إلى الانحراف، حتى تركز المراجعات على الحكم لا على إعادة رسم المربعات.",
    },
    {
        "slug": "khda",
        "icon_name": "GraduationCap",
        "url": "https://digital-foundation.uksouth.cloudapp.azure.com/khda/",
        "sort_order": 60,
        "title_en": "KHDA Data Platform",
        "title_ar": "منصة بيانات هيئة المعرفة والتنمية البشرية",
        "description_en": "A purpose-built data platform for KHDA — ingesting, governing, and analyzing education-sector data to power policy and oversight.",
        "description_ar": "منصة بيانات مُصممة لهيئة المعرفة والتنمية البشرية (KHDA) — لاستيعاب وحوكمة وتحليل بيانات قطاع التعليم لدعم السياسات والإشراف.",
        "problem_en": "Education-sector oversight requires consolidating data from hundreds of schools, training providers, and licensing systems — each reporting in different formats on different cadences. Manual consolidation delays insight and erodes confidence in published indicators.",
        "problem_ar": "يتطلب الإشراف على قطاع التعليم تجميع البيانات من مئات المدارس ومزودي التدريب وأنظمة الترخيص — كل منها يُقدم تقاريره بصيغ مختلفة وبوتيرة مختلفة. يؤخر التجميع اليدوي الرؤى ويُضعف الثقة في المؤشرات المنشورة.",
        "solution_en": "The KHDA Data Platform standardizes ingestion across all reporting entities, applies KHDA-specific governance and quality rules, and exposes a unified analytical layer for policy teams and inspectors. Indicators are recomputed on every refresh, with full lineage from source to dashboard.",
        "solution_ar": "تُوحّد منصة بيانات KHDA الاستيعاب عبر جميع الكيانات المُبلِّغة، وتُطبق قواعد الحوكمة والجودة الخاصة بـKHDA، وتعرض طبقة تحليلية موحدة لفرق السياسات والمفتشين. تُعاد المؤشرات حسابها مع كل تحديث، مع نسب كامل من المصدر إلى لوحة المعلومات.",
    },
]


async def seed_database() -> None:
    """Create the bootstrap admin, default settings, and seed products on first start.

    Idempotent: safe to run on every startup. Creates an admin only when no
    admin exists yet, only inserts default settings rows that are missing,
    and only seeds products when the table is empty (so admins can freely
    delete entries without them being re-added on restart).
    """
    async with async_session() as db:
        result = await db.execute(select(User).where(User.role == UserRole.admin).limit(1))
        admin = result.scalar_one_or_none()

        if admin is None:
            logger.info("No admin found — creating default admin user")
            admin = User(
                email=settings.DEFAULT_ADMIN_EMAIL,
                password_hash=hash_password(settings.DEFAULT_ADMIN_PASSWORD),
                full_name="System Administrator",
                role=UserRole.admin,
            )
            db.add(admin)
            await db.flush()

            for slug in VALID_APP_SLUGS:
                db.add(AppAccess(user_id=admin.id, app_slug=slug, has_access=True))

            logger.info("Default admin created: %s", settings.DEFAULT_ADMIN_EMAIL)

        result = await db.execute(select(Setting).where(Setting.key == "signup_enabled"))
        if result.scalar_one_or_none() is None:
            db.add(Setting(key="signup_enabled", value="true"))
            logger.info("Default settings created")

        # Seed products only if the table is empty — never re-add deleted ones.
        result = await db.execute(select(Product).limit(1))
        if result.scalar_one_or_none() is None:
            for entry in DEFAULT_PRODUCTS:
                db.add(Product(**entry))
            logger.info("Seeded %d default products", len(DEFAULT_PRODUCTS))

        await db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """ASGI lifespan handler.

    Schema management is owned by Alembic and runs from the container
    entrypoint before this process starts; here we only run the idempotent
    seeder and dispose of the connection pool on shutdown.
    """
    await seed_database()
    logger.info("Auth service started")
    yield
    await engine.dispose()


app = FastAPI(
    title="KPMG Auth Service",
    version="1.0.0",
    docs_url="/auth/api/docs",
    openapi_url="/auth/api/openapi.json",
    lifespan=lifespan,
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(settings_router.router)
app.include_router(products_router.public_router)
app.include_router(products_router.admin_router)


@app.get("/", include_in_schema=False)
async def root():
    """Root convenience redirect: bounces visitors to the Swagger UI."""
    return RedirectResponse(url="/auth/api/docs")


@app.get("/auth/api/health")
async def health():
    """Liveness probe used by orchestrators (Docker, Kubernetes, etc.)."""
    return {"status": "ok"}
