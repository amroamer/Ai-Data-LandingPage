import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, ImageOff, Film } from "lucide-react";
import UserMenu from "../components/UserMenu";
import { useAuth } from "../context/AuthContext";
import { useI18n, useT } from "../i18n/i18n";
import { getProductIcon } from "../data/icons";
import { apiGetProduct } from "../api/auth";

/**
 * Detail page for a single product. Reads the slug from the URL, fetches
 * the product from the auth-service, and renders bilingual description,
 * problem, solution, screenshots gallery (with placeholder), embedded
 * video (with placeholder), and a launch button.
 *
 * Possible states:
 *   - `loading` — initial fetch in flight; renders a centered spinner.
 *   - product object — normal render path.
 *   - 404 / hidden — redirects to the home route.
 */
export default function ProductDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const t = useT();
  const { lang } = useI18n();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    apiGetProduct(slug)
      .then(setProduct)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
      </div>
    );
  }
  if (notFound || !product) return <Navigate to="/" replace />;

  // Pick text fields in the active locale, falling back to English.
  const pick = (field) => product[`${field}_${lang}`] || product[`${field}_en`];
  const Icon = getProductIcon(product.icon_name);

  const hasScreenshots = Array.isArray(product.screenshots) && product.screenshots.length > 0;
  const hasVideo = !!product.video_url;

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-body antialiased text-white">
      {/* ── Top bar ── */}
      <nav className="sticky top-0 z-40 border-b border-white/[0.04] bg-[#0a0a0a]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link
            to="/"
            className="flex items-center gap-2 text-[13px] font-medium text-white/40 transition-colors hover:text-white"
          >
            <ArrowLeft size={14} />
            {t("productDetail.back")}
          </Link>
          <div className="flex items-center gap-4">
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-[11px] font-bold tracking-[0.08em] text-white uppercase transition-all duration-300 hover:bg-medium-blue hover:shadow-lg hover:shadow-accent/15"
            >
              {t("productDetail.openApp")}
              <ArrowUpRight size={13} />
            </a>
            {user && <UserMenu variant="bold" />}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-white/[0.04]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 70% 30%, rgba(0, 51, 141, 0.12) 0%, transparent 70%), linear-gradient(180deg, #0d1117 0%, #0a0a0a 100%)",
          }}
        />
        <div className="absolute -top-[15%] right-[5%] h-[500px] w-[500px] rounded-full opacity-50"
          style={{ background: "radial-gradient(circle, rgba(0, 145, 218, 0.08) 0%, transparent 70%)" }}
        />

        <div className="relative mx-auto max-w-5xl px-6 py-20 lg:px-10 lg:py-28">
          <div className="flex flex-col items-start gap-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/15 bg-accent/[0.08]">
              <Icon size={32} strokeWidth={1.5} className="text-accent" />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold tracking-[0.12em] text-emerald-400 uppercase">
                {t("products.statusLive")}
              </span>
            </div>

            <h1 className="font-display text-3xl font-extrabold uppercase tracking-[-0.02em] sm:text-4xl lg:text-5xl">
              {pick("title")}
            </h1>

            <p className="max-w-3xl text-base leading-relaxed text-white/55 lg:text-lg">
              {pick("description")}
            </p>

            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-full bg-accent px-7 py-3.5 font-display text-[12px] font-bold tracking-[0.08em] text-white uppercase transition-all duration-300 hover:bg-medium-blue hover:shadow-xl hover:shadow-accent/20 sm:hidden"
            >
              {t("productDetail.openApp")}
              <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* ── Problem & solution ── */}
      <section className="mx-auto max-w-5xl px-6 py-20 lg:px-10 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-8 lg:p-10">
            <span className="font-display text-[10px] font-semibold tracking-[0.35em] text-amber-400/70 uppercase">
              {t("productDetail.problemEyebrow")}
            </span>
            <h2 className="mt-4 font-display text-xl font-bold uppercase tracking-[-0.01em] sm:text-2xl">
              {t("productDetail.problemTitle")}
            </h2>
            <p className="mt-5 text-[14px] leading-relaxed text-white/45 lg:text-[15px]">
              {pick("problem")}
            </p>
          </div>

          <div className="rounded-2xl border border-accent/15 bg-accent/[0.04] p-8 lg:p-10">
            <span className="font-display text-[10px] font-semibold tracking-[0.35em] text-accent/80 uppercase">
              {t("productDetail.solutionEyebrow")}
            </span>
            <h2 className="mt-4 font-display text-xl font-bold uppercase tracking-[-0.01em] sm:text-2xl">
              {t("productDetail.solutionTitle")}
            </h2>
            <p className="mt-5 text-[14px] leading-relaxed text-white/55 lg:text-[15px]">
              {pick("solution")}
            </p>
          </div>
        </div>
      </section>

      {/* ── Screenshots ── */}
      <section className="border-t border-white/[0.04] bg-[#0d0d0d]">
        <div className="mx-auto max-w-5xl px-6 py-20 lg:px-10 lg:py-24">
          <span className="font-display text-[10px] font-semibold tracking-[0.35em] text-accent/60 uppercase">
            {t("productDetail.screenshotsEyebrow")}
          </span>
          <h2 className="mt-4 font-display text-2xl font-extrabold uppercase tracking-[-0.02em] sm:text-3xl">
            {t("productDetail.screenshotsTitle")}
          </h2>

          {hasScreenshots ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {product.screenshots.map((src, i) => (
                <div
                  key={src}
                  className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0a]"
                >
                  <img
                    src={src}
                    alt={`${pick("title")} screenshot ${i + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-[#0a0a0a] py-20 text-center">
              <ImageOff size={32} className="text-white/20" strokeWidth={1.5} />
              <p className="mt-4 text-[13px] font-medium text-white/35">
                {t("productDetail.screenshotsPlaceholder")}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Video ── */}
      <section className="border-t border-white/[0.04]">
        <div className="mx-auto max-w-5xl px-6 py-20 lg:px-10 lg:py-24">
          <span className="font-display text-[10px] font-semibold tracking-[0.35em] text-accent/60 uppercase">
            {t("productDetail.videoEyebrow")}
          </span>
          <h2 className="mt-4 font-display text-2xl font-extrabold uppercase tracking-[-0.02em] sm:text-3xl">
            {t("productDetail.videoTitle")}
          </h2>

          {hasVideo ? (
            <div className="mt-10 overflow-hidden rounded-2xl border border-white/[0.06] bg-black">
              <div className="aspect-video w-full">
                <iframe
                  src={product.video_url}
                  title={pick("title")}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          ) : (
            <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-[#0a0a0a] py-20 text-center">
              <Film size={32} className="text-white/20" strokeWidth={1.5} />
              <p className="mt-4 text-[13px] font-medium text-white/35">
                {t("productDetail.videoPlaceholder")}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="border-t border-white/[0.04]">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center lg:px-10 lg:py-24">
          <h3 className="font-display text-2xl font-extrabold uppercase tracking-[-0.02em] sm:text-3xl">
            {t("productDetail.ctaHeadline")}
          </h3>
          <p className="mx-auto mt-5 max-w-xl text-[14px] leading-relaxed text-white/40 lg:text-base">
            {t("productDetail.ctaDescription")}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2.5 rounded-full bg-accent px-8 py-4 font-display text-[12px] font-bold tracking-[0.08em] text-white uppercase transition-all duration-300 hover:bg-medium-blue hover:shadow-xl hover:shadow-accent/20"
            >
              {t("productDetail.openApp")}
              <ArrowUpRight
                size={14}
                className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </a>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-8 py-4 font-display text-[12px] font-bold tracking-[0.08em] text-white uppercase transition-all duration-300 hover:border-white/30 hover:bg-white/[0.04]"
            >
              <ArrowLeft size={14} />
              {t("productDetail.back")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
