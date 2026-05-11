import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import UserMenu from "./components/UserMenu";
import { useI18n, useT } from "./i18n/i18n";
import { getProductIcon } from "./data/icons";
import { INDUSTRIES } from "./data/industries";
import { apiGetProducts } from "./api/auth";
import {
  Brain,
  Route,
  Server,
  Factory,
  Lightbulb,
  Cloud,
  ArrowRight,
  ArrowUpRight,
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe,
  CheckCircle2,
  ImageOff,
  Film,
  Maximize2,
  Download,
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
 * after locale lookup so this stays locale-agnostic. Clicking opens the
 * detail modal via the supplied `onClick` handler.
 */
function ServiceCard({ icon: Icon, title, description, onClick, learnMoreLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111111] p-7 text-start transition-all duration-500 hover:-translate-y-1 hover:border-kpmg-glow/20 hover:shadow-xl hover:shadow-kpmg/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-kpmg-glow/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f] cursor-pointer"
    >
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-kpmg/10 text-kpmg-glow transition-colors duration-300 group-hover:bg-kpmg/15">
        <Icon size={22} strokeWidth={1.5} />
      </div>
      <h3 className="mb-3 font-display text-base font-bold text-white">
        {title}
      </h3>
      <p className="text-[13px] leading-relaxed text-white/35">
        {description}
      </p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.18em] uppercase text-kpmg-glow/80 transition-all duration-300 group-hover:gap-2.5 group-hover:text-kpmg-glow">
        {learnMoreLabel}
        <ArrowRight size={13} strokeWidth={2} className="rtl:-scale-x-100" />
      </span>
    </button>
  );
}

/**
 * Modal overlay that surfaces the long-form details for a single service.
 * Closes on backdrop click, on Escape, and on the close button. Locks body
 * scroll while open. Render with `service={null}` to keep it dismissed.
 */
function ServiceDetailModal({ service, onClose }) {
  const t = useT();

  // Esc-to-close + body-scroll lock for the duration of the modal lifetime.
  useEffect(() => {
    if (!service) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [service, onClose]);

  if (!service) return null;

  const Icon = service.icon;
  const key = service.i18nKey;
  const phasesRaw = t(`services.items.${key}.phases`);
  const phaseList = Array.isArray(phasesRaw) ? phasesRaw : [];
  const bullets = t(`services.items.${key}.bullets`);
  const bulletList = Array.isArray(bullets) ? bullets : [];

  // Inline SVG dot pattern for the hero band — keeps the asset self-contained
  // and color-controllable via opacity rather than shipping a PNG.
  const dotPattern = {
    backgroundImage:
      "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
    backgroundSize: "22px 22px",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 sm:px-6"
    >
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f0f0f] shadow-2xl shadow-black/60 animate-[scaleIn_240ms_cubic-bezier(0.16,1,0.3,1)]">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("services.closeLabel")}
          className="absolute end-5 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-black/40 text-white/60 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-black/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-kpmg-glow/40 cursor-pointer"
        >
          <X size={16} strokeWidth={2} />
        </button>

        <div className="max-h-[88vh] overflow-y-auto">
          {/* Hero band — gradient backdrop, dotted pattern, large iconography */}
          <div className="relative overflow-hidden border-b border-white/[0.06] bg-gradient-to-br from-kpmg/[0.18] via-kpmg/[0.05] to-transparent px-8 pt-10 pb-9 sm:px-10 sm:pt-12 sm:pb-10">
            <div
              className="absolute inset-0 opacity-60"
              style={dotPattern}
              aria-hidden="true"
            />
            <div
              className="absolute -top-20 -end-16 h-48 w-48 rounded-full bg-kpmg-glow/10 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative flex items-start gap-5">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border border-kpmg-glow/25 bg-kpmg/15 text-kpmg-glow shadow-lg shadow-kpmg/20">
                <Icon size={30} strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <span className="font-display text-[10px] font-bold tracking-[0.28em] text-kpmg-glow uppercase">
                  {t("services.eyebrow")}
                </span>
                <h3
                  id="service-modal-title"
                  className="mt-2 font-display text-2xl font-extrabold tracking-[-0.01em] text-white sm:text-3xl"
                >
                  {t(`services.items.${key}.title`)}
                </h3>
              </div>
            </div>

            <p className="relative mt-5 text-sm leading-relaxed text-white/55 sm:text-[15px]">
              {t(`services.items.${key}.description`)}
            </p>
          </div>

          {/* Body — approach phases + deliverables */}
          <div className="px-8 py-9 sm:px-10 sm:py-10">
            {phaseList.length > 0 && (
              <div>
                <div className="flex items-baseline gap-3">
                  <h4 className="font-display text-[10px] font-bold tracking-[0.28em] text-kpmg-glow uppercase">
                    {t("services.approachLabel")}
                  </h4>
                  <span className="h-px flex-1 bg-gradient-to-r from-kpmg-glow/30 to-transparent rtl:bg-gradient-to-l" />
                </div>

                <p className="mt-4 text-sm leading-relaxed text-white/55 sm:text-[15px]">
                  {t(`services.items.${key}.details`)}
                </p>

                <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {phaseList.map((phase, idx) => (
                    <div
                      key={idx}
                      className="group relative rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 transition-all duration-300 hover:border-kpmg-glow/25 hover:bg-white/[0.03]"
                    >
                      <div
                        className="absolute -top-2.5 start-4 flex h-6 w-9 items-center justify-center rounded-md border border-kpmg-glow/25 bg-[#0f0f0f] font-display text-[10px] font-bold tracking-[0.1em] text-kpmg-glow"
                      >
                        {String(idx + 1).padStart(2, "0")}
                      </div>
                      <h5 className="mt-2 font-display text-[12px] font-bold tracking-[0.14em] text-white uppercase">
                        {phase.name}
                      </h5>
                      <p className="mt-2 text-[12.5px] leading-relaxed text-white/45">
                        {phase.caption}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bulletList.length > 0 && (
              <div className="mt-10">
                <div className="flex items-baseline gap-3">
                  <h4 className="font-display text-[10px] font-bold tracking-[0.28em] text-kpmg-glow uppercase">
                    {t("services.deliverablesLabel")}
                  </h4>
                  <span className="h-px flex-1 bg-gradient-to-r from-kpmg-glow/30 to-transparent rtl:bg-gradient-to-l" />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {bulletList.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 transition-all duration-300 hover:border-kpmg-glow/20 hover:bg-white/[0.03]"
                    >
                      <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-kpmg/12 text-kpmg-glow">
                        <CheckCircle2 size={14} strokeWidth={2} />
                      </span>
                      <span className="text-[13.5px] leading-relaxed text-white/70">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Services section. Reads the service catalogue and resolves
 * each item's title/description against the active locale. Cards open
 * a modal with longer copy and a deliverables list.
 */
function Services() {
  const t = useT();
  const [ref, inView] = useInView();
  const [selected, setSelected] = useState(null);

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
                learnMoreLabel={t("services.learnMoreLabel")}
                onClick={() => setSelected(service)}
              />
            </div>
          ))}
        </div>
      </div>

      <ServiceDetailModal service={selected} onClose={() => setSelected(null)} />
    </section>
  );
}

/* ═══════════════════════════════════════════
   PRODUCTS
   ═══════════════════════════════════════════ */

/**
 * Single product tile. Clicking opens the product detail modal via the
 * supplied `onClick` handler. The modal — not the card — exposes the
 * "Open Application" CTA.
 */
function ProductCard({ icon: Icon, title, description, status, learnMoreLabel, isLive, onClick }) {
  const inner = (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border p-7 text-start transition-all duration-500 lg:p-8 ${
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

      {/* Learn more link */}
      {isLive && (
        <div className="mt-6 flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] text-accent/60 uppercase transition-colors duration-300 group-hover:text-accent">
          {learnMoreLabel}
          <ArrowRight
            size={13}
            className="transition-transform duration-300 group-hover:translate-x-0.5 rtl:-scale-x-100"
          />
        </div>
      )}
    </div>
  );

  if (isLive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block w-full h-full text-start cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] rounded-2xl"
      >
        {inner}
      </button>
    );
  }
  return inner;
}

/**
 * Modal overlay that surfaces a single product's details: hero band with
 * launch CTA, problem/solution columns, screenshots, and video. Closes on
 * backdrop click, Escape, and the close button. Locks body scroll while open.
 * Render with `product={null}` to keep dismissed.
 */
function ProductDetailModal({ product, onClose }) {
  const t = useT();
  const { lang } = useI18n();
  // null = lightbox closed; integer = the index of the screenshot being
  // viewed full-size. Lightbox renders as a sibling overlay above the modal.
  const [lightboxIdx, setLightboxIdx] = useState(null);

  // Esc-to-close + arrow-key navigation + body-scroll lock. Esc collapses
  // the lightbox first if it's open, otherwise closes the modal — matches
  // the user's mental model of "back out one layer at a time".
  useEffect(() => {
    if (!product) return;
    const screenshots = product.screenshots || [];
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (lightboxIdx !== null) setLightboxIdx(null);
        else onClose();
      } else if (lightboxIdx !== null && screenshots.length > 1) {
        if (e.key === "ArrowLeft") {
          setLightboxIdx((i) => (i - 1 + screenshots.length) % screenshots.length);
        } else if (e.key === "ArrowRight") {
          setLightboxIdx((i) => (i + 1) % screenshots.length);
        }
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [product, onClose, lightboxIdx]);

  // Reset the lightbox whenever the modal opens for a different product so
  // the next click on screenshots doesn't surface a stale index.
  useEffect(() => {
    setLightboxIdx(null);
  }, [product?.id]);

  if (!product) return null;

  const Icon = getProductIcon(product.icon_name);
  const pick = (field) => product[`${field}_${lang}`] || product[`${field}_en`];
  const title = pick("title");
  const description = pick("description");

  // Phases + deliverables now come from the product row (admin-editable in
  // the management page). Fall back to the English copy when the active
  // locale is empty, then to an empty array — sections without content
  // quietly hide.
  const pickList = (field) => {
    const localised = product[`${field}_${lang}`];
    if (Array.isArray(localised) && localised.length > 0) return localised;
    const fallback = product[`${field}_en`];
    return Array.isArray(fallback) ? fallback : [];
  };
  const phaseList = pickList("phases");
  const deliverableList = pickList("deliverables");

  const hasScreenshots = Array.isArray(product.screenshots) && product.screenshots.length > 0;

  // Inline SVG dot pattern for the hero band — matches the service modal so
  // the two surfaces feel like the same component family.
  const dotPattern = {
    backgroundImage:
      "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
    backgroundSize: "22px 22px",
  };

  return (
    <>
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 sm:px-6"
    >
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f0f0f] shadow-2xl shadow-black/60 animate-[scaleIn_240ms_cubic-bezier(0.16,1,0.3,1)]">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("services.closeLabel")}
          className="absolute end-5 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-black/40 text-white/60 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-black/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 cursor-pointer"
        >
          <X size={16} strokeWidth={2} />
        </button>

        <div className="max-h-[88vh] overflow-y-auto">
          {/* Hero band — gradient backdrop + icon + status + launch CTA */}
          <div className="relative overflow-hidden border-b border-white/[0.06] bg-gradient-to-br from-accent/[0.16] via-accent/[0.04] to-transparent px-8 pt-10 pb-9 sm:px-10 sm:pt-12 sm:pb-10">
            <div
              className="absolute inset-0 opacity-60"
              style={dotPattern}
              aria-hidden="true"
            />
            <div
              className="absolute -top-20 -end-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative flex items-start gap-5">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border border-accent/25 bg-accent/15 text-accent shadow-lg shadow-accent/20">
                <Icon size={30} strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-display text-[10px] font-bold tracking-[0.28em] text-accent uppercase">
                    {t("products.eyebrow")}
                  </span>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-bold tracking-[0.12em] text-emerald-400 uppercase">
                    {t("products.statusLive")}
                  </span>
                </div>
                <h3
                  id="product-modal-title"
                  className="mt-2 font-display text-2xl font-extrabold tracking-[-0.01em] text-white sm:text-3xl"
                >
                  {title}
                </h3>
              </div>
            </div>

            <p className="relative mt-5 max-w-3xl text-sm leading-relaxed text-white/55 sm:text-[15px]">
              {description}
            </p>

            <div className="relative mt-6 flex flex-wrap items-center gap-3">
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 rounded-full bg-accent px-7 py-3 font-display text-[12px] font-bold tracking-[0.08em] text-white uppercase transition-all duration-300 hover:bg-medium-blue hover:shadow-xl hover:shadow-accent/20"
              >
                {t("productDetail.openApp")}
                <ArrowUpRight
                  size={14}
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </a>

              {/* Download button — temporarily hidden via the leading
                  `false &&` while the PPT upload flow is still in
                  development. To re-enable: drop the `false &&`. The
                  underlying backend endpoint and admin-form upload
                  widget stay live regardless of this flag. */}
              {false && product.ppt_filename && (
                <a
                  href={`/auth/api/products/${product.slug}/ppt`}
                  download={product.ppt_filename}
                  className="group inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 font-display text-[12px] font-bold tracking-[0.08em] text-white uppercase transition-all duration-300 hover:border-accent/30 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-accent/10"
                >
                  <Download
                    size={14}
                    className="transition-transform duration-300 group-hover:translate-y-0.5"
                  />
                  {t("products.modal.downloadPresentation")}
                </a>
              )}
            </div>
          </div>

          {/* Body — How it works + Capabilities + Sample screenshots */}
          <div className="px-8 py-9 sm:px-10 sm:py-10">
            {phaseList.length > 0 && (
              <div>
                <div className="flex items-baseline gap-3">
                  <h4 className="font-display text-[10px] font-bold tracking-[0.28em] text-accent uppercase">
                    {t("products.modal.approachLabel")}
                  </h4>
                  <span className="h-px flex-1 bg-gradient-to-r from-accent/30 to-transparent rtl:bg-gradient-to-l" />
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {phaseList.map((phase, idx) => (
                    <div
                      key={idx}
                      className="group relative rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 transition-all duration-300 hover:border-accent/25 hover:bg-white/[0.03]"
                    >
                      <div className="absolute -top-2.5 start-4 flex h-6 w-9 items-center justify-center rounded-md border border-accent/25 bg-[#0f0f0f] font-display text-[10px] font-bold tracking-[0.1em] text-accent">
                        {String(idx + 1).padStart(2, "0")}
                      </div>
                      <h5 className="mt-2 font-display text-[12px] font-bold tracking-[0.14em] text-white uppercase">
                        {phase.name}
                      </h5>
                      <p className="mt-2 text-[12.5px] leading-relaxed text-white/45">
                        {phase.caption}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {deliverableList.length > 0 && (
              <div className="mt-10">
                <div className="flex items-baseline gap-3">
                  <h4 className="font-display text-[10px] font-bold tracking-[0.28em] text-accent uppercase">
                    {t("products.modal.deliverablesLabel")}
                  </h4>
                  <span className="h-px flex-1 bg-gradient-to-r from-accent/30 to-transparent rtl:bg-gradient-to-l" />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {deliverableList.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 transition-all duration-300 hover:border-accent/20 hover:bg-white/[0.03]"
                    >
                      <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
                        <CheckCircle2 size={14} strokeWidth={2} />
                      </span>
                      <span className="text-[13.5px] leading-relaxed text-white/70">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sample screenshots — 2x2 grid. Real screenshots when present;
                otherwise four styled browser-window mockup tiles so the
                section feels finished even before media exists. */}
            <div className="mt-10">
              <div className="flex items-baseline gap-3">
                <h4 className="font-display text-[10px] font-bold tracking-[0.28em] text-accent uppercase">
                  {t("products.modal.screenshotsLabel")}
                </h4>
                <span className="h-px flex-1 bg-gradient-to-r from-accent/30 to-transparent rtl:bg-gradient-to-l" />
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {hasScreenshots
                  ? product.screenshots.map((src, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setLightboxIdx(i)}
                        className="group/thumb relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0a0a] transition-all duration-300 hover:border-accent/35 hover:shadow-lg hover:shadow-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 cursor-zoom-in"
                        aria-label={`Open screenshot ${i + 1} full-size`}
                      >
                        <img
                          src={src}
                          alt={`${title} screenshot ${i + 1}`}
                          className="aspect-video w-full object-cover transition-transform duration-500 group-hover/thumb:scale-[1.03]"
                          loading="lazy"
                        />
                        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover/thumb:bg-black/35 group-hover/thumb:opacity-100">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/50 text-white backdrop-blur-sm">
                            <Maximize2 size={16} strokeWidth={2} />
                          </span>
                        </span>
                      </button>
                    ))
                  : Array.from({ length: 4 }).map((_, i) => (
                      <ScreenshotPlaceholder key={i} variant={i} />
                    ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Lightbox — sibling of the product dialog so its z-index stacks on
        top. Rendered conditionally when a screenshot is selected. */}
    {hasScreenshots && lightboxIdx !== null && (
      <ScreenshotLightbox
        images={product.screenshots}
        idx={lightboxIdx}
        title={title}
        onClose={() => setLightboxIdx(null)}
        onPrev={() =>
          setLightboxIdx(
            (i) => (i - 1 + product.screenshots.length) % product.screenshots.length
          )
        }
        onNext={() =>
          setLightboxIdx((i) => (i + 1) % product.screenshots.length)
        }
        closeLabel={t("services.closeLabel")}
      />
    )}
    </>
  );
}

/**
 * Full-screen image viewer. Renders above the product modal at z-110 with
 * a darker backdrop, prev/next chevrons, a counter pill, and close button.
 * Keyboard handling (Esc, Arrow keys) lives in the parent so it can decide
 * whether Esc collapses the lightbox or the modal beneath. Click on the
 * backdrop closes; clicks on the image itself do not propagate.
 */
function ScreenshotLightbox({ images, idx, title, onClose, onPrev, onNext, closeLabel }) {
  const src = images[idx];
  const hasMany = images.length > 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Screenshot viewer"
      className="fixed inset-0 z-[110] flex items-center justify-center px-4 py-6 sm:px-12 sm:py-10 animate-[fadeIn_180ms_ease-out]"
    >
      <div
        className="absolute inset-0 bg-black/92 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        className="absolute end-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/75 backdrop-blur-sm transition-all duration-200 hover:border-white/30 hover:bg-black/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 cursor-pointer"
      >
        <X size={18} strokeWidth={2} />
      </button>

      {hasMany && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          aria-label="Previous screenshot"
          className="absolute start-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/75 backdrop-blur-sm transition-all duration-200 hover:border-white/30 hover:bg-black/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:flex cursor-pointer"
        >
          <ChevronLeft size={22} strokeWidth={2} className="rtl:-scale-x-100" />
        </button>
      )}

      <img
        src={src}
        alt={`${title} screenshot ${idx + 1}`}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[88vh] max-w-[95vw] rounded-lg object-contain shadow-2xl shadow-black/80 animate-[scaleIn_220ms_cubic-bezier(0.16,1,0.3,1)]"
      />

      {hasMany && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          aria-label="Next screenshot"
          className="absolute end-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/75 backdrop-blur-sm transition-all duration-200 hover:border-white/30 hover:bg-black/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:flex cursor-pointer"
        >
          <ChevronRight size={22} strokeWidth={2} className="rtl:-scale-x-100" />
        </button>
      )}

      <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-black/55 px-3.5 py-1 font-display text-[10px] font-bold tracking-[0.18em] text-white/75 uppercase backdrop-blur-sm tabular-nums">
        {String(idx + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
      </span>
    </div>
  );
}

/**
 * Stylised browser-window mockup used as a screenshot placeholder. Renders a
 * faux browser chrome (three traffic-light dots + URL bar) and abstract
 * content lines so the modal feels finished before real screenshots exist.
 * The `variant` index gently rotates the layout so a 2x2 grid doesn't look
 * identical across cells.
 */
function ScreenshotPlaceholder({ variant = 0 }) {
  // Four pre-mixed layout/tint combinations. Picked so adjacent cells in the
  // grid (variants 0/1 in the top row, 2/3 in the bottom) have distinct
  // accents and content shapes without going visually busy.
  const layouts = [
    { tint: "from-accent/[0.08]", bars: [80, 55, 70] },
    { tint: "from-kpmg/[0.08]", bars: [70, 90, 50] },
    { tint: "from-emerald-500/[0.06]", bars: [60, 75, 85] },
    { tint: "from-violet/[0.08]", bars: [90, 60, 70] },
  ];
  const layout = layouts[variant % layouts.length];

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br ${layout.tint} via-[#0d0d0d] to-[#0a0a0a] transition-all duration-300 hover:border-white/[0.12]`}
    >
      <div className="aspect-video w-full">
        {/* Faux browser chrome */}
        <div className="flex items-center gap-1.5 border-b border-white/[0.05] bg-black/30 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-white/15" />
          <span className="h-2 w-2 rounded-full bg-white/10" />
          <span className="h-2 w-2 rounded-full bg-white/[0.06]" />
          <span className="ms-2 h-1.5 flex-1 rounded-full bg-white/[0.04]" />
        </div>

        {/* Abstract content body */}
        <div className="flex h-[calc(100%-2rem)] flex-col gap-2.5 p-4">
          <div className="flex items-center gap-2">
            <span className="h-5 w-5 rounded-md bg-white/[0.06]" />
            <span className="h-2 w-24 rounded-full bg-white/[0.08]" />
          </div>
          <div className="mt-1 space-y-1.5">
            {layout.bars.map((width, i) => (
              <span
                key={i}
                className="block h-1.5 rounded-full bg-white/[0.05]"
                style={{ width: `${width}%` }}
              />
            ))}
          </div>
          <div className="mt-auto flex gap-2">
            <span className="h-6 w-16 rounded-md bg-accent/[0.15]" />
            <span className="h-6 w-12 rounded-md bg-white/[0.04]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Products section. Fetches the visible-products list from the auth-service
 * on mount and renders each as a card. Falls back gracefully (empty list)
 * if the request fails so the rest of the page still renders.
 */
function Products() {
  const t = useT();
  const { lang } = useI18n();
  const [ref, inView] = useInView();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  // `null` represents the "All Industries" pill — every product passes the
  // filter. Otherwise an industry slug from data/industries.js.
  const [industryFilter, setIndustryFilter] = useState(null);

  useEffect(() => {
    apiGetProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  // Pick a per-row text field in the active locale, falling back to English.
  const pick = (p, field) => p[`${field}_${lang}`] || p[`${field}_en`];

  // Apply the industry filter. A product with no industries assigned is
  // treated as "general" — visible under "All Industries" only, not under
  // any specific industry filter. This avoids untagged legacy products
  // accidentally polluting every industry view.
  const filteredProducts = industryFilter
    ? products.filter(
        (p) => Array.isArray(p.industries) && p.industries.includes(industryFilter)
      )
    : products;

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

        {/* Industry filter pills. Single-select with explicit "All"
            default — clicking "All" or the active pill again clears the
            filter. Order matches data/industries.js. */}
        <Reveal delay={280}>
          <div className="mt-10 flex flex-wrap items-center gap-2">
            <span className="me-2 font-display text-[10px] font-bold tracking-[0.22em] text-white/30 uppercase">
              {t("industries.filterLabel")}
            </span>
            <IndustryPill
              active={industryFilter === null}
              label={t("industries.all")}
              onClick={() => setIndustryFilter(null)}
            />
            {INDUSTRIES.map((slug) => (
              <IndustryPill
                key={slug}
                active={industryFilter === slug}
                label={t(`industries.${slug}`)}
                onClick={() =>
                  setIndustryFilter((cur) => (cur === slug ? null : slug))
                }
              />
            ))}
          </div>
        </Reveal>

        <div
          ref={ref}
          className="mt-10 grid gap-5 grid-cols-1"
        >
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.015] px-6 py-14 text-center">
              <p className="text-[13px] text-white/40">
                {t("products.noResultsForIndustry")}
              </p>
            </div>
          ) : (
            filteredProducts.map((product, i) => (
              <div
                key={product.id}
                className={`transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  inView
                    ? "translate-y-0 opacity-100"
                    : "translate-y-10 opacity-0"
                }`}
                style={{ transitionDelay: inView ? `${i * 100}ms` : "0ms" }}
              >
                <ProductCard
                  icon={getProductIcon(product.icon_name)}
                  isLive={true}
                  title={pick(product, "title")}
                  description={pick(product, "description")}
                  status={t("products.statusLive")}
                  learnMoreLabel={t("products.learnMore")}
                  onClick={() => setSelected(product)}
                />
              </div>
            ))
          )}
        </div>
      </div>

      <ProductDetailModal product={selected} onClose={() => setSelected(null)} />
    </section>
  );
}

/**
 * Pill button used in the industry filter strip. Single-select semantics —
 * the parent decides what "active" means; this component just renders the
 * two visual states.
 */
function IndustryPill({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 font-display text-[11px] font-bold tracking-[0.08em] uppercase transition-all duration-200 cursor-pointer ${
        active
          ? "border-accent/40 bg-accent/[0.12] text-accent shadow-[0_0_0_3px_rgba(0,145,218,0.06)]"
          : "border-white/[0.08] bg-white/[0.015] text-white/45 hover:border-white/15 hover:bg-white/[0.04] hover:text-white/75"
      }`}
    >
      {label}
    </button>
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
