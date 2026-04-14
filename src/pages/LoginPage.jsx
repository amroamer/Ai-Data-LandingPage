import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

/* ── Geometric Face SVG — abstract AI/digital portrait ── */
function GeometricFace() {
  return (
    <svg
      viewBox="0 0 500 600"
      className="absolute inset-0 h-full w-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Face outline — geometric polygonal shape */}
      <g opacity="0.6">
        {/* Jawline and chin */}
        <path
          d="M250 520 L180 440 L160 350 L165 260 L185 190 L220 140 L250 120 L280 140 L315 190 L335 260 L340 350 L320 440 Z"
          stroke="rgba(0,145,218,0.3)"
          strokeWidth="1"
          fill="none"
        />
        {/* Inner face structure */}
        <path
          d="M250 480 L200 410 L185 330 L190 260 L210 200 L240 160 L250 150 L260 160 L290 200 L310 260 L315 330 L300 410 Z"
          stroke="rgba(0,145,218,0.15)"
          strokeWidth="0.8"
          fill="none"
        />
      </g>

      {/* Neural network lines — connecting across the face */}
      <g opacity="0.35" strokeWidth="0.5">
        <line x1="185" y1="190" x2="315" y2="190" stroke="#0091DA" />
        <line x1="165" y1="260" x2="335" y2="260" stroke="#0091DA" />
        <line x1="160" y1="350" x2="340" y2="350" stroke="#005EB8" />
        <line x1="180" y1="440" x2="320" y2="440" stroke="#005EB8" />
        <line x1="250" y1="120" x2="250" y2="520" stroke="rgba(0,145,218,0.12)" strokeWidth="0.3" />
        <line x1="200" y1="150" x2="165" y2="260" stroke="rgba(0,145,218,0.2)" />
        <line x1="300" y1="150" x2="335" y2="260" stroke="rgba(0,145,218,0.2)" />
        <line x1="210" y1="200" x2="160" y2="350" stroke="rgba(72,54,152,0.15)" />
        <line x1="290" y1="200" x2="340" y2="350" stroke="rgba(72,54,152,0.15)" />
        {/* Cross connections */}
        <line x1="185" y1="190" x2="335" y2="260" stroke="rgba(0,145,218,0.08)" />
        <line x1="315" y1="190" x2="165" y2="260" stroke="rgba(0,145,218,0.08)" />
        <line x1="165" y1="260" x2="320" y2="440" stroke="rgba(72,54,152,0.06)" />
        <line x1="335" y1="260" x2="180" y2="440" stroke="rgba(72,54,152,0.06)" />
      </g>

      {/* Eyes — geometric shapes */}
      <g opacity="0.5">
        {/* Left eye */}
        <polygon points="195,255 220,240 245,255 220,265" stroke="#0091DA" strokeWidth="0.8" fill="rgba(0,145,218,0.05)" />
        <circle cx="220" cy="253" r="4" fill="rgba(0,145,218,0.3)" stroke="#0091DA" strokeWidth="0.5" />
        {/* Right eye */}
        <polygon points="255,255 280,240 305,255 280,265" stroke="#0091DA" strokeWidth="0.8" fill="rgba(0,145,218,0.05)" />
        <circle cx="280" cy="253" r="4" fill="rgba(0,145,218,0.3)" stroke="#0091DA" strokeWidth="0.5" />
      </g>

      {/* Nose line */}
      <line x1="250" y1="270" x2="250" y2="330" stroke="rgba(0,145,218,0.2)" strokeWidth="0.5" />
      <line x1="240" y1="330" x2="260" y2="330" stroke="rgba(0,145,218,0.15)" strokeWidth="0.5" />

      {/* Mouth */}
      <path d="M220 380 Q235 395 250 390 Q265 395 280 380" stroke="rgba(0,145,218,0.2)" strokeWidth="0.6" fill="none" />

      {/* Network nodes scattered around */}
      {[
        [250, 120, 4, true], [185, 190, 3, true], [315, 190, 3, true],
        [165, 260, 3.5, false], [335, 260, 3.5, false],
        [160, 350, 3, false], [340, 350, 3, false],
        [180, 440, 2.5, false], [320, 440, 2.5, false], [250, 520, 3, true],
        [220, 253, 2, false], [280, 253, 2, false],
        [130, 200, 2, false], [370, 200, 2, false],
        [120, 320, 1.5, false], [380, 320, 1.5, false],
        [145, 430, 1.5, false], [355, 430, 1.5, false],
        [250, 80, 2, false], [200, 100, 1.5, false], [300, 100, 1.5, false],
        [100, 260, 2, false], [400, 260, 2, false],
        [210, 480, 1.5, false], [290, 480, 1.5, false],
      ].map(([cx, cy, r, accent], i) => (
        <g key={i}>
          <circle
            cx={cx} cy={cy} r={r}
            fill={accent ? "rgba(0,145,218,0.4)" : "rgba(0,145,218,0.15)"}
            stroke={accent ? "rgba(0,145,218,0.6)" : "rgba(0,145,218,0.25)"}
            strokeWidth="0.5"
          />
          {accent && (
            <circle cx={cx} cy={cy} r={r + 6} stroke="rgba(0,145,218,0.08)" strokeWidth="0.3" fill="none" />
          )}
        </g>
      ))}

      {/* Extended network lines to outer nodes */}
      <g opacity="0.2" strokeWidth="0.3">
        <line x1="250" y1="120" x2="250" y2="80" stroke="#0091DA" />
        <line x1="250" y1="80" x2="200" y2="100" stroke="#0091DA" />
        <line x1="250" y1="80" x2="300" y2="100" stroke="#0091DA" />
        <line x1="200" y1="100" x2="185" y2="190" stroke="#0091DA" />
        <line x1="300" y1="100" x2="315" y2="190" stroke="#0091DA" />
        <line x1="185" y1="190" x2="130" y2="200" stroke="#0091DA" />
        <line x1="315" y1="190" x2="370" y2="200" stroke="#0091DA" />
        <line x1="165" y1="260" x2="100" y2="260" stroke="#005EB8" />
        <line x1="335" y1="260" x2="400" y2="260" stroke="#005EB8" />
        <line x1="165" y1="260" x2="120" y2="320" stroke="#005EB8" />
        <line x1="335" y1="260" x2="380" y2="320" stroke="#005EB8" />
        <line x1="160" y1="350" x2="120" y2="320" stroke="#483698" />
        <line x1="340" y1="350" x2="380" y2="320" stroke="#483698" />
        <line x1="180" y1="440" x2="145" y2="430" stroke="#483698" />
        <line x1="320" y1="440" x2="355" y2="430" stroke="#483698" />
        <line x1="250" y1="520" x2="210" y2="480" stroke="#483698" />
        <line x1="250" y1="520" x2="290" y2="480" stroke="#483698" />
      </g>

      {/* Forehead data-like grid lines */}
      <g opacity="0.1" strokeWidth="0.3">
        {[150, 165, 180].map((y) => (
          <line key={y} x1="200" y1={y} x2="300" y2={y} stroke="#0091DA" />
        ))}
        {[215, 235, 255, 265, 285].map((x) => (
          <line key={x} x1={x} y1="140" x2={x} y2="185" stroke="#0091DA" />
        ))}
      </g>
    </svg>
  );
}

/* ── Floating particles on the right panel ── */
function FloatingParticles() {
  const particles = [
    { x: "12%", y: "8%", size: 3, delay: 0 },
    { x: "78%", y: "15%", size: 2, delay: 1.2 },
    { x: "88%", y: "42%", size: 2.5, delay: 2.5 },
    { x: "22%", y: "72%", size: 2, delay: 0.8 },
    { x: "65%", y: "88%", size: 3, delay: 1.8 },
    { x: "92%", y: "68%", size: 1.5, delay: 3.2 },
    { x: "8%", y: "45%", size: 2, delay: 2.1 },
    { x: "50%", y: "5%", size: 2, delay: 0.5 },
    { x: "35%", y: "92%", size: 2.5, delay: 1.5 },
  ];

  return (
    <>
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/20"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            animation: `pulse-ring 3s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </>
  );
}

export default function LoginPage() {
  const { user, loading, login } = useAuth();
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
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-[48%] lg:px-20 xl:px-28">
        <div
          className={`mx-auto w-full max-w-[400px] transition-all duration-700 ease-out ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {/* Logo */}
          <div className="mb-12 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-kpmg shadow-lg shadow-kpmg/15">
              <span className="font-display text-[15px] font-extrabold text-white">K</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-[15px] font-bold tracking-[0.06em] text-[#1a1a2e] uppercase">
                KPMG
              </span>
              <span className="text-[9px] font-semibold tracking-[0.22em] text-kpmg/60 uppercase">
                Digital Foundation
              </span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="font-display text-[28px] font-extrabold tracking-[-0.02em] text-[#1a1a2e]">
            Welcome back
          </h1>
          <p className="mt-2 text-[14px] text-[#6b7084]">
            Sign in to the Digital Foundation platform
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
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="name@kpmg.com"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[13px] font-semibold text-[#3a3d4a]">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[12px] font-medium text-kpmg/70 transition-colors hover:text-kpmg"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass + " pr-11"}
                  placeholder="Enter your password"
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
                  Sign in
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[13px] text-[#8a8d9a]">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-kpmg transition-colors hover:text-kpmg-dark"
            >
              Create account
            </Link>
          </p>

          {/* Footer */}
          <div className="mt-16 border-t border-[#e8eaef] pt-6">
            <p className="text-[11px] text-[#b0b3be]">
              &copy; 2026 KPMG Saudi Arabia. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT — Visual panel ═══ */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-[52%]">
        {/* Gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #001f5c 0%, #00338D 25%, #483698 60%, #470A68 100%)",
          }}
        />

        {/* Subtle mesh overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Glow effects */}
        <div
          className="absolute left-[20%] top-[15%] h-[400px] w-[400px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(0,145,218,0.5) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[10%] right-[10%] h-[300px] w-[300px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, rgba(72,54,152,0.6) 0%, transparent 70%)" }}
        />

        {/* Geometric face */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-[1500ms] ease-out ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
          style={{ transitionDelay: "300ms" }}
        >
          <div className="relative h-[80%] w-[80%] max-h-[600px] max-w-[500px]">
            <GeometricFace />
          </div>
        </div>

        {/* Floating particles */}
        <FloatingParticles />

        {/* Bottom text overlay */}
        <div
          className={`absolute right-0 bottom-0 left-0 p-10 xl:p-14 transition-all duration-[1000ms] ease-out ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
          style={{ transitionDelay: "600ms" }}
        >
          <div className="relative">
            <div
              className="absolute inset-0 -m-6 rounded-2xl"
              style={{
                background: "linear-gradient(0deg, rgba(0,15,50,0.7) 0%, transparent 100%)",
              }}
            />
            <div className="relative">
              <span className="text-[10px] font-semibold tracking-[0.3em] text-white/40 uppercase">
                AI & Data Practice
              </span>
              <h2 className="mt-3 font-display text-[26px] font-extrabold leading-[1.15] tracking-[-0.01em] text-white xl:text-[30px]">
                Transforming
                <br />
                Saudi Arabia's
                <br />
                <span className="text-light-blue">Digital Future</span>
              </h2>
              <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-white/40">
                Enterprise-grade AI — from strategy through implementation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
