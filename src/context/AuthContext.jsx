import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiGetMe, apiLogin, apiSignup, apiLogout } from "../api/auth";

const AuthContext = createContext(null);

/**
 * Bootstraps and exposes the current user. On mount it calls the `me`
 * endpoint to detect an existing cookie session; the rest of the app stays
 * in `loading` state until that resolves so route guards don't flash to
 * the login page for already-authenticated users.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  /** Submit credentials and adopt the returned user as the active session. */
  const login = useCallback(async (email, password) => {
    const u = await apiLogin(email, password);
    setUser(u);
    return u;
  }, []);

  /** Create a new account and immediately treat it as the active session. */
  const signup = useCallback(async (email, password, full_name) => {
    const u = await apiSignup(email, password, full_name);
    setUser(u);
    return u;
  }, []);

  /** Clear the session cookie server-side and forget the local user. */
  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook for consuming the auth context. Throws when used outside an
 * `AuthProvider` so misuse fails loudly instead of silently returning null.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
