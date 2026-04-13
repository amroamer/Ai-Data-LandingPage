import { useState, useEffect } from "react";
import BoldApp from "./App.bold";
import MinimalApp from "./App.minimal";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { user } = useAuth();
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("kpmg-theme") || "bold";
    } catch {
      return "bold";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("kpmg-theme", theme);
    } catch {}
  }, [theme]);

  return (
    <>
      {/* Theme Switcher */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <div
          className="flex items-center gap-0.5 rounded-full p-1 shadow-2xl"
          style={{
            background: "rgba(10, 22, 40, 0.92)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <button
            onClick={() => setTheme("bold")}
            className={`rounded-full px-5 py-2.5 text-[11px] font-semibold tracking-[0.15em] uppercase transition-all duration-300 ${
              theme === "bold"
                ? "bg-kpmg text-white shadow-lg shadow-kpmg/30"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            Bold
          </button>
          <button
            onClick={() => setTheme("minimal")}
            className={`rounded-full px-5 py-2.5 text-[11px] font-semibold tracking-[0.15em] uppercase transition-all duration-300 ${
              theme === "minimal"
                ? "bg-kpmg text-white shadow-lg shadow-kpmg/30"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            Minimal
          </button>
        </div>
      </div>

      {theme === "bold" ? <BoldApp user={user} /> : <MinimalApp user={user} />}
    </>
  );
}
