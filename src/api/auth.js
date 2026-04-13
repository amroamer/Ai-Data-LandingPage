const OPTS = { credentials: "include" };
const JSON_OPTS = {
  ...OPTS,
  headers: { "Content-Type": "application/json" },
};

async function request(url, opts = {}) {
  const res = await fetch(url, { ...OPTS, ...opts });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") return null;
  return res.json();
}

function post(url, body) {
  return request(url, { method: "POST", ...JSON_OPTS, body: JSON.stringify(body) });
}
function put(url, body) {
  return request(url, { method: "PUT", ...JSON_OPTS, body: JSON.stringify(body) });
}
function del(url) {
  return request(url, { method: "DELETE" });
}

// Auth
export const apiLogin = (email, password) => post("/auth/api/login", { email, password });
export const apiSignup = (email, password, full_name) => post("/auth/api/signup", { email, password, full_name });
export const apiLogout = () => post("/auth/api/logout", {});
export const apiGetMe = () => request("/auth/api/me");
export const apiResetPassword = (old_password, new_password) =>
  post("/auth/api/reset-password", { old_password, new_password });

// Admin — users
export const apiGetUsers = () => request("/auth/api/users");
export const apiCreateUser = (data) => post("/auth/api/users", data);
export const apiGetUser = (id) => request(`/auth/api/users/${id}`);
export const apiUpdateUser = (id, data) => put(`/auth/api/users/${id}`, data);
export const apiDeleteUser = (id) => del(`/auth/api/users/${id}`);
export const apiAdminResetPassword = (id, new_password) =>
  post(`/auth/api/users/${id}/reset-password`, { new_password });
export const apiUpdateAccess = (id, access) =>
  put(`/auth/api/users/${id}/access`, { access });

// Admin — settings
export const apiGetSettings = () => request("/auth/api/settings");
export const apiUpdateSettings = (settings) => put("/auth/api/settings", { settings });
