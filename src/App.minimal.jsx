import { useState, useEffect, useRef } from "react";
import UserMenu from "./components/UserMenu";
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
  BadgeCheck,
  Cloud,
  ArrowUpRight,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";

const services = [
  {
    icon: Brain,
    title: "AI Readiness Assessment",
    description:
      "Evaluate your organization's maturity, infrastructure, talent, and governance readiness to adopt AI at scale.",
  },
  {
    icon: Route,
    title: "AI Strategies",
    description:
      "Define a tailored AI roadmap aligned with your national and organizational objectives, from vision to execution.",
  },
  {
    icon: Server,
    title: "AI Platforms",
    description:
      "Design and implement enterprise-grade AI platforms that enable scalable model development, deployment, and monitoring.",
  },
  {
    icon: Factory,
    title: "AI Factories",
    description:
      "Operationalize AI delivery through industrialized, repeatable frameworks — from data pipelines to model lifecycle management.",
  },
  {
    icon: Lightbulb,
    title: "AI Solutions",
    description:
      "Deliver purpose-built AI applications that solve real business problems — from intelligent automation to predictive analytics.",
  },
  {
    icon: Cloud,
    title: "Cloud",
    description:
      "Architect and manage secure, scalable cloud infrastructure — from migration strategy to multi-cloud governance and cost optimization.",
  },
];

const products = [
  {
    icon: Presentation,
    title: "Slides Generator",
    description:
      "AI-powered presentation builder that transforms briefs into polished, brand-compliant KPMG slide decks in seconds.",
    url: "https://digital-foundation.uaenorth.cloudapp.azure.com/slide-generator/login",
    status: "Live",
  },
  {
    icon: Warehouse,
    title: "Sahab Data Platform",
    description:
      "A centralized, governed data platform for ingestion, transformation, cataloging, and serving — built for Saudi enterprise scale.",
    url: "https://digital-foundation.uaenorth.cloudapp.azure.com/cloudsahab/",
    status: "Live",
  },
  {
    icon: DatabaseZap,
    title: "Data Owner Agent",
    description:
      "An intelligent assistant that helps data owners manage classification, business definitions, quality rules, and PII detection across their data assets.",
    url: "https://digital-foundation.uaenorth.cloudapp.azure.com/dataowner/",
    status: "Live",
  },
  {
    icon: ShieldCheck,
    title: "Compliance Platform",
    description:
      "Automated regulatory compliance checker against Saudi frameworks (NDMO, PDPL, SAMA, DGA, SDAIA).",
    url: "https://digital-foundation.uaenorth.cloudapp.azure.com/AICompAgent/login",
    status: "Live",
  },
];

const heroStats = [
  { value: "50+", label: "Solutions" },
  { value: "200+", label: "Models" },
  { value: "15+", label: "Organizations" },
  { value: "6", label: "Pillars" },
];

/* ─── Hooks ─── */

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

/* ─── Navbar ─── */

function Navbar({ user }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Services", href: "#services" },
    { label: "Products", href: "#products" },
    { label: "Contact", href: "#footer" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-warm-50/95 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between border-b border-warm-200/60">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-kpmg">
              <span className="text-sm font-bold text-white">K</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-warm-900">KPMG</span>
              <span className="text-[10px] font-medium tracking-[0.15em] text-kpmg uppercase">
                Digital Foundation
              </span>
            </div>
          </a>

          {/* Desktop nav */}
          <div className="hidden items-center gap-10 md:flex">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-warm-800/40 transition-colors hover:text-warm-900"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#products"
              className="rounded-lg border border-kpmg/80 px-5 py-2 text-sm font-semibold text-kpmg transition-all hover:bg-kpmg hover:text-white"
            >
              Explore Products
            </a>
            {user && <UserMenu variant="minimal" />}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-warm-900 md:hidden"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-b border-warm-200 bg-warm-50 py-6 md:hidden">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-3 text-sm font-medium text-warm-800/50 hover:text-warm-900"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#products"
              onClick={() => setMobileOpen(false)}
              className="mt-4 inline-block rounded-lg border border-kpmg px-5 py-2 text-sm font-semibold text-kpmg"
            >
              Explore Products
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}

/* ─── Hero ─── */

function Hero() {
  const [ref, inView] = useInView(0.1);

  return (
    <section className="relative flex min-h-screen items-center bg-warm-50 pt-20">
      <div
        ref={ref}
        className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32"
      >
        {/* Top label */}
        <div
          className={`mb-20 transition-all duration-700 ease-out ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <span className="text-xs font-semibold tracking-[0.25em] text-kpmg uppercase">
            Digital Foundation
          </span>
          <div className="mt-4 h-px w-16 bg-kpmg" />
        </div>

        {/* Two-column layout */}
        <div className="grid items-end gap-16 lg:grid-cols-5 lg:gap-24">
          {/* Left: Headline */}
          <div
            className={`lg:col-span-3 transition-all duration-700 ease-out delay-100 ${
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <h1 className="font-serif text-5xl font-light leading-[1.08] tracking-[-0.01em] text-warm-900 sm:text-6xl lg:text-7xl">
              Transforming
              <br />
              the Middle East's
              <br />
              <span className="text-kpmg italic">Digital Future</span>
              <br />
              with AI.
            </h1>
          </div>

          {/* Right: Description + CTAs */}
          <div
            className={`lg:col-span-2 transition-all duration-700 ease-out delay-200 ${
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <p className="text-lg leading-relaxed text-warm-800/55">
              KPMG's Digital Foundation practice delivers enterprise-grade artificial
              intelligence — from strategy through implementation — to
              organizations shaping the Middle East's transformation.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a
                href="#services"
                className="group inline-flex items-center gap-2 rounded-lg bg-kpmg px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-kpmg-dark"
              >
                Explore Services
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </a>
              <a
                href="#products"
                className="inline-flex items-center gap-2 rounded-lg border border-warm-300 px-6 py-3 text-sm font-semibold text-warm-900 transition-all hover:border-warm-800"
              >
                View Products
              </a>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div
          className={`mt-24 flex flex-wrap items-baseline gap-x-12 gap-y-6 transition-all duration-700 ease-out delay-300 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {heroStats.map((stat) => (
            <div key={stat.label} className="flex items-baseline gap-2.5">
              <span className="font-serif text-3xl text-warm-900">
                {stat.value}
              </span>
              <span className="text-xs font-medium tracking-[0.15em] text-warm-800/35 uppercase">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Rule */}
        <div
          className={`mt-16 h-px bg-warm-200 transition-all duration-1000 ease-out delay-500 origin-left ${
            inView ? "scale-x-100" : "scale-x-0"
          }`}
        />
      </div>
    </section>
  );
}

/* ─── Services ─── */

function ServiceCard({ icon: Icon, title, description, index }) {
  return (
    <div className="group border-t border-warm-200 pt-8 pb-8 transition-all duration-300 hover:border-kpmg/40">
      <span className="font-serif text-sm text-warm-300">
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="mt-6 flex h-10 w-10 items-center justify-center rounded-lg bg-kpmg/5 text-kpmg transition-colors group-hover:bg-kpmg/10">
        <Icon size={20} strokeWidth={1.5} />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-warm-900">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-warm-800/45">
        {description}
      </p>
    </div>
  );
}

function Services() {
  const [ref, inView] = useInView();

  return (
    <section id="services" className="bg-white py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div
          className={`mb-16 max-w-xl transition-all duration-700 ease-out ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <span className="text-xs font-semibold tracking-[0.25em] text-kpmg uppercase">
            What We Do
          </span>
          <h2 className="mt-4 font-serif text-4xl font-light text-warm-900 sm:text-5xl">
            Our Services
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-warm-800/45">
            Six integrated service pillars that take organizations from AI
            ambition to enterprise-scale impact.
          </p>
        </div>

        {/* Cards */}
        <div
          ref={ref}
          className="grid gap-x-12 gap-y-2 md:grid-cols-2 lg:grid-cols-3"
        >
          {services.map((service, i) => (
            <div
              key={service.title}
              className={`transition-all duration-700 ease-out ${
                inView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-5"
              }`}
              style={{ transitionDelay: inView ? `${i * 80}ms` : "0ms" }}
            >
              <ServiceCard {...service} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Products ─── */

function ProductCard({ icon: Icon, title, description, url, status }) {
  const isLive = status === "Live";
  const Wrapper = isLive ? "a" : "div";
  const wrapperProps = isLive
    ? { href: url, target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`group flex flex-col rounded-xl border p-6 transition-all duration-300 sm:flex-row sm:items-start sm:gap-6 ${
        isLive
          ? "border-warm-200 bg-white hover:border-kpmg/30 hover:shadow-lg hover:shadow-kpmg/[0.04] cursor-pointer"
          : "border-warm-200/60 bg-warm-100/50 cursor-default"
      }`}
    >
      {/* Icon */}
      <div
        className={`mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:mb-0 ${
          isLive ? "bg-kpmg/5 text-kpmg" : "bg-warm-200/50 text-warm-300"
        }`}
      >
        <Icon size={22} strokeWidth={1.5} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h3
            className={`font-semibold ${
              isLive ? "text-warm-900" : "text-warm-800/50"
            }`}
          >
            {title}
          </h3>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${
              isLive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-amber-50 text-amber-600"
            }`}
          >
            {status}
          </span>
        </div>
        <p
          className={`mt-1.5 text-sm leading-relaxed ${
            isLive ? "text-warm-800/45" : "text-warm-800/30"
          }`}
        >
          {description}
        </p>
      </div>

      {/* Arrow for live products */}
      {isLive && (
        <div className="mt-4 sm:mt-1">
          <ArrowUpRight
            size={18}
            className="text-kpmg/30 transition-all group-hover:text-kpmg group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </div>
      )}
    </Wrapper>
  );
}

function Products() {
  const [ref, inView] = useInView();

  return (
    <section id="products" className="relative bg-warm-50 py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div
          className={`mb-16 max-w-xl transition-all duration-700 ease-out ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <span className="text-xs font-semibold tracking-[0.25em] text-kpmg uppercase">
            What We Build
          </span>
          <h2 className="mt-4 font-serif text-4xl font-light text-warm-900 sm:text-5xl">
            Our Products
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-warm-800/45">
            Purpose-built applications and platforms designed to accelerate AI
            adoption across Saudi enterprises.
          </p>
        </div>

        {/* Product cards */}
        <div ref={ref} className="grid gap-4 md:grid-cols-2">
          {products.map((product, i) => (
            <div
              key={product.title}
              className={`transition-all duration-700 ease-out ${
                inView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-5"
              }`}
              style={{ transitionDelay: inView ? `${i * 80}ms` : "0ms" }}
            >
              <ProductCard {...product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─── */

function Footer() {
  return (
    <footer id="footer" className="bg-warm-900 py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-kpmg">
                <span className="text-sm font-bold text-white">K</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-white">KPMG</div>
                <div className="text-[10px] font-medium tracking-[0.15em] text-white/40 uppercase">
                  Digital Foundation
                </div>
              </div>
            </div>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/30">
              Enterprise-grade artificial intelligence — from strategy through
              implementation — for organizations shaping the Middle East's digital
              transformation.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-[10px] font-semibold tracking-[0.2em] text-white/25 uppercase">
              Navigation
            </h4>
            <div className="mt-5 space-y-3.5">
              <a
                href="#services"
                className="block text-sm text-white/45 transition-colors hover:text-white"
              >
                Services
              </a>
              <a
                href="#products"
                className="block text-sm text-white/45 transition-colors hover:text-white"
              >
                Products
              </a>
            </div>
          </div>

          {/* Capabilities */}
          <div>
            <h4 className="text-[10px] font-semibold tracking-[0.2em] text-white/25 uppercase">
              Capabilities
            </h4>
            <div className="mt-5 space-y-3.5">
              {services.map((s) => (
                <span
                  key={s.title}
                  className="block text-sm text-white/30"
                >
                  {s.title}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-white/10 pt-8">
          <p className="text-xs text-white/20">
            &copy; 2026 KPMG Middle East &mdash; Digital Foundation
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─── App ─── */

export default function MinimalApp({ user }) {
  return (
    <div className="min-h-screen bg-warm-50 font-sans antialiased">
      <Navbar user={user} />
      <Hero />
      <Services />
      <Products />
      <Footer />
    </div>
  );
}
