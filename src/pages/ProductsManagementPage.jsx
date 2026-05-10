import { useEffect, useRef, useState, useCallback } from "react";
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
  Upload,
  FileText,
  Presentation,
} from "lucide-react";
import UserMenu from "../components/UserMenu";
import { useT } from "../i18n/i18n";
import { getProductIcon, iconOptions } from "../data/icons";
import { INDUSTRIES } from "../data/industries";
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

// Each phase row + deliverable row is fixed-count to match the modal's 2x2 /
// 4-column grid. Bumping these requires updating the modal's grid classes too.
const PHASE_COUNT = 4;
const DELIVERABLE_COUNT = 4;

/** Build a fresh array of empty phase rows, used as form-state default. */
const emptyPhases = () =>
  Array.from({ length: PHASE_COUNT }, () => ({ name: "", caption: "" }));

/** Build a fresh array of empty deliverable strings. */
const emptyDeliverables = () => Array.from({ length: DELIVERABLE_COUNT }, () => "");

/**
 * Default form payload for the create flow. Edit flow seeds from the
 * selected product instead. ``problem_*`` / ``solution_*`` / ``video_url``
 * are intentionally absent — they're no longer rendered in the form (the
 * landing-page modal stopped using them) but the DB columns still exist,
 * so omitting them from the partial-update payload preserves any prior
 * values untouched.
 */
const EMPTY_FORM = {
  slug: "",
  icon_name: "Package",
  url: "",
  screenshots: [],
  is_visible: true,
  sort_order: 0,
  title_en: "",
  title_ar: "",
  description_en: "",
  description_ar: "",
  phases_en: emptyPhases(),
  phases_ar: emptyPhases(),
  deliverables_en: emptyDeliverables(),
  deliverables_ar: emptyDeliverables(),
  // PPT state for the create flow: nothing uploaded, send both as null.
  // Edit flow overrides ppt_data to `undefined` so the heavy column is
  // left untouched in the DB unless the admin actively replaces or
  // removes the file. JSON.stringify drops `undefined` keys, so the
  // server only sees ppt_data when it actually changes.
  ppt_filename: null,
  ppt_data: null,
  industries: [],
};

// Screenshots are stored as base64 data URIs in the DB JSONB array, capped
// per file so an admin can't accidentally inflate a row to several megabytes.
// 1.5MB is generous for a UI screenshot (a 1920×1080 PNG is typically well
// under 1MB) but small enough that 4 of them stay under the 8MB JSON
// payload most servers tolerate without tuning.
const MAX_SCREENSHOT_BYTES = 1.5 * 1024 * 1024;

// PowerPoint sample cap. 25MB raw (~33MB base64) covers most decks with
// embedded images. Anything larger should probably live on object storage,
// not as a JSON payload.
const MAX_PPT_BYTES = 25 * 1024 * 1024;

const PPT_MIME_TYPES = [
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

/** Accept .ppt / .pptx files by mime OR extension (some browsers report empty type). */
function isPptFile(file) {
  if (PPT_MIME_TYPES.includes(file.type)) return true;
  const lower = file.name.toLowerCase();
  return lower.endsWith(".ppt") || lower.endsWith(".pptx");
}

/**
 * Pad or truncate an array of phase objects to exactly PHASE_COUNT entries.
 * Anything missing is filled with empty rows so the editor always renders
 * the full grid; anything extra is dropped.
 */
function normalisePhases(arr) {
  const list = Array.isArray(arr) ? arr : [];
  return Array.from({ length: PHASE_COUNT }, (_, i) => ({
    name: (list[i] && list[i].name) || "",
    caption: (list[i] && list[i].caption) || "",
  }));
}

/** Same idea as normalisePhases, but for the flat string list. */
function normaliseDeliverables(arr) {
  const list = Array.isArray(arr) ? arr : [];
  return Array.from({ length: DELIVERABLE_COUNT }, (_, i) => list[i] || "");
}

/**
 * Convert a product API object into the flat form-state shape used by the
 * editor. Phases + deliverables are normalised to fixed length so the
 * editor renders consistent rows. ``screenshots`` is an array of strings
 * (URLs or base64 data URIs) used directly by the upload widget.
 */
function productToForm(p) {
  return {
    ...EMPTY_FORM,
    ...p,
    screenshots: Array.isArray(p.screenshots) ? p.screenshots : [],
    phases_en: normalisePhases(p.phases_en),
    phases_ar: normalisePhases(p.phases_ar),
    deliverables_en: normaliseDeliverables(p.deliverables_en),
    deliverables_ar: normaliseDeliverables(p.deliverables_ar),
    // ppt_filename comes back from the API; ppt_data is deferred and never
    // returned, so leave it `undefined` to mean "don't change". The admin
    // upload/remove handlers flip it to a base64 string or explicit null.
    ppt_filename: p.ppt_filename || null,
    ppt_data: undefined,
    industries: Array.isArray(p.industries) ? p.industries : [],
  };
}

/**
 * Normalise the form-state shape into an API payload. Screenshots are
 * already an array (URLs or base64 data URIs), so we just coerce the
 * sort_order to a number and ship the rest as-is.
 */
function formToPayload(form) {
  return {
    ...form,
    sort_order: Number(form.sort_order) || 0,
  };
}

/**
 * Read a File as a base64 data URI suitable for storing in the DB and
 * rendering as an `<img src>` directly. Wraps FileReader's callback API.
 */
function fileToDataUri(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
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
 * Drag-drop + click-to-browse uploader for product screenshots. Files are
 * converted to base64 data URIs in the browser and appended to the value
 * array, so submission is a single PUT — no separate upload endpoint
 * needed. Existing URL-shaped values render the same way (an `<img src>`
 * accepts both data URIs and remote URLs), so existing rows keep working.
 */
function ScreenshotsField({ value, onChange, t }) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);

  /** Validate, base64-encode, and append a batch of files to the value. */
  async function handleFiles(fileList) {
    setError("");
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const accepted = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError(t("productsAdmin.screenshots.errorNotImage", { name: file.name }));
        continue;
      }
      if (file.size > MAX_SCREENSHOT_BYTES) {
        setError(t("productsAdmin.screenshots.errorTooLarge", { name: file.name }));
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length === 0) return;

    setBusy(true);
    try {
      const dataUris = await Promise.all(accepted.map(fileToDataUri));
      onChange([...value, ...dataUris]);
    } catch {
      setError(t("productsAdmin.screenshots.errorRead"));
    } finally {
      setBusy(false);
    }
  }

  function handleRemove(idx) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          // Reset so picking the same file twice in a row still fires onChange.
          e.target.value = "";
        }}
      />

      {/* Drop zone — clicking anywhere triggers the file picker; dragging
          a file over it adds an active border so the user knows the drop
          will be accepted. */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!dragOver) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-all cursor-pointer ${
          dragOver
            ? "border-accent/60 bg-accent/[0.06]"
            : "border-white/[0.08] bg-white/[0.015] hover:border-accent/30 hover:bg-accent/[0.03]"
        } ${busy ? "opacity-60 pointer-events-none" : ""}`}
      >
        <Upload size={20} className="text-white/35" strokeWidth={1.5} />
        <p className="mt-3 text-[13px] font-medium text-white/55">
          {t("productsAdmin.screenshots.dropPrimary")}
        </p>
        <p className="mt-1 text-[11px] text-white/30">
          {t("productsAdmin.screenshots.dropSecondary")}
        </p>
      </button>

      {error && (
        <p className="mt-2 text-[11px] text-red-400">{error}</p>
      )}

      {value.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((src, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-lg border border-white/[0.08] bg-[#0a0a0a]"
            >
              <img
                src={src}
                alt={`Screenshot ${idx + 1}`}
                className="aspect-video w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                aria-label={t("productsAdmin.screenshots.removeAriaLabel")}
                className="absolute end-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white/80 opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/90 hover:text-white group-hover:opacity-100 focus:opacity-100 cursor-pointer"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
              <span className="absolute start-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white/70 backdrop-blur-sm">
                {String(idx + 1).padStart(2, "0")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Single-file uploader for a sample PowerPoint. Encodes the picked file as
 * a base64 data URI in the browser and stores it on the form alongside the
 * filename. When a file is already attached, the drop zone is replaced
 * with a compact "currently attached" row that shows filename + size and
 * an X button to clear it. Clearing sets both fields to `null` explicitly
 * so the partial-update payload tells the backend to wipe the column.
 */
function PptField({ filename, dataDirty, onUpload, onRemove, t }) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file) {
    setError("");
    if (!isPptFile(file)) {
      setError(t("productsAdmin.presentation.errorNotPpt", { name: file.name }));
      return;
    }
    if (file.size > MAX_PPT_BYTES) {
      setError(t("productsAdmin.presentation.errorTooLarge", { name: file.name }));
      return;
    }
    setBusy(true);
    try {
      const dataUri = await fileToDataUri(file);
      onUpload(file.name, dataUri);
    } catch {
      setError(t("productsAdmin.presentation.errorRead"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {filename ? (
        // Attached file row — clicking Replace re-opens the picker, X clears.
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.015] p-4">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Presentation size={18} strokeWidth={1.5} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-white">
              {filename}
            </div>
            <div className="mt-0.5 text-[11px] text-white/35">
              {dataDirty
                ? t("productsAdmin.presentation.willUpload")
                : t("productsAdmin.presentation.currentlyAttached")}
            </div>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-md border border-white/[0.08] px-3 py-1.5 text-[11px] font-bold tracking-[0.08em] text-white/60 uppercase transition-colors hover:border-accent/30 hover:text-white cursor-pointer"
          >
            {t("productsAdmin.presentation.replace")}
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={t("productsAdmin.presentation.removeAriaLabel")}
            className="flex h-8 w-8 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!dragOver) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-7 text-center transition-all cursor-pointer ${
            dragOver
              ? "border-accent/60 bg-accent/[0.06]"
              : "border-white/[0.08] bg-white/[0.015] hover:border-accent/30 hover:bg-accent/[0.03]"
          } ${busy ? "opacity-60 pointer-events-none" : ""}`}
        >
          <FileText size={20} className="text-white/35" strokeWidth={1.5} />
          <p className="mt-3 text-[13px] font-medium text-white/55">
            {t("productsAdmin.presentation.dropPrimary")}
          </p>
          <p className="mt-1 text-[11px] text-white/30">
            {t("productsAdmin.presentation.dropSecondary")}
          </p>
        </button>
      )}

      {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

/**
 * One language's worth of editable fields: title, description, the four
 * phase rows, and the four deliverable inputs. Used twice inside
 * ProductFormModal — once for English (LTR) and once for Arabic (RTL) —
 * so the markup is centralised here to keep the two in lock-step.
 */
function BilingualBlock({ lang, label, dir, form, set, setPhase, setDeliverable, t }) {
  const phases = form[`phases_${lang}`];
  const deliverables = form[`deliverables_${lang}`];

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-5">
      <div className="mb-4 text-[10px] font-bold tracking-[0.2em] text-accent/60 uppercase">
        {label}
      </div>
      <div className="space-y-4" dir={dir}>
        <Field label={t("productsAdmin.fields.title")}>
          <input
            className={INPUT}
            required
            value={form[`title_${lang}`]}
            onChange={(e) => set(`title_${lang}`, e.target.value)}
          />
        </Field>
        <Field label={t("productsAdmin.fields.description")}>
          <textarea
            className={TEXTAREA}
            value={form[`description_${lang}`]}
            onChange={(e) => set(`description_${lang}`, e.target.value)}
          />
        </Field>

        {/* Phases — fixed 4 rows, each with name + caption. The number
            badge mirrors the modal's phase strip so admins can map fields
            to what they'll see on the live page. */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold tracking-[0.1em] text-white/30 uppercase">
            <span>{t("productsAdmin.fields.phases")}</span>
            <span className="text-white/15">— {t("productsAdmin.hints.phases")}</span>
          </div>
          <div className="space-y-2.5">
            {phases.map((phase, idx) => (
              <div
                key={idx}
                className="grid items-start gap-2 sm:grid-cols-[40px_1fr_2fr]"
              >
                <span className="hidden h-9 items-center justify-center rounded-md border border-accent/20 bg-accent/[0.06] text-[10px] font-bold tracking-[0.1em] text-accent sm:flex">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <input
                  className={INPUT}
                  value={phase.name}
                  placeholder={t("productsAdmin.placeholders.phaseName")}
                  onChange={(e) => setPhase(lang, idx, "name", e.target.value)}
                />
                <input
                  className={INPUT}
                  value={phase.caption}
                  placeholder={t("productsAdmin.placeholders.phaseCaption")}
                  onChange={(e) => setPhase(lang, idx, "caption", e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Deliverables — fixed 4 single-line capability statements. */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold tracking-[0.1em] text-white/30 uppercase">
            <span>{t("productsAdmin.fields.deliverables")}</span>
            <span className="text-white/15">— {t("productsAdmin.hints.deliverables")}</span>
          </div>
          <div className="space-y-2.5">
            {deliverables.map((value, idx) => (
              <div
                key={idx}
                className="grid items-start gap-2 sm:grid-cols-[40px_1fr]"
              >
                <span className="hidden h-9 items-center justify-center rounded-md border border-accent/20 bg-accent/[0.06] text-accent sm:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                <input
                  className={INPUT}
                  value={value}
                  placeholder={t("productsAdmin.placeholders.deliverable")}
                  onChange={(e) => setDeliverable(lang, idx, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Create-or-edit product modal. Renders the entire bilingual content set
 * plus URL, screenshots, icon, sort order, and visibility toggle.
 * `problem_*`, `solution_*`, and `video_url` are intentionally absent —
 * the landing-page modal stopped rendering them, so they're hidden from
 * the editor too. The DB columns still exist; partial-update payloads
 * simply don't touch them.
 */
function ProductFormModal({ product, onClose, onSaved }) {
  const t = useT();
  const isEdit = !!product;
  const [form, setForm] = useState(() => (isEdit ? productToForm(product) : EMPTY_FORM));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const icons = iconOptions();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  /** Update a single phase row at index `idx` in either phases_en or _ar. */
  const setPhase = (lang, idx, field, value) =>
    setForm((f) => ({
      ...f,
      [`phases_${lang}`]: f[`phases_${lang}`].map((p, i) =>
        i === idx ? { ...p, [field]: value } : p
      ),
    }));

  /** Update a single deliverable string at index `idx`. */
  const setDeliverable = (lang, idx, value) =>
    setForm((f) => ({
      ...f,
      [`deliverables_${lang}`]: f[`deliverables_${lang}`].map((d, i) =>
        i === idx ? value : d
      ),
    }));

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

        <Field label={t("productsAdmin.fields.screenshots")} hint={t("productsAdmin.hints.screenshots")}>
          <ScreenshotsField
            value={form.screenshots}
            onChange={(next) => set("screenshots", next)}
            t={t}
          />
        </Field>

        <Field label={t("productsAdmin.fields.presentation")} hint={t("productsAdmin.hints.presentation")}>
          <PptField
            filename={form.ppt_filename}
            dataDirty={typeof form.ppt_data === "string"}
            onUpload={(name, dataUri) => {
              setForm((f) => ({ ...f, ppt_filename: name, ppt_data: dataUri }));
            }}
            onRemove={() => {
              // Explicit nulls so the partial-update payload tells the
              // backend to wipe both columns.
              setForm((f) => ({ ...f, ppt_filename: null, ppt_data: null }));
            }}
            t={t}
          />
        </Field>

        {/* Bilingual content blocks. The English and Arabic blocks render
            the same field set; only the dir attribute and locale field
            suffixes differ. Render each via the shared helper below. */}
        <BilingualBlock
          lang="en"
          label={t("productsAdmin.englishSection")}
          dir="ltr"
          form={form}
          set={set}
          setPhase={setPhase}
          setDeliverable={setDeliverable}
          t={t}
        />
        <BilingualBlock
          lang="ar"
          label={t("productsAdmin.arabicSection")}
          dir="rtl"
          form={form}
          set={set}
          setPhase={setPhase}
          setDeliverable={setDeliverable}
          t={t}
        />

        {/* Industries — multi-select toggle pills. Empty array means
            "no industry filter", which the landing page treats as
            "visible under All Industries only". */}
        <Field
          label={t("productsAdmin.fields.industries")}
          hint={t("productsAdmin.hints.industries")}
        >
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map((slug) => {
              const selected = form.industries.includes(slug);
              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => {
                    setForm((f) => ({
                      ...f,
                      industries: selected
                        ? f.industries.filter((s) => s !== slug)
                        : [...f.industries, slug],
                    }));
                  }}
                  className={`rounded-full border px-4 py-1.5 text-[12px] font-bold tracking-[0.06em] transition-all cursor-pointer ${
                    selected
                      ? "border-accent/40 bg-accent/[0.12] text-accent"
                      : "border-white/[0.08] bg-white/[0.015] text-white/45 hover:border-white/15 hover:text-white/70"
                  }`}
                >
                  {t(`industries.${slug}`)}
                </button>
              );
            })}
          </div>
        </Field>

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
