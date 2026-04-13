import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function UserMenu({ variant = "bold" }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;

  const initials = user.full_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isDark = variant === "bold";

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2.5 rounded-full px-3 py-1.5 transition-colors duration-200 cursor-pointer ${
          isDark
            ? "hover:bg-white/[0.05]"
            : "hover:bg-warm-200/50"
        }`}
      >
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ${
            isDark
              ? "bg-accent/15 text-accent"
              : "bg-kpmg/10 text-kpmg"
          }`}
        >
          {initials}
        </div>
        <span
          className={`hidden text-[13px] font-medium sm:block ${
            isDark ? "text-white/60" : "text-warm-800/60"
          }`}
        >
          {user.full_name.split(" ")[0]}
        </span>
      </button>

      {open && (
        <div
          className={`absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border shadow-2xl ${
            isDark
              ? "border-white/[0.08] bg-[#141414] shadow-black/40"
              : "border-warm-200 bg-white shadow-black/10"
          }`}
        >
          {/* User info header */}
          <div
            className={`border-b px-4 py-3 ${
              isDark ? "border-white/[0.06]" : "border-warm-200"
            }`}
          >
            <div
              className={`text-sm font-semibold ${
                isDark ? "text-white" : "text-warm-900"
              }`}
            >
              {user.full_name}
            </div>
            <div
              className={`mt-0.5 text-[11px] ${
                isDark ? "text-white/30" : "text-warm-800/40"
              }`}
            >
              {user.email}
            </div>
          </div>

          {/* Menu items */}
          <div className="p-1.5">
            {user.role === "admin" && (
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/settings");
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors cursor-pointer ${
                  isDark
                    ? "text-white/50 hover:bg-white/[0.05] hover:text-white"
                    : "text-warm-800/50 hover:bg-warm-100 hover:text-warm-900"
                }`}
              >
                <Settings size={15} />
                Settings
              </button>
            )}
            <button
              onClick={handleLogout}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors cursor-pointer ${
                isDark
                  ? "text-red-400/60 hover:bg-red-500/10 hover:text-red-400"
                  : "text-red-500/60 hover:bg-red-50 hover:text-red-600"
              }`}
            >
              <LogOut size={15} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
