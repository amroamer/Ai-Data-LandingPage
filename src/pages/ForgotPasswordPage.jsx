import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiResetPassword } from "../api/auth";

export default function ForgotPasswordPage() {
  const { user, loading } = useAuth();

  if (loading) return null;

  // If logged in, show self-reset form
  if (user) return <SelfReset />;

  // If not logged in, show "contact admin" message
  return <ContactAdmin />;
}

function ContactAdmin() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 font-body">
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute -top-[30%] right-[10%] h-[500px] w-[500px] rounded-full opacity-50"
          style={{ background: "radial-gradient(circle, rgba(0,51,141,0.12) 0%, transparent 70%)" }}
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
            <span className="text-[9px] font-medium tracking-[0.25em] text-accent/70 uppercase">
              Digital Foundation
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-8 shadow-2xl shadow-black/40 sm:p-10">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/[0.08] border border-accent/15">
            <ShieldCheck size={28} className="text-accent" />
          </div>

          <h1 className="font-display text-2xl font-extrabold tracking-[-0.01em] text-white uppercase">
            Reset password
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/35">
            Password resets are handled by your administrator. Please contact your admin to reset your password.
          </p>

          <div className="mt-8 rounded-xl border border-white/[0.06] bg-[#0a0a0a] px-4 py-3">
            <div className="text-[10px] font-semibold tracking-[0.1em] text-white/20 uppercase">
              Admin contact
            </div>
            <div className="mt-1 text-sm text-white/50">admin@kpmg.com</div>
          </div>

          <Link
            to="/login"
            className="mt-8 flex items-center gap-2 text-[13px] font-medium text-accent transition-colors hover:text-white"
          >
            <ArrowLeft size={14} />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

function SelfReset() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return setError("Password must be 8+ chars with a letter and number");
    }
    if (newPassword !== confirm) {
      return setError("Passwords do not match");
    }

    setSubmitting(true);
    try {
      await apiResetPassword(oldPassword, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 font-body">
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute -top-[30%] right-[10%] h-[500px] w-[500px] rounded-full opacity-50"
          style={{ background: "radial-gradient(circle, rgba(0,51,141,0.12) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-10 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-kpmg">
            <span className="font-display text-sm font-extrabold text-white">K</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-sm font-bold tracking-[0.08em] text-white uppercase">KPMG</span>
            <span className="text-[9px] font-medium tracking-[0.25em] text-accent/70 uppercase">
              Digital Foundation
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-8 shadow-2xl shadow-black/40 sm:p-10">
          <h1 className="font-display text-2xl font-extrabold tracking-[-0.01em] text-white uppercase">
            Change password
          </h1>
          <p className="mt-2 text-sm text-white/30">Update your account password</p>

          {success ? (
            <div className="mt-6">
              <div className="rounded-xl border border-accent/20 bg-accent/10 px-4 py-3 text-[13px] text-accent">
                Password changed successfully.
              </div>
              <Link
                to="/"
                className="mt-6 flex items-center gap-2 text-[13px] font-medium text-accent transition-colors hover:text-white"
              >
                <ArrowLeft size={14} />
                Back to home
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label className="mb-2 block text-[11px] font-semibold tracking-[0.1em] text-white/30 uppercase">
                    Current password
                  </label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-semibold tracking-[0.1em] text-white/30 uppercase">
                    New password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
                    placeholder="Min 8 chars, letter + number"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-semibold tracking-[0.1em] text-white/30 uppercase">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={`w-full rounded-xl border bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 ${
                      confirm.length > 0
                        ? confirm === newPassword
                          ? "border-accent/30 focus:border-accent/40 focus:ring-accent/20"
                          : "border-red-500/30 focus:border-red-500/40 focus:ring-red-500/20"
                        : "border-white/[0.08] focus:border-accent/40 focus:ring-accent/20"
                    }`}
                    placeholder="Repeat new password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 text-[12px] font-bold tracking-[0.08em] text-[#0a0a0a] uppercase transition-all duration-300 hover:bg-white hover:shadow-lg hover:shadow-accent/15 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a0a0a]/20 border-t-[#0a0a0a]" />
                  ) : (
                    "Change password"
                  )}
                </button>
              </form>

              <Link
                to={"/"}
                className="mt-6 flex items-center gap-2 text-[13px] font-medium text-white/25 transition-colors hover:text-white"
              >
                <ArrowLeft size={14} />
                Back
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
