// Always include the auth cookie on cross-origin requests when the proxy
// rewrites them. Backend endpoints rely on the cookie-bound JWT, not headers.
const OPTS = { credentials: "include" };
const JSON_OPTS = {
  ...OPTS,
  headers: { "Content-Type": "application/json" },
};

/**
 * Thin fetch wrapper used by every endpoint helper below. Throws an Error
 * carrying the server's `detail` message (or a generic HTTP status fallback)
 * on non-2xx responses, and returns parsed JSON or `null` for empty bodies.
 */
async function request(url, opts = {}) {
  const res = await fetch(url, { ...OPTS, ...opts });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") return null;
  return res.json();
}

/** Send a JSON POST. */
function post(url, body) {
  return request(url, { method: "POST", ...JSON_OPTS, body: JSON.stringify(body) });
}

/** Send a JSON PUT. */
function put(url, body) {
  return request(url, { method: "PUT", ...JSON_OPTS, body: JSON.stringify(body) });
}

/** Send a DELETE. No body. */
function del(url) {
  return request(url, { method: "DELETE" });
}

// Auth
/** POST credentials and receive the user object (cookie set by server). */
export const apiLogin = (email, password) => post("/auth/api/login", { email, password });
/** POST signup details and receive the new user object. */
export const apiSignup = (email, password, full_name) => post("/auth/api/signup", { email, password, full_name });
/** Clear the server-side session cookie. */
export const apiLogout = () => post("/auth/api/logout", {});
/** Read the user identified by the current cookie; rejects when no session. */
export const apiGetMe = () => request("/auth/api/me");
/** Self-service password change: requires the current password. */
export const apiResetPassword = (old_password, new_password) =>
  post("/auth/api/reset-password", { old_password, new_password });

// Admin — users
/** List all users (admin only). */
export const apiGetUsers = () => request("/auth/api/users");
/** Create a user (admin only). */
export const apiCreateUser = (data) => post("/auth/api/users", data);
/** Read a single user by id (admin only). */
export const apiGetUser = (id) => request(`/auth/api/users/${id}`);
/** Update mutable fields on a user (admin only). */
export const apiUpdateUser = (id, data) => put(`/auth/api/users/${id}`, data);
/** Soft-delete (deactivate) a user (admin only). */
export const apiDeleteUser = (id) => del(`/auth/api/users/${id}`);
/** Admin override: reset a user's password without their old one. */
export const apiAdminResetPassword = (id, new_password) =>
  post(`/auth/api/users/${id}/reset-password`, { new_password });
/** Replace a user's per-app access list. */
export const apiUpdateAccess = (id, access) =>
  put(`/auth/api/users/${id}/access`, { access });

// Admin — settings
/** Read all global settings as an array of {key, value, updated_at}. */
export const apiGetSettings = () => request("/auth/api/settings");
/** Bulk-update global settings, taking a {key: value} map. */
export const apiUpdateSettings = (settings) => put(`/auth/api/settings`, { settings });
