import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  X,
  Check,
  Shield,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import UserMenu from "../components/UserMenu";
import {
  apiGetUsers,
  apiCreateUser,
  apiUpdateUser,
  apiDeleteUser,
  apiAdminResetPassword,
  apiUpdateAccess,
  apiGetSettings,
  apiUpdateSettings,
} from "../api/auth";

const APP_SLUGS = [
  { slug: "slides-generator", label: "Slides Generator" },
  { slug: "ai-badges", label: "AI Badges" },
  { slug: "cloud-sahab", label: "Cloud Sahab" },
  { slug: "data-owner", label: "Data Owner Agent" },
  { slug: "ai-data-landing", label: "AI Data Landing" },
  { slug: "ragflow", label: "RAGFlow" },
];

/* ── Modal shell ── */
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.06] bg-[#111111] p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-white uppercase">{title}</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white cursor-pointer">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Input component ── */
function Field({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-semibold tracking-[0.1em] text-white/30 uppercase">
        {label}
      </label>
      {children}
    </div>
  );
}

const INPUT =
  "w-full rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20";

/* ── Create/Edit user modal ── */
function UserFormModal({ user: editUser, onClose, onSaved }) {
  const isEdit = !!editUser;
  const [form, setForm] = useState({
    email: editUser?.email || "",
    full_name: editUser?.full_name || "",
    password: "",
    role: editUser?.role || "user",
    is_active: editUser?.is_active ?? true,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (isEdit) {
        await apiUpdateUser(editUser.id, {
          full_name: form.full_name,
          role: form.role,
          is_active: form.is_active,
        });
      } else {
        await apiCreateUser({
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          role: form.role,
        });
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? "Edit user" : "Create user"} onClose={onClose}>
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-[13px] text-red-400">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name">
          <input
            className={INPUT}
            required
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            placeholder="Full name"
          />
        </Field>

        {!isEdit && (
          <>
            <Field label="Email">
              <input
                className={INPUT}
                type="email"
                required
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="name@kpmg.com"
              />
            </Field>
            <Field label="Password">
              <input
                className={INPUT}
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Min 8 chars, letter + number"
              />
            </Field>
          </>
        )}

        <Field label="Role">
          <select
            className={INPUT + " cursor-pointer"}
            value={form.role}
            onChange={(e) => set("role", e.target.value)}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </Field>

        {isEdit && (
          <label className="flex items-center gap-3 text-sm text-white/50 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => set("is_active", e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-[#0a0a0a] accent-accent"
            />
            Account active
          </label>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/[0.08] px-4 py-2 text-[12px] font-semibold text-white/40 hover:text-white cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent px-5 py-2 text-[12px] font-bold text-[#0a0a0a] hover:bg-white disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving..." : isEdit ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Reset password modal ── */
function ResetPwModal({ user: target, onClose, onSaved }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await apiAdminResetPassword(target.id, password);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Reset password — ${target.full_name}`} onClose={onClose}>
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-[13px] text-red-400">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="New password">
          <input
            className={INPUT}
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 chars, letter + number"
          />
        </Field>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/[0.08] px-4 py-2 text-[12px] font-semibold text-white/40 hover:text-white cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent px-5 py-2 text-[12px] font-bold text-[#0a0a0a] hover:bg-white disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving..." : "Reset password"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ── App access row ── */
function AccessRow({ userId, currentAccess, onUpdated }) {
  const [saving, setSaving] = useState(false);

  async function toggle(slug, currentValue) {
    setSaving(true);
    try {
      await apiUpdateAccess(userId, [{ app_slug: slug, has_access: !currentValue }]);
      onUpdated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {APP_SLUGS.map(({ slug, label }) => {
        const entry = currentAccess.find((a) => a.app_slug === slug);
        const hasAccess = entry?.has_access ?? false;
        return (
          <button
            key={slug}
            onClick={() => toggle(slug, hasAccess)}
            disabled={saving}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-medium transition-all cursor-pointer ${
              hasAccess
                ? "border-accent/20 bg-accent/[0.08] text-accent"
                : "border-white/[0.06] bg-transparent text-white/25 hover:text-white/40"
            }`}
          >
            <div className={`h-2 w-2 rounded-full ${hasAccess ? "bg-accent" : "bg-white/15"}`} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Main settings page ── */
export default function SettingsPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const loadData = useCallback(async () => {
    const [u, s] = await Promise.all([apiGetUsers(), apiGetSettings()]);
    setUsers(u);
    const map = {};
    for (const item of s) map[item.key] = item.value;
    setSettings(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function toggleSignup() {
    const current = settings.signup_enabled === "true";
    await apiUpdateSettings({ signup_enabled: current ? "false" : "true" });
    setSettings((s) => ({ ...s, signup_enabled: current ? "false" : "true" }));
  }

  async function handleDelete(u) {
    setDeleting(u.id);
    try {
      await apiDeleteUser(u.id);
      await loadData();
    } finally {
      setDeleting(null);
    }
  }

  function handleSaved() {
    setModal(null);
    loadData();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-body antialiased">
      {/* Nav */}
      <nav className="border-b border-white/[0.04] bg-[#0a0a0a]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-2 text-[13px] font-medium text-white/35 transition-colors hover:text-white"
            >
              <ArrowLeft size={14} />
              Home
            </Link>
            <div className="h-5 w-px bg-white/[0.08]" />
            <span className="font-display text-sm font-bold tracking-[0.05em] text-white uppercase">
              Settings
            </span>
          </div>
          <UserMenu variant="bold" />
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        {/* ── Global Settings ── */}
        <section className="mb-12">
          <h2 className="font-display text-xs font-semibold tracking-[0.3em] text-accent/60 uppercase">
            Global Settings
          </h2>
          <div className="mt-4 rounded-2xl border border-white/[0.06] bg-[#111111] p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">Public signup</div>
                <div className="mt-0.5 text-[12px] text-white/30">
                  Allow new users to create accounts
                </div>
              </div>
              <button
                onClick={toggleSignup}
                className={`relative h-7 w-12 rounded-full transition-colors duration-200 cursor-pointer ${
                  settings.signup_enabled === "true" ? "bg-accent" : "bg-white/10"
                }`}
              >
                <div
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    settings.signup_enabled === "true" ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* ── User Management ── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xs font-semibold tracking-[0.3em] text-accent/60 uppercase">
              Users ({users.length})
            </h2>
            <button
              onClick={() => setModal({ type: "create" })}
              className="flex items-center gap-2 rounded-lg bg-accent/[0.08] border border-accent/15 px-4 py-2 text-[11px] font-bold tracking-[0.08em] text-accent uppercase transition-all hover:bg-accent/15 cursor-pointer"
            >
              <Plus size={14} />
              Create user
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111111]">
            {/* Header */}
            <div className="hidden border-b border-white/[0.04] px-6 py-3 md:grid md:grid-cols-[1fr_1fr_100px_80px_140px]">
              {["Name", "Email", "Role", "Status", "Actions"].map((h) => (
                <div key={h} className="text-[10px] font-bold tracking-[0.15em] text-white/20 uppercase">
                  {h}
                </div>
              ))}
            </div>

            {/* Rows */}
            {users.map((u) => (
              <div key={u.id} className="border-b border-white/[0.04] last:border-b-0">
                <div className="flex flex-col gap-3 px-6 py-4 md:grid md:grid-cols-[1fr_1fr_100px_80px_140px] md:items-center md:gap-0">
                  {/* Name */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[11px] font-bold text-accent">
                      {u.full_name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-white">{u.full_name}</span>
                  </div>

                  {/* Email */}
                  <div className="text-[13px] text-white/40">{u.email}</div>

                  {/* Role */}
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                        u.role === "admin"
                          ? "bg-kpmg/15 text-kpmg-glow"
                          : "bg-white/[0.05] text-white/30"
                      }`}
                    >
                      {u.role === "admin" ? <Shield size={10} /> : <UserIcon size={10} />}
                      {u.role}
                    </span>
                  </div>

                  {/* Status */}
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                        u.is_active ? "text-emerald-400" : "text-red-400/60"
                      }`}
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          u.is_active ? "bg-emerald-400" : "bg-red-400/60"
                        }`}
                      />
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setModal({ type: "edit", user: u })}
                      className="rounded-lg p-2 text-white/20 hover:bg-white/[0.05] hover:text-white/60 cursor-pointer"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setModal({ type: "reset", user: u })}
                      className="rounded-lg p-2 text-white/20 hover:bg-white/[0.05] hover:text-white/60 cursor-pointer"
                      title="Reset password"
                    >
                      <KeyRound size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(u)}
                      disabled={deleting === u.id || u.email === user?.email}
                      className="rounded-lg p-2 text-white/20 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-20 cursor-pointer"
                      title="Deactivate"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                      className="rounded-lg p-2 text-white/20 hover:bg-white/[0.05] hover:text-white/60 cursor-pointer"
                      title="App access"
                    >
                      {expandedUser === u.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded: app access */}
                {expandedUser === u.id && (
                  <div className="border-t border-white/[0.04] bg-[#0d0d0d] px-6 py-4">
                    <div className="mb-3 text-[10px] font-bold tracking-[0.15em] text-white/20 uppercase">
                      App access
                    </div>
                    <AccessRow userId={u.id} currentAccess={u.app_access || []} onUpdated={loadData} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Modals */}
      {modal?.type === "create" && <UserFormModal onClose={() => setModal(null)} onSaved={handleSaved} />}
      {modal?.type === "edit" && (
        <UserFormModal user={modal.user} onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
      {modal?.type === "reset" && (
        <ResetPwModal user={modal.user} onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
    </div>
  );
}
