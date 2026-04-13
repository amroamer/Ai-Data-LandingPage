import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 font-body">
      {/* Background atmosphere */}
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute -top-[30%] right-[10%] h-[500px] w-[500px] rounded-full opacity-50"
          style={{ background: "radial-gradient(circle, rgba(0,51,141,0.12) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[5%] -left-[10%] h-[400px] w-[400px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, rgba(0,229,160,0.06) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-10 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-kpmg">
            <span className="font-display text-sm font-extrabold text-white">K</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-sm font-bold tracking-[0.08em] text-white uppercase">KPMG</span>
            <span className="text-[9px] font-medium tracking-[0.25em] text-accent/70 uppercase">Digital Foundation</span>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-8 shadow-2xl shadow-black/40 sm:p-10">
          <h1 className="font-display text-2xl font-extrabold tracking-[-0.01em] text-white uppercase">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-white/30">
            Access the Digital Foundation platform
          </p>

          {error && (
            <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-[11px] font-semibold tracking-[0.1em] text-white/30 uppercase">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
                placeholder="name@kpmg.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-semibold tracking-[0.1em] text-white/30 uppercase">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-4 py-3 pr-11 text-sm text-white placeholder:text-white/20 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 cursor-pointer"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <Link
                to="/forgot-password"
                className="mt-1.5 block text-right text-[12px] text-white/25 transition-colors hover:text-accent"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="group flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 text-[12px] font-bold tracking-[0.08em] text-[#0a0a0a] uppercase transition-all duration-300 hover:bg-white hover:shadow-lg hover:shadow-accent/15 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a0a0a]/20 border-t-[#0a0a0a]" />
              ) : (
                <>
                  Sign in
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-[13px] text-white/25">
            Don't have an account?{" "}
            <Link to="/signup" className="font-semibold text-accent transition-colors hover:text-white">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
