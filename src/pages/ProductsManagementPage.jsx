import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  X,
  ExternalLink,
  Image as ImageIcon,
  Film,
} from "lucide-react";
import UserMenu from "../components/UserMenu";
import { useT } from "../i18n/i18n";
import { getProductIcon, iconOptions } from "../data/icons";
import {
  apiAdminListProducts,
  apiAdminCreateProduct,
  apiAdminUpdateProduct,
  apiAdminDeleteProduct,
} from "../api/auth";

// Common shared input styling so the form fields look uniform.
const INPUT =
  "w-full rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20";

const TEXTAREA = INPUT + " min-h-[80px] resize-y leading-relaxed";

/**
 * Default form payload for the create flow. Edit flow seeds from the
 * selected product instead.
 */
const EMPTY_FORM = {
  slug: "",
  icon_name: "Package",
  url: "",
  video_url: "",
  screenshots_text: "",
  is_visible: true,
  sort_order: 0,
  title_en: "",
  title_ar: "",
  description_en: "",
  description_ar: "",
  problem_en: "",
  problem_ar: "",
  solution_en: "",
  solution_ar: "",
};

/**
 * Convert a product API object into the flat form-state shape used by the
 * editor. ``screenshots`` is joined into a newline-separated string for
 * easier multi-line editing.
 */
function productToForm(p) {
  return {
    ...EMPTY_FORM,
    ...p,
    video_url: p.video_url || "",
    screenshots_text: (p.screenshots || []).join("\n"),
  };
}

/**
 * Normalise the form-state shape into an API payload. The
 * ``screenshots_text`` textarea is split on newlines, trimmed, and emptied
 * out so the backend never receives blank entries.
 */
function formToPayload(form) {
  const screenshots = form.screenshots_text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const { screenshots_text: _ignored, ...rest } = form;
  return {
    ...rest,
    screenshots,
    video_url: form.video_url.trim() || null,
    sort_order: Number(form.sort_order) || 0,
  };
}

/**
 * Backdrop modal used for both create and edit forms. The shared shell
 * keeps the styling identical to the user-management modal.
 */
function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-12">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full ${wide ? "max-w-3xl" : "max-w-lg"} rounded-2xl border border-white/[0.06] bg-[#111111] p-6 shadow-2xl sm:p-8`}
      >
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

/**
 * Labelled form field. Shared with users management — same uppercase
 * tracking treatment.
 */
function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-semibold tracking-[0.1em] text-white/30 uppercase">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-white/25">{hint}</p>}
    </div>
  );
}

/**
 * Create-or-edit product modal. Renders the entire bilingual content set
 * plus URLs, screenshots, video, icon, sort order, and visibility toggle.
 */
function ProductFormModal({ product, onClose, onSaved }) {
  const t = useT();
  const isEdit = !!product;
  const [form, setForm] = useState(() => (isEdit ? productToForm(product) : EMPTY_FORM));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const icons = iconOptions();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  /** Submit the form to either the create or update endpoint. */
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = formToPayload(form);
      if (isEdit) {
        // slug cannot change after creation; backend rejects it anyway, but
        // strip client-side too so we don't ship a misleading payload.
        const { slug: _ignored, ...editable } = payload;
        await apiAdminUpdateProduct(product.id, editable);
      } else {
        await apiAdminCreateProduct(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={isEdit ? t("productsAdmin.editTitle") : t("productsAdmin.createTitle")}
      onClose={onClose}
      wide
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-[13px] text-red-400">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Identity row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("productsAdmin.fields.slug")} hint={t("productsAdmin.hints.slug")}>
            <input
              className={INPUT + (isEdit ? " opacity-50" : "")}
              required
              value={form.slug}
              disabled={isEdit}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="my-product"
            />
          </Field>
          <Field label={t("productsAdmin.fields.icon")}>
            <select
              className={INPUT + " cursor-pointer"}
              value={form.icon_name}
              onChange={(e) => set("icon_name", e.target.value)}
            >
              {icons.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* URL row */}
        <Field label={t("productsAdmin.fields.url")} hint={t("productsAdmin.hints.url")}>
          <input
            className={INPUT}
            type="url"
            required
            value={form.url}
            onChange={(e) => set("url", e.target.value)}
            placeholder="https://..."
          />
        </Field>

        <Field label={t("productsAdmin.fields.videoUrl")} hint={t("productsAdmin.hints.videoUrl")}>
          <input
            className={INPUT}
            type="url"
            value={form.video_url}
            onChange={(e) => set("video_url", e.target.value)}
            placeholder="https://www.youtube.com/embed/..."
          />
        </Field>

        <Field label={t("productsAdmin.fields.screenshots")} hint={t("productsAdmin.hints.screenshots")}>
          <textarea
            className={TEXTAREA}
            value={form.screenshots_text}
            onChange={(e) => set("screenshots_text", e.target.value)}
            placeholder={"/screenshots/my-product/01.png\n/screenshots/my-product/02.png"}
          />
        </Field>

        {/* Bilingual content blocks */}
        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-5">
          <div className="mb-4 text-[10px] font-bold tracking-[0.2em] text-accent/60 uppercase">
            {t("productsAdmin.englishSection")}
          </div>
          <div className="space-y-4">
            <Field label={t("productsAdmin.fields.title")}>
              <input
                className={INPUT}
                required
                value={form.title_en}
                onChange={(e) => set("title_en", e.target.value)}
              />
            </Field>
            <Field label={t("productsAdmin.fields.description")}>
              <textarea
                className={TEXTAREA}
                value={form.description_en}
                onChange={(e) => set("description_en", e.target.value)}
              />
            </Field>
            <Field label={t("productsAdmin.fields.problem")}>
              <textarea
                className={TEXTAREA}
                value={form.problem_en}
                onChange={(e) => set("problem_en", e.target.value)}
              />
            </Field>
            <Field label={t("productsAdmin.fields.solution")}>
              <textarea
                className={TEXTAREA}
                value={form.solution_en}
                onChange={(e) => set("solution_en", e.target.value)}
              />
            </Field>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-5">
          <div className="mb-4 text-[10px] font-bold tracking-[0.2em] text-accent/60 uppercase">
            {t("productsAdmin.arabicSection")}
          </div>
          <div className="space-y-4" dir="rtl">
            <Field label={t("productsAdmin.fields.title")}>
              <input
                className={INPUT}
                required
                value={form.title_ar}
                onChange={(e) => set("title_ar", e.target.value)}
              />
            </Field>
            <Field label={t("productsAdmin.fields.description")}>
              <textarea
                className={TEXTAREA}
                value={form.description_ar}
                onChange={(e) => set("description_ar", e.target.value)}
              />
            </Field>
            <Field label={t("productsAdmin.fields.problem")}>
              <textarea
                className={TEXTAREA}
                value={form.problem_ar}
                onChange={(e) => set("problem_ar", e.target.value)}
              />
            </Field>
            <Field label={t("productsAdmin.fields.solution")}>
              <textarea
                className={TEXTAREA}
                value={form.solution_ar}
                onChange={(e) => set("solution_ar", e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* Display controls */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("productsAdmin.fields.sortOrder")} hint={t("productsAdmin.hints.sortOrder")}>
            <input
              className={INPUT}
              type="number"
              value={form.sort_order}
              onChange={(e) => set("sort_order", e.target.value)}
            />
          </Field>
          <Field label={t("productsAdmin.fields.visibility")}>
            <label className="flex items-center gap-3 text-sm text-white/50 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_visible}
                onChange={(e) => set("is_visible", e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-[#0a0a0a] accent-accent"
              />
              {t("productsAdmin.visibleLabel")}
            </label>
          </Field>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/[0.08] px-4 py-2 text-[12px] font-semibold text-white/40 hover:text-white cursor-pointer"
          >
            {t("settings.modals.cancel")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent px-5 py-2 text-[12px] font-bold text-white hover:bg-medium-blue disabled:opacity-50 cursor-pointer"
          >
            {saving
              ? t("settings.modals.saving")
              : isEdit
              ? t("settings.modals.update")
              : t("settings.modals.create")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Confirmation modal for hard-delete. Visibility-toggle uses an inline
 * button; only deletion needs a deliberate confirmation step since it's
 * irreversible.
 */
function ConfirmDeleteModal({ product, onClose, onConfirmed }) {
  const t = useT();
  const [busy, setBusy] = useState(false);

  /** Issue the delete request, then notify the parent on success. */
  async function handleDelete() {
    setBusy(true);
    try {
      await apiAdminDeleteProduct(product.id);
      onConfirmed();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={t("productsAdmin.confirmDelete")} onClose={onClose}>
      <p className="text-[13px] text-white/50">
        {t("productsAdmin.confirmDeleteBody", { name: product.title_en })}
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-white/[0.08] px-4 py-2 text-[12px] font-semibold text-white/40 hover:text-white cursor-pointer"
        >
          {t("settings.modals.cancel")}
        </button>
        <button
          onClick={handleDelete}
          disabled={busy}
          className="rounded-lg bg-red-500/80 px-5 py-2 text-[12px] font-bold text-white hover:bg-red-500 disabled:opacity-50 cursor-pointer"
        >
          {busy ? t("settings.modals.saving") : t("productsAdmin.deleteAction")}
        </button>
      </div>
    </Modal>
  );
}

/**
 * Admin content-management page for products. Lists every product (visible
 * + hidden), exposes inline visibility toggles, and routes create/edit
 * actions through the form modal. Hard-delete requires a confirmation.
 */
export default function ProductsManagementPage() {
  const t = useT();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const loadProducts = useCallback(async () => {
    const list = await apiAdminListProducts();
    setProducts(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  /** Flip visibility on one product without opening the editor. */
  async function toggleVisibility(p) {
    await apiAdminUpdateProduct(p.id, { is_visible: !p.is_visible });
    await loadProducts();
  }

  /** Modal-saved callback — close and refetch. */
  function handleSaved() {
    setModal(null);
    loadProducts();
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
      {/* Top nav */}
      <nav className="border-b border-white/[0.04] bg-[#0a0a0a]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-2 text-[13px] font-medium text-white/35 transition-colors hover:text-white"
            >
              <ArrowLeft size={14} />
              {t("settings.home")}
            </Link>
            <div className="h-5 w-px bg-white/[0.08]" />
            <span className="font-display text-sm font-bold tracking-[0.05em] text-white uppercase">
              {t("settings.title")}
            </span>
          </div>
          <UserMenu variant="bold" />
        </div>
      </nav>

      {/* Settings sub-nav */}
      <div className="border-b border-white/[0.04] bg-[#0a0a0a]">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-6 lg:px-10">
          <Link
            to="/settings"
            className="border-b-2 border-transparent px-3 py-3 text-[12px] font-semibold tracking-[0.1em] text-white/40 uppercase transition-colors hover:text-white"
          >
            {t("settings.tabs.users")}
          </Link>
          <Link
            to="/settings/products"
            className="border-b-2 border-accent px-3 py-3 text-[12px] font-semibold tracking-[0.1em] text-white uppercase"
          >
            {t("settings.tabs.products")}
          </Link>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xs font-semibold tracking-[0.3em] text-accent/60 uppercase">
            {t("productsAdmin.headerTitle")} ({products.length})
          </h2>
          <button
            onClick={() => setModal({ type: "create" })}
            className="flex items-center gap-2 rounded-lg bg-accent/[0.08] border border-accent/15 px-4 py-2 text-[11px] font-bold tracking-[0.08em] text-accent uppercase transition-all hover:bg-accent/15 cursor-pointer"
          >
            <Plus size={14} />
            {t("productsAdmin.addProduct")}
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111111]">
          {/* Header */}
          <div className="hidden border-b border-white/[0.04] px-6 py-3 md:grid md:grid-cols-[40px_2fr_1.2fr_70px_70px_180px] md:items-center md:gap-4">
            <div />
            {["title", "slug", "order", "status", "actions"].map((col) => (
              <div
                key={col}
                className="text-[10px] font-bold tracking-[0.15em] text-white/20 uppercase"
              >
                {t(`productsAdmin.columns.${col}`)}
              </div>
            ))}
          </div>

          {/* Rows */}
          {products.length === 0 && (
            <div className="px-6 py-16 text-center text-[13px] text-white/30">
              {t("productsAdmin.emptyState")}
            </div>
          )}

          {products.map((p) => {
            const Icon = getProductIcon(p.icon_name);
            return (
              <div
                key={p.id}
                className="border-b border-white/[0.04] last:border-b-0 px-6 py-4 md:grid md:grid-cols-[40px_2fr_1.2fr_70px_70px_180px] md:items-center md:gap-4"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/[0.06] text-accent">
                  <Icon size={18} strokeWidth={1.5} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{p.title_en}</div>
                  <div className="mt-0.5 line-clamp-1 text-[12px] text-white/35">
                    {p.description_en}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-white/25">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-accent"
                    >
                      <ExternalLink size={11} />
                      {t("productsAdmin.openLive")}
                    </a>
                    {p.video_url && (
                      <span className="inline-flex items-center gap-1 text-white/35">
                        <Film size={11} /> {t("productsAdmin.hasVideo")}
                      </span>
                    )}
                    {p.screenshots && p.screenshots.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-white/35">
                        <ImageIcon size={11} /> {p.screenshots.length}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-[12px] text-white/40 font-mono">{p.slug}</div>
                <div className="text-[13px] text-white/40 tabular-nums">{p.sort_order}</div>
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                      p.is_visible
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-white/[0.05] text-white/30"
                    }`}
                  >
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${
                        p.is_visible ? "bg-emerald-400" : "bg-white/30"
                      }`}
                    />
                    {p.is_visible ? t("productsAdmin.visible") : t("productsAdmin.hidden")}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleVisibility(p)}
                    className="rounded-lg p-2 text-white/20 hover:bg-white/[0.05] hover:text-white/60 cursor-pointer"
                    title={p.is_visible ? t("productsAdmin.hideAction") : t("productsAdmin.showAction")}
                  >
                    {p.is_visible ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => setModal({ type: "edit", product: p })}
                    className="rounded-lg p-2 text-white/20 hover:bg-white/[0.05] hover:text-white/60 cursor-pointer"
                    title={t("settings.actions.edit")}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setModal({ type: "delete", product: p })}
                    className="rounded-lg p-2 text-white/20 hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                    title={t("productsAdmin.deleteAction")}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {modal?.type === "create" && (
        <ProductFormModal onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
      {modal?.type === "edit" && (
        <ProductFormModal
          product={modal.product}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
      {modal?.type === "delete" && (
        <ConfirmDeleteModal
          product={modal.product}
          onClose={() => setModal(null)}
          onConfirmed={handleSaved}
        />
      )}
    </div>
  );
}
