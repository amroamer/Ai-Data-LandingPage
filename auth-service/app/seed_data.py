"""First-deploy seed data for the products table.

This module is the canonical source of "what the landing page should look
like out of the box" — main.py imports DEFAULT_PRODUCTS and inserts every
row on first startup, exactly when the products table is empty. Subsequent
restarts skip seeding so admin edits and deletes are never overwritten.

Adding a new product later:
  - For brand-new deployments: append a dict here and it lands on first start.
  - For deployments already in production: write an Alembic migration that
    INSERTs the new row, because seed_database() only runs against empty
    tables. See alembic/versions/0005_backfill_product_content.py for a
    worked example.
"""

# Industry slugs match `src/data/industries.js` on the frontend; the
# `industries` JSONB list on each product drives the landing-page filter.
_ALL_INDUSTRIES = ["public-sector", "financial-services", "energy-resources"]
_REGULATED_INDUSTRIES = ["public-sector", "financial-services"]


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
        "industries": list(_ALL_INDUSTRIES),
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
        "industries": list(_ALL_INDUSTRIES),
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
        "industries": list(_ALL_INDUSTRIES),
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
        "industries": list(_REGULATED_INDUSTRIES),
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
        "industries": list(_ALL_INDUSTRIES),
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
        "industries": ["public-sector"],
    },
]
