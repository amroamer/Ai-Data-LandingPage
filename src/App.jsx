import { useState, useEffect } from "react";
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
  ArrowUpRight,
  Menu,
  X,
  ChevronDown,
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
    icon: DatabaseZap,
    title: "Data Owner Agent",
    description:
      "An intelligent assistant that helps data owners manage classification, business definitions, quality rules, and PII detection across their data assets.",
    url: "https://dna-agent.uaenorth.cloudapp.azure.com",
    status: "Live",
  },
  {
    icon: Warehouse,
    title: "Data Platform",
    description:
      "A centralized, governed data platform for ingestion, transformation, cataloging, and serving — built for Saudi enterprise scale.",
    url: "#",
    status: "Coming Soon",
  },
  {
    icon: ShieldCheck,
    title: "Compliance Assessment Agent",
    description:
      "Automated regulatory compliance checker against Saudi frameworks (NDMO, PDPL, SAMA, DGA, SDAIA).",
    url: "#",
    status: "Coming Soon",
  },
];

function Navbar() {
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
          ? "bg-navy/95 backdrop-blur-md shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between lg:h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-kpmg">
              <span className="text-sm font-bold tracking-tight text-white">
                K
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight text-white">
                KPMG
              </span>
              <span className="text-[10px] font-medium tracking-wider text-blue-300 uppercase">
                AI & Data
              </span>
            </div>
          </a>

          {/* Desktop Links */}
          <div className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-blue-200/80 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#products"
              className="rounded-lg bg-kpmg px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-kpmg-dark hover:shadow-lg hover:shadow-kpmg/25"
            >
              Explore Products
            </a>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-white md:hidden"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="border-t border-white/10 pb-6 md:hidden">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-3 text-sm font-medium text-blue-200/80 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#products"
              onClick={() => setMobileOpen(false)}
              className="mt-2 inline-block rounded-lg bg-kpmg px-5 py-2 text-sm font-semibold text-white"
            >
              Explore Products
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-navy">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-kpmg/15 via-navy to-navy" />
        <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-kpmg/5 blur-[128px]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[96px]" />
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-32 lg:px-8 lg:py-40">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-kpmg/30 bg-kpmg/10 px-4 py-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-medium tracking-wide text-blue-300 uppercase">
              Digital Foundation
            </span>
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Transforming Saudi Arabia's{" "}
            <span className="bg-gradient-to-r from-blue-400 to-kpmg bg-clip-text text-transparent">
              Digital Future
            </span>{" "}
            with AI
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-blue-200/70 sm:text-xl">
            KPMG's AI & Data practice delivers enterprise-grade artificial
            intelligence — from strategy through implementation — to
            organizations shaping the Kingdom's transformation.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#services"
              className="group inline-flex items-center gap-2 rounded-xl bg-kpmg px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-kpmg-dark hover:shadow-xl hover:shadow-kpmg/20"
            >
              Our Services
              <ChevronDown
                size={16}
                className="transition-transform group-hover:translate-y-0.5"
              />
            </a>
            <a
              href="#products"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/30 hover:bg-white/5"
            >
              View Products
            </a>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-navy-light to-transparent" />
    </section>
  );
}

function ServiceCard({ icon: Icon, title, description, index }) {
  return (
    <div
      className={`group relative rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent p-8 transition-all duration-300 hover:-translate-y-1 hover:border-kpmg/30 hover:shadow-2xl hover:shadow-kpmg/10 ${
        index === 4 ? "md:col-start-2 lg:col-start-auto" : ""
      }`}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-kpmg/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-kpmg/10 text-blue-400 transition-colors group-hover:bg-kpmg/20 group-hover:text-blue-300">
          <Icon size={24} strokeWidth={1.5} />
        </div>

        <h3 className="mb-3 text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm leading-relaxed text-blue-200/50">
          {description}
        </p>
      </div>
    </div>
  );
}

function Services() {
  return (
    <section id="services" className="relative bg-navy-light py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-16 max-w-2xl">
          <span className="text-xs font-semibold tracking-widest text-kpmg uppercase">
            What We Do
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Our Services
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-blue-200/50">
            Five integrated service pillars that take organizations from AI
            ambition to enterprise-scale impact.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <ServiceCard key={service.title} {...service} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ icon: Icon, title, description, url, status }) {
  const isLive = status === "Live";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl sm:flex-row ${
        isLive
          ? "border-kpmg/20 bg-gradient-to-r from-navy-lighter to-navy-light hover:border-kpmg/40 hover:shadow-kpmg/10"
          : "border-white/[0.06] bg-navy-lighter/50 hover:border-white/10 hover:shadow-black/20"
      }`}
    >
      {/* Icon Area */}
      <div
        className={`flex shrink-0 items-center justify-center p-8 sm:w-48 sm:p-10 ${
          isLive ? "bg-kpmg/[0.07]" : "bg-white/[0.02]"
        }`}
      >
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${
            isLive
              ? "bg-kpmg/15 text-blue-400"
              : "bg-white/[0.05] text-blue-200/40"
          }`}
        >
          <Icon size={32} strokeWidth={1.5} />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-center p-6 sm:p-8">
        <div className="mb-3 flex items-center gap-3">
          <h3
            className={`text-lg font-semibold ${
              isLive ? "text-white" : "text-white/70"
            }`}
          >
            {title}
          </h3>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
              isLive
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-amber-500/15 text-amber-400"
            }`}
          >
            {status}
          </span>
        </div>
        <p
          className={`text-sm leading-relaxed ${
            isLive ? "text-blue-200/50" : "text-blue-200/35"
          }`}
        >
          {description}
        </p>

        {isLive && (
          <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-kpmg transition-colors group-hover:text-blue-400">
            Launch Application
            <ArrowUpRight
              size={14}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </div>
        )}
      </div>
    </a>
  );
}

function Products() {
  return (
    <section id="products" className="relative bg-navy py-24 lg:py-32">
      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-kpmg/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-16 max-w-2xl">
          <span className="text-xs font-semibold tracking-widest text-kpmg uppercase">
            What We Build
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Our Products
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-blue-200/50">
            Purpose-built applications and platforms designed to accelerate AI
            adoption across Saudi enterprises.
          </p>
        </div>

        {/* Product Cards */}
        <div className="grid gap-5">
          {products.map((product) => (
            <ProductCard key={product.title} {...product} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer
      id="footer"
      className="border-t border-white/[0.06] bg-navy-light py-10"
    >
      <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
        <p className="text-sm text-blue-200/40">
          &copy; 2026 KPMG Saudi Arabia &mdash; Digital Foundation, AI & Data
        </p>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-navy font-sans antialiased">
      <Navbar />
      <Hero />
      <Services />
      <Products />
      <Footer />
    </div>
  );
}
