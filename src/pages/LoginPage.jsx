import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Globe } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useI18n, useT } from "../i18n/i18n";

/**
 * Login page. Renders a credentials form on the left and a decorative panel
 * on the right (visible at md+). On successful sign-in the user is sent to
 * the protected home route; if already signed in, redirect away immediately.
 */
export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const t = useT();
  const { lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  /**
   * Submit handler for the sign-in form. Wraps the async login call so the
   * button can show a spinner while the request is in flight, and surfaces
   * the server's error message on failure.
   */
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-[#d4d8e1] bg-white px-4 py-3 text-[14px] text-[#1a1a2e] placeholder:text-[#a0a4b0] focus:border-kpmg focus:outline-none focus:ring-2 focus:ring-kpmg/10 transition-colors";

  return (
    <div className="flex min-h-screen font-body">
      {/* ═══ LEFT — Form ═══ */}
      <div className="flex w-full flex-col justify-center px-5 py-8 sm:px-10 md:w-[55%] md:px-12 lg:w-[48%] lg:px-20 xl:px-28">
        <div
          className={`mx-auto w-full max-w-[400px] transition-all duration-700 ease-out ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {/* Logo + language switcher row */}
          <div className="mb-8 sm:mb-12 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-kpmg shadow-lg shadow-kpmg/15">
                <span className="font-display text-[14px] sm:text-[15px] font-extrabold text-white">{t("brand.logoMark")}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-display text-[14px] sm:text-[15px] font-bold tracking-[0.06em] text-[#1a1a2e] uppercase">
                  {t("brand.name")}
                </span>
                <span className="text-[9px] font-semibold tracking-[0.22em] text-kpmg/60 uppercase">
                  {t("brand.tagline")}
                </span>
              </div>
            </div>
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#d4d8e1] px-3 py-1.5 text-[11px] font-bold tracking-[0.06em] uppercase text-[#5a5d6a] hover:border-kpmg/40 hover:text-kpmg cursor-pointer transition-colors"
            >
              <Globe size={12} />
              {t("language.switchTo")}
            </button>
          </div>

          {/* Heading */}
          <h1 className="font-display text-[24px] sm:text-[28px] font-extrabold tracking-[-0.02em] text-[#1a1a2e]">
            {t("auth.login.title")}
          </h1>
          <p className="mt-2 text-[13px] sm:text-[14px] text-[#6b7084]">
            {t("auth.login.subtitle")}
          </p>

          {/* Error */}
          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#3a3d4a]">
                {t("auth.login.emailLabel")}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder={t("auth.login.emailPlaceholder")}
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[13px] font-semibold text-[#3a3d4a]">
                  {t("auth.login.passwordLabel")}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[12px] font-medium text-kpmg/70 transition-colors hover:text-kpmg"
                >
                  {t("auth.login.forgotPassword")}
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass + " pr-11"}
                  placeholder={t("auth.login.passwordPlaceholder")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#a0a4b0] transition-colors hover:text-[#5a5d6a]"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-kpmg py-3.5 text-[13px] font-bold tracking-[0.04em] text-white transition-all duration-200 hover:bg-kpmg-dark hover:shadow-lg hover:shadow-kpmg/20 disabled:opacity-50"
            >
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  {t("auth.login.submit")}
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[13px] text-[#8a8d9a]">
            {t("auth.login.noAccount")}{" "}
            <Link
              to="/signup"
              className="font-semibold text-kpmg transition-colors hover:text-kpmg-dark"
            >
              {t("auth.login.createAccount")}
            </Link>
          </p>

          {/* Footer */}
          <div className="mt-10 sm:mt-16 border-t border-[#e8eaef] pt-6">
            <p className="text-[11px] text-[#b0b3be]">
              {t("auth.common.copyright")}
            </p>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT — Visual panel ═══ */}
      <div className="relative hidden overflow-hidden md:flex md:w-[45%] lg:w-[52%]">
        {/* Deep blue base */}
        <div className="absolute inset-0 bg-[#00205C]" />

        {/* Large gradient circles for depth */}
        <div
          className="absolute -top-[20%] -right-[15%] h-[700px] w-[700px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(0,94,184,0.4) 0%, transparent 65%)",
            animation: "float-1 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -bottom-[10%] -left-[20%] h-[600px] w-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(72,54,152,0.35) 0%, transparent 65%)",
            animation: "float-2 18s ease-in-out infinite",
          }}
        />
        <div
          className="absolute top-[40%] left-[30%] h-[400px] w-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(0,145,218,0.15) 0%, transparent 60%)",
            animation: "float-1 15s ease-in-out infinite",
            animationDelay: "-5s",
          }}
        />

        {/* Bold geometric rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`transition-all duration-[1500ms] ease-out ${
              mounted ? "scale-100 opacity-100" : "scale-90 opacity-0"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            {/* Outer ring */}
            <div
              className="h-[280px] w-[280px] rounded-full border-[1.5px] border-white/[0.07] lg:h-[420px] lg:w-[420px] xl:h-[480px] xl:w-[480px]"
              style={{ animation: "float-2 25s ease-in-out infinite" }}
            >
              {/* Middle ring */}
              <div className="absolute inset-[60px] rounded-full border-[1.5px] border-white/[0.05]" />
              {/* Inner ring */}
              <div className="absolute inset-[120px] rounded-full border border-[#0091DA]/20" />
              {/* Core glow */}
              <div
                className="absolute inset-[155px] rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(0,145,218,0.2) 0%, transparent 70%)",
                }}
              />

              {/* Orbital dots */}
              {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                <div
                  key={deg}
                  className="absolute left-1/2 top-0 -translate-x-1/2"
                  style={{
                    transform: `rotate(${deg}deg)`,
                    transformOrigin: "50% 210px",
                  }}
                >
                  <div
                    className="h-2 w-2 rounded-full bg-[#0091DA]/60"
                    style={{
                      boxShadow: "0 0 12px 3px rgba(0,145,218,0.25)",
                      animation: `pulse-ring 3s ease-in-out ${i * 0.5}s infinite`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Large diagonal accent line */}
        <div
          className="absolute -left-[5%] top-[15%] h-px w-[60%] origin-left rotate-[25deg] opacity-20"
          style={{
            background: "linear-gradient(90deg, transparent, #0091DA 40%, #005EB8 70%, transparent)",
          }}
        />
        <div
          className="absolute -right-[5%] bottom-[20%] h-px w-[50%] origin-right -rotate-[20deg] opacity-15"
          style={{
            background: "linear-gradient(90deg, transparent, #483698 40%, #0091DA 70%, transparent)",
          }}
        />

        {/* Content — typographic hero */}
        <div className="relative z-10 flex h-full flex-col justify-center p-6 lg:p-10 xl:p-14">
          <div
            className={`transition-all duration-[1000ms] ease-out ${
              mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
            style={{ transitionDelay: "600ms" }}
          >
            <h2
              className="font-display font-extrabold uppercase leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontSize: "clamp(1.6rem, 3.5vw, 3.8rem)" }}
            >
              {t("auth.login.heroLine1")}
              <br />
              {t("auth.login.heroLine2")}
              <br />
              <span className="text-[#0091DA]">{t("auth.login.heroLine3")}</span>
            </h2>
            <p className="mt-4 lg:mt-6 max-w-sm text-[13px] lg:text-[14px] leading-relaxed text-white/35">
              {t("auth.login.heroDescription")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
