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
      <BoldApp user={user} />
    </>
  );
}
