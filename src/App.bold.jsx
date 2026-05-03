import { useState, useEffect, useRef } from "react";
import UserMenu from "./components/UserMenu";
import { useI18n, useT } from "./i18n/i18n";
import {
  Brain,
  Route,
  Server,
  Factory,
  Lightbulb,
  Presentation,
  DatabaseZap,
  Warehouse,
  ShieldCheck,
  Cloud,
  ArrowUpRight,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  Globe,
} from "lucide-react";

/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */

// Service catalogue. Visual identity (icon) lives with the data; the
// human-readable text is fetched from the active locale via `i18nKey`.
const services = [
  { icon: Brain, i18nKey: "readiness" },
  { icon: Route, i18nKey: "strategies" },
  { icon: Server, i18nKey: "platforms" },
  { icon: Factory, i18nKey: "factories" },
  { icon: Lightbulb, i18nKey: "solutions" },
  { icon: Cloud, i18nKey: "cloud" },
];

// Product catalogue. URL stays hard-coded since it is not user-facing copy;
// title and description are looked up by `i18nKey`.
const products = [
  {
    icon: Presentation,
    i18nKey: "creativeContent",
    url: "https://digital-foundation.uksouth.cloudapp.azure.com/slide-generator/login",
  },
  {
    icon: Warehouse,
    i18nKey: "sahab",
    url: "https://digital-foundation.uksouth.cloudapp.azure.com/cloudsahab/",
  },
  {
    icon: DatabaseZap,
    i18nKey: "dataOwner",
    url: "https://digital-foundation.uksouth.cloudapp.azure.com/dataowner/",
  },
  {
    icon: ShieldCheck,
    i18nKey: "compliance",
    url: "https://digital-foundation.uksouth.cloudapp.azure.com/AICompAgent/login",
  },
];

// Marketing stats. Numeric `value` and `suffix` stay neutral; the label
// comes from the locale bundle.
const stats = [
  { value: 50, suffix: "+", labelKey: "stats.aiSolutions" },
  { value: 200, suffix: "+", labelKey: "stats.enterpriseModels" },
  { value: 15, suffix: "+", labelKey: "stats.organizations" },
  { value: 6, suffix: "", labelKey: "stats.servicePillars" },
];

/* ═══════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════ */

/**
 * Returns a ref + boolean that flips to true the first time the element
 * intersects the viewport. Used to gate scroll-driven entrance animations.
 */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.unobserve(el);
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, inView];
}

/* ═══════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════ */

/**
 * Wraps children in an opacity/translate transition that runs once the
 * element scrolls into view. `delay` staggers a row of siblings.
 */
function Reveal({ children, delay = 0, className = "" }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/**
 * Counts up to `end` using a quartic ease-out the first time the component
 * enters the viewport. Numbers render with `tabular-nums` so the layout
 * doesn't jitter as digits change.
 */
function AnimatedCounter({ end, suffix = "", label }) {
  const ref = useRef(null);
  const [count, setCount] = useState(0);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          obs.unobserve(el);
          const duration = 1800;
          const startTime = performance.now();
          function animate(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            setCount(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
          }
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [end]);

  return (
    <div ref={ref} className="text-center">
      <div className="font-display text-5xl font-extrabold tabular-nums text-white lg:text-7xl">
        {count}
        <span className="text-accent">{suffix}</span>
      </div>
      <div className="mt-4 text-[11px] font-medium tracking-[0.2em] text-white/30 uppercase">
        {label}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   LANGUAGE SWITCHER
   ═══════════════════════════════════════════ */

/**
 * Toggle between English and Arabic. The provider handles RTL/LTR direction
 * and persistence; this button only flips the active locale.
 */
function LanguageToggle({ dark = true }) {
  const { lang, setLang, t } = useI18n();
  const next = lang === "en" ? "ar" : "en";

  return (
    <button
      onClick={() => setLang(next)}
      title={t("language.switchTo")}
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-bold tracking-[0.08em] uppercase transition-all duration-200 cursor-pointer ${
        dark
          ? "border-white/10 text-white/60 hover:border-white/25 hover:text-white"
          : "border-warm-200 text-warm-800/70 hover:border-warm-400 hover:text-warm-900"
      }`}
    >
      <Globe size={13} />
      {t("language.switchTo")}
    </button>
  );
}

/* ═══════════════════════════════════════════
   NAVBAR
   ═══════════════════════════════════════════ */

/**
 * Top navigation. Becomes opaque/blurred once the user scrolls past 20px and
 * collapses to a hamburger menu below the `md` breakpoint.
 */
function Navbar({ user }) {
  const t = useT();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { labelKey: "nav.services", href: "#services" },
    { labelKey: "nav.products", href: "#products" },
    { labelKey: "nav.contact", href: "#footer" },
  ];

  return (
    <nav
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-white/[0.04] bg-[#0a0a0a]/90 shadow-2xl shadow-black/40 backdrop-blur-2xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <a href="#" className="group flex items-center gap-3.5">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-kpmg transition-all duration-300 group-hover:shadow-lg group-hover:shadow-kpmg/20">
              <span className="font-display text-sm font-extrabold text-white">
                {t("brand.logoMark")}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-sm font-bold tracking-[0.08em] text-white uppercase">
                {t("brand.name")}
              </span>
              <span className="text-[9px] font-medium tracking-[0.25em] text-accent/70 uppercase">
                {t("brand.tagline")}
              </span>
            </div>
          </a>

          {/* Desktop nav */}
          <div className="hidden items-center gap-10 md:flex">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative text-[13px] font-medium text-white/35 transition-colors duration-300 after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-accent after:transition-all after:duration-300 hover:text-white hover:after:w-full"
              >
                {t(link.labelKey)}
              </a>
            ))}
            <LanguageToggle />
            <a
              href="#products"
              className="group inline-flex items-center gap-2.5 rounded-full bg-accent px-6 py-2.5 text-[12px] font-bold tracking-[0.05em] text-white uppercase transition-all duration-300 hover:bg-medium-blue hover:shadow-lg hover:shadow-accent/20"
            >
              {t("nav.exploreProducts")}
              <ArrowRight
                size={13}
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </a>
            {user && <UserMenu variant="bold" />}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-white md:hidden"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-white/[0.06] py-8 md:hidden">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-3.5 text-sm font-medium text-white/40 hover:text-white"
              >
                {t(link.labelKey)}
              </a>
            ))}
            <div className="mt-4">
              <LanguageToggle />
            </div>
            <a
              href="#products"
              onClick={() => setMobileOpen(false)}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-[12px] font-bold tracking-[0.05em] text-white uppercase"
            >
              {t("nav.exploreProducts")}
              <ArrowRight size={13} />
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════ */

/**
 * Landing hero. Tracks the cursor to drive a soft spotlight and runs a
 * staggered entrance for badge / headline / description / CTAs on first paint.
 */
function Hero() {
  const t = useT();
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  // The third line gets the gradient treatment; build the array from i18n keys
  // so the same visual emphasis lands on the equivalent phrase in any locale.
  const headlineLines = [
    { key: "hero.headline.line1", accent: false },
    { key: "hero.headline.line2", accent: false },
    { key: "hero.headline.line3", accent: true },
    { key: "hero.headline.line4", accent: false },
  ];

  return (
    <section
      onMouseMove={handleMouseMove}
      className="relative flex min-h-screen items-center overflow-hidden"
      style={{ background: "#0a0a0a" }}
    >
      {/* ── Atmospheric layers ── */}
      <div className="absolute inset-0">
        {/* Base atmosphere */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 70% 40%, rgba(0, 51, 141, 0.12) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 20% 80%, rgba(0, 51, 141, 0.06) 0%, transparent 60%), linear-gradient(180deg, #0d1117 0%, #0a0a0a 100%)",
          }}
        />

        {/* Animated orbs */}
        <div
          className="absolute -top-[20%] right-[5%] h-[600px] w-[600px] rounded-full opacity-60"
          style={{
            background:
              "radial-gradient(circle, rgba(0, 51, 141, 0.15) 0%, transparent 70%)",
            animation: "float-1 12s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-[10%] -left-[10%] h-[400px] w-[400px] rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(circle, rgba(0, 145, 218, 0.08) 0%, transparent 70%)",
            animation: "float-2 16s ease-in-out infinite",
          }}
        />
        <div
          className="absolute top-[30%] left-[40%] h-[250px] w-[250px] rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(circle, rgba(74, 127, 212, 0.06) 0%, transparent 70%)",
            animation: "float-1 14s ease-in-out infinite",
            animationDelay: "-5s",
          }}
        />

        {/* Mouse-following spotlight */}
        <div
          className="absolute inset-0 transition-opacity duration-[3000ms]"
          style={{
            background: `radial-gradient(900px circle at ${mousePos.x}% ${mousePos.y}%, rgba(0, 94, 184, 0.04), transparent 40%)`,
          }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        {/* Floating geometric shapes */}
        <div
          className="absolute top-[15%] right-[12%] h-20 w-20 rotate-45 rounded-2xl border border-white/[0.04]"
          style={{
            animation: "float-2 9s ease-in-out infinite",
            animationDelay: "-2s",
          }}
        />
        <div
          className="absolute top-[60%] right-[25%] h-12 w-12 rounded-full border border-accent/[0.06]"
          style={{
            animation: "float-1 11s ease-in-out infinite",
            animationDelay: "-5s",
          }}
        />
        <div
          className="absolute bottom-[30%] left-[8%] h-16 w-16 -rotate-12 rounded-2xl border border-white/[0.03]"
          style={{
            animation: "float-2 8s ease-in-out infinite",
            animationDelay: "-3s",
          }}
        />
        <div
          className="absolute top-[45%] left-[20%] h-8 w-8 rotate-[30deg] border border-accent/[0.04]"
          style={{
            animation: "float-1 13s ease-in-out infinite",
            animationDelay: "-7s",
          }}
        />

        {/* Horizon glow */}
        <div
          className="absolute right-0 bottom-0 left-0 h-[40%]"
          style={{
            background:
              "linear-gradient(0deg, rgba(0, 51, 141, 0.06) 0%, transparent 100%)",
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-32 lg:px-10 lg:py-40">
        <div className="max-w-5xl">
          {/* Badge */}
          <div
            className={`mb-10 transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              loaded ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
          >
            <div className="inline-flex items-center gap-3 rounded-full border border-accent/15 bg-accent/[0.04] px-5 py-2.5 backdrop-blur-sm">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              <span className="font-display text-[10px] font-semibold tracking-[0.3em] text-accent/80 uppercase">
                {t("hero.badge")}
              </span>
            </div>
          </div>

          {/* Headline — staggered reveal */}
          <h1 className="max-w-3xl font-display font-extrabold uppercase leading-[0.92] tracking-[-0.03em]">
            {headlineLines.map((line, i) => (
              <span
                key={line.key}
                className={`block transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  loaded
                    ? "translate-y-0 opacity-100"
                    : "translate-y-12 opacity-0"
                } ${
                  line.accent
                    ? "bg-gradient-to-r from-light-blue via-medium-blue to-kpmg-glow bg-clip-text text-transparent"
                    : "text-white"
                }`}
                style={{
                  transitionDelay: `${200 + i * 120}ms`,
                  fontSize: "clamp(2.2rem, 4.5vw, 3.5rem)",
                }}
              >
                {t(line.key)}
              </span>
            ))}
          </h1>

          {/* Description */}
          <p
            className={`mt-10 max-w-xl text-lg leading-relaxed text-white/40 transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] lg:text-xl ${
              loaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
            style={{ transitionDelay: "800ms" }}
          >
            {t("hero.description")}
          </p>

          {/* CTAs */}
          <div
            className={`mt-12 flex flex-wrap gap-4 transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              loaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
            style={{ transitionDelay: "1000ms" }}
          >
            <a
              href="#services"
              className="group inline-flex items-center gap-3 rounded-full bg-accent px-8 py-4 font-display text-[12px] font-bold tracking-[0.08em] text-white uppercase transition-all duration-300 hover:bg-medium-blue hover:shadow-xl hover:shadow-accent/15"
            >
              {t("hero.ctaPrimary")}
              <ChevronDown
                size={14}
                className="transition-transform duration-300 group-hover:translate-y-0.5"
              />
            </a>
            <a
              href="#products"
              className="inline-flex items-center gap-3 rounded-full border border-white/10 px-8 py-4 font-display text-[12px] font-bold tracking-[0.08em] text-white uppercase transition-all duration-300 hover:border-white/25 hover:bg-white/[0.03]"
            >
              {t("hero.ctaSecondary")}
            </a>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
        <span className="text-[9px] font-semibold tracking-[0.3em] text-white/15 uppercase">
          {t("hero.scroll")}
        </span>
        <div className="h-8 w-px animate-pulse bg-gradient-to-b from-white/20 to-transparent" />
      </div>

      {/* Bottom fade */}
      <div className="absolute right-0 bottom-0 left-0 h-48 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
    </section>
  );
}

/* ═══════════════════════════════════════════
   STATS
   ═══════════════════════════════════════════ */

/**
 * Strip of animated counters. Counters start their count-up the first time
 * the strip enters view and stay on the final value afterward.
 */
function Stats() {
  const t = useT();
  const [ref, inView] = useInView(0.3);

  return (
    <section className="relative border-y border-white/[0.04] bg-[#0d0d0d]">
      {/* Accent line at top */}
      <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />

      <div ref={ref} className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-24">
        <div className="grid grid-cols-2 gap-12 lg:grid-cols-4 lg:gap-0">
          {stats.map((stat, i) => (
            <div
              key={stat.labelKey}
              className={`relative transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                inView
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              } ${i > 0 ? "lg:border-l lg:border-white/[0.05]" : ""}`}
              style={{ transitionDelay: inView ? `${i * 150}ms` : "0ms" }}
            >
              <AnimatedCounter
                end={stat.value}
                suffix={stat.suffix}
                label={t(stat.labelKey)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SERVICES — BCG X-STYLE TABBED
   ═══════════════════════════════════════════ */

/**
 * Single service tile. Pure presentational — copy is supplied by the parent
 * after locale lookup so this stays locale-agnostic.
 */
function ServiceCard({ icon: Icon, title, description }) {
  return (
    <div className="group rounded-2xl border border-white/[0.06] bg-[#111111] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-kpmg-glow/20 hover:shadow-xl hover:shadow-kpmg/[0.06]">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-kpmg/10 text-kpmg-glow transition-colors duration-300 group-hover:bg-kpmg/15">
        <Icon size={22} strokeWidth={1.5} />
      </div>
      <h3 className="mb-3 font-display text-base font-bold text-white">
        {title}
      </h3>
      <p className="text-[13px] leading-relaxed text-white/35">
        {description}
      </p>
    </div>
  );
}

/**
 * Services section. Reads the service catalogue and resolves
 * each item's title/description against the active locale.
 */
function Services() {
  const t = useT();
  const [ref, inView] = useInView();

  return (
    <section id="services" className="relative bg-[#0f0f0f] py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <span className="font-display text-[10px] font-semibold tracking-[0.35em] text-accent/60 uppercase">
            {t("services.eyebrow")}
          </span>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-[-0.02em] text-white uppercase sm:text-4xl lg:text-5xl">
            {t("services.title")}
          </h2>
        </Reveal>
        <Reveal delay={200}>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/35 lg:text-lg">
            {t("services.intro")}
          </p>
        </Reveal>

        <div
          ref={ref}
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {services.map((service, i) => (
            <div
              key={service.i18nKey}
              className={`transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                inView
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
              style={{ transitionDelay: inView ? `${i * 80}ms` : "0ms" }}
            >
              <ServiceCard
                icon={service.icon}
                title={t(`services.items.${service.i18nKey}.title`)}
                description={t(`services.items.${service.i18nKey}.description`)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   PRODUCTS
   ═══════════════════════════════════════════ */

/**
 * Single product tile. Renders as a clickable link when live, otherwise as a
 * dimmed static card. The "Launch Application" CTA only appears for live items.
 */
function ProductCard({ icon: Icon, title, description, url, status, launchLabel, isLive }) {
  const inner = (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border p-7 transition-all duration-500 lg:p-8 ${
        isLive
          ? "border-white/[0.06] bg-[#111111] hover:-translate-y-1 hover:border-accent/25 hover:shadow-2xl hover:shadow-accent/[0.04]"
          : "border-white/[0.04] bg-[#0d0d0d] opacity-60"
      }`}
    >
      {/* Top row: icon + status */}
      <div className="flex items-start justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-500 ${
            isLive
              ? "bg-accent/[0.06] text-accent group-hover:scale-110 group-hover:bg-accent/[0.12]"
              : "bg-white/[0.03] text-white/20"
          }`}
        >
          <Icon size={22} strokeWidth={1.5} />
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-[9px] font-bold tracking-[0.12em] uppercase ${
            isLive
              ? "border-emerald-500/15 bg-emerald-500/10 text-emerald-400"
              : "border-amber-500/10 bg-amber-500/8 text-amber-400/70"
          }`}
        >
          {status}
        </span>
      </div>

      {/* Title */}
      <h3
        className={`mt-6 font-display text-lg font-bold ${
          isLive ? "text-white" : "text-white/40"
        }`}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        className={`mt-3 flex-1 text-[13px] leading-relaxed ${
          isLive ? "text-white/35" : "text-white/20"
        }`}
      >
        {description}
      </p>

      {/* Launch link */}
      {isLive && (
        <div className="mt-6 flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] text-accent/60 uppercase transition-colors duration-300 group-hover:text-accent">
          {launchLabel}
          <ArrowUpRight
            size={13}
            className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </div>
      )}
    </div>
  );

  if (isLive) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full"
      >
        {inner}
      </a>
    );
  }
  return inner;
}

/**
 * Products section. All items currently ship as "Live"; the card component
 * still supports a non-live state for future entries.
 */
function Products() {
  const t = useT();
  const [ref, inView] = useInView();

  return (
    <section id="products" className="relative bg-[#0a0a0a] py-28 lg:py-36">
      {/* Top accent */}
      <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <span className="font-display text-[10px] font-semibold tracking-[0.35em] text-accent/60 uppercase">
            {t("products.eyebrow")}
          </span>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-[-0.02em] text-white uppercase sm:text-4xl lg:text-5xl">
            {t("products.title")}
          </h2>
        </Reveal>
        <Reveal delay={200}>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/35 lg:text-lg">
            {t("products.intro")}
          </p>
        </Reveal>

        <div
          ref={ref}
          className="mt-16 grid gap-5 grid-cols-1"
        >
          {products.map((product, i) => (
            <div
              key={product.i18nKey}
              className={`transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                inView
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
              style={{ transitionDelay: inView ? `${i * 100}ms` : "0ms" }}
            >
              <ProductCard
                icon={product.icon}
                url={product.url}
                isLive={true}
                title={t(`products.items.${product.i18nKey}.title`)}
                description={t(`products.items.${product.i18nKey}.description`)}
                status={t("products.statusLive")}
                launchLabel={t("products.launch")}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   CALL TO ACTION
   ═══════════════════════════════════════════ */

/**
 * Full-bleed CTA panel that appears below the products section.
 */
function CallToAction() {
  const t = useT();
  const [ref, inView] = useInView();

  return (
    <section className="relative overflow-hidden py-24 sm:py-32 lg:py-44">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #00338d 0%, #001f5c 40%, #0a0a0a 100%)",
        }}
      />
      <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-accent/[0.04] blur-[150px]" />
      <div className="absolute bottom-0 left-[20%] h-[400px] w-[400px] rounded-full bg-kpmg-glow/[0.06] blur-[120px]" />

      <div
        ref={ref}
        className="relative mx-auto max-w-4xl px-6 text-center lg:px-10"
      >
        <div
          className={`transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
            inView ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <h2 className="font-display text-3xl font-extrabold tracking-[-0.02em] text-white uppercase sm:text-4xl lg:text-5xl">
            {t("cta.headlineLine1")}
            <br />
            <span className="text-accent">{t("cta.headlineLine2")}</span>
          </h2>
          <p className="mx-auto mt-8 max-w-lg text-base leading-relaxed text-white/45 lg:text-lg">
            {t("cta.description")}
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <a
              href="#products"
              className="group inline-flex items-center gap-2.5 rounded-full bg-accent px-9 py-4 text-[12px] font-bold tracking-[0.08em] text-white uppercase transition-all duration-300 hover:bg-medium-blue hover:shadow-xl hover:shadow-accent/15"
            >
              {t("cta.primary")}
              <ArrowRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </a>
            <a
              href="#footer"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-9 py-4 text-[12px] font-bold tracking-[0.08em] text-white uppercase transition-all duration-300 hover:border-white/30 hover:bg-white/[0.04]"
            >
              {t("cta.secondary")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════ */

/**
 * Footer with brand, navigation links, and a live-rebuild list of services.
 */
function Footer() {
  const t = useT();

  // Footer nav uses the same anchors as the main navbar.
  const navItems = [
    { labelKey: "nav.services", href: "#services" },
    { labelKey: "nav.products", href: "#products" },
    { labelKey: "nav.contact", href: "#footer" },
  ];

  return (
    <footer id="footer" className="border-t border-white/[0.04] bg-[#080808]">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:gap-16 lg:py-24">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-kpmg">
                <span className="font-display text-sm font-extrabold text-white">
                  {t("brand.logoMark")}
                </span>
              </div>
              <div>
                <div className="font-display text-sm font-bold tracking-[0.05em] text-white uppercase">
                  {t("brand.name")}
                </div>
                <div className="text-[9px] font-medium tracking-[0.2em] text-accent/50 uppercase">
                  {t("brand.tagline")}
                </div>
              </div>
            </div>
            <p className="mt-8 max-w-sm text-sm leading-relaxed text-white/25">
              {t("footer.description")}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-[10px] font-bold tracking-[0.3em] text-white/15 uppercase">
              {t("footer.navigation")}
            </h4>
            <div className="mt-6 space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block text-[13px] text-white/30 transition-colors duration-300 hover:text-accent"
                >
                  {t(item.labelKey)}
                </a>
              ))}
            </div>
          </div>

          {/* Capabilities */}
          <div>
            <h4 className="text-[10px] font-bold tracking-[0.3em] text-white/15 uppercase">
              {t("footer.capabilities")}
            </h4>
            <div className="mt-6 space-y-4">
              {services.map((s) => (
                <span
                  key={s.i18nKey}
                  className="block text-[13px] text-white/20"
                >
                  {t(`services.items.${s.i18nKey}.title`)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.05] py-8">
          <p className="text-[11px] text-white/15">{t("footer.copyright")}</p>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════
   APP
   ═══════════════════════════════════════════ */

/**
 * Bold-theme landing page. Composes the full single-page layout: navbar,
 * hero, services, products, CTA, footer.
 */
export default function BoldApp({ user }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] font-body antialiased">
      <Navbar user={user} />
      <Hero />
      <Services />
      <Products />
      <CallToAction />
      <Footer />
    </div>
  );
}
