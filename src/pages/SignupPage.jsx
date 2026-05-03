import { useState, useMemo } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Check, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useT } from "../i18n/i18n";

// Password validation rules. The label is an i18n key; the test runs against
// the raw input. Order here matters — it's the order shown to the user.
const RULES = [
  { labelKey: "auth.signup.rules.minLength", test: (p) => p.length >= 8 },
  { labelKey: "auth.signup.rules.hasLetter", test: (p) => /[a-zA-Z]/.test(p) },
  { labelKey: "auth.signup.rules.hasNumber", test: (p) => /\d/.test(p) },
];

/**
 * Self-service signup page. Enforces the password rules client-side as a UX
 * hint, then submits to the backend (which re-validates server-side).
 */
export default function SignupPage() {
  const { user, loading, signup } = useAuth();
  const t = useT();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const ruleResults = useMemo(() => RULES.map((r) => r.test(password)), [password]);
  const passwordValid = ruleResults.every(Boolean);
  const confirmMatch = password === confirm && confirm.length > 0;

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  /**
   * Validates the password meets the rules and matches the confirmation,
   * then submits the signup request and navigates to the home route on success.
   */
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!passwordValid) return setError(t("auth.signup.errors.passwordRequirements"));
    if (!confirmMatch) return setError(t("auth.signup.errors.passwordMismatch"));
    setSubmitting(true);
    try {
      await signup(email, password, fullName);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 py-12 font-body">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute -top-[30%] left-[10%] h-[500px] w-[500px] rounded-full opacity-50"
          style={{ background: "radial-gradient(circle, rgba(0,51,141,0.12) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[5%] right-[-10%] h-[400px] w-[400px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, rgba(0,229,160,0.06) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-10 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-kpmg">
            <span className="font-display text-sm font-extrabold text-white">{t("brand.logoMark")}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-sm font-bold tracking-[0.08em] text-white uppercase">{t("brand.name")}</span>
            <span className="text-[9px] font-medium tracking-[0.25em] text-accent/70 uppercase">{t("brand.tagline")}</span>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-8 shadow-2xl shadow-black/40 sm:p-10">
          <h1 className="font-display text-2xl font-extrabold tracking-[-0.01em] text-white uppercase">
            {t("auth.signup.title")}
          </h1>
          <p className="mt-2 text-sm text-white/30">
            {t("auth.signup.subtitle")}
          </p>

          {error && (
            <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-[11px] font-semibold tracking-[0.1em] text-white/30 uppercase">
                {t("auth.signup.fullNameLabel")}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
                placeholder={t("auth.signup.fullNamePlaceholder")}
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-semibold tracking-[0.1em] text-white/30 uppercase">
                {t("auth.signup.emailLabel")}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
                placeholder={t("auth.signup.emailPlaceholder")}
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-semibold tracking-[0.1em] text-white/30 uppercase">
                {t("auth.signup.passwordLabel")}
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-4 py-3 pr-11 text-sm text-white placeholder:text-white/20 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
                  placeholder={t("auth.signup.passwordPlaceholder")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 cursor-pointer"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password rules */}
              {password.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {RULES.map((rule, i) => (
                    <div key={rule.labelKey} className="flex items-center gap-2">
                      {ruleResults[i] ? (
                        <Check size={12} className="text-accent" />
                      ) : (
                        <X size={12} className="text-white/20" />
                      )}
                      <span className={`text-[11px] ${ruleResults[i] ? "text-accent/70" : "text-white/25"}`}>
                        {t(rule.labelKey)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-semibold tracking-[0.1em] text-white/30 uppercase">
                {t("auth.signup.confirmLabel")}
              </label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={`w-full rounded-xl border bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 ${
                  confirm.length > 0
                    ? confirmMatch
                      ? "border-accent/30 focus:border-accent/40 focus:ring-accent/20"
                      : "border-red-500/30 focus:border-red-500/40 focus:ring-red-500/20"
                    : "border-white/[0.08] focus:border-accent/40 focus:ring-accent/20"
                }`}
                placeholder={t("auth.signup.confirmPlaceholder")}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="group flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 text-[12px] font-bold tracking-[0.08em] text-white uppercase transition-all duration-300 hover:bg-medium-blue hover:shadow-lg hover:shadow-accent/15 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  {t("auth.signup.submit")}
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-[13px] text-white/25">
            {t("auth.signup.haveAccount")}{" "}
            <Link to="/login" className="font-semibold text-accent transition-colors hover:text-white">
              {t("auth.signup.signIn")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
