// Generic, schema-light form renderer for the CMS section editor. Walks any
// JSON-ish value and renders an appropriate input. Editing returns a new
// value; the parent owns the section state.
//
// Heuristics keep the UI useful without per-section schemas:
//   - key matches image|avatar|logo|ogImage   → URL input + preview
//   - key matches description|body|quote|...  → textarea
//   - key === enabled / boolean value          → checkbox
//   - typeof === "number"                      → number input
//   - string                                   → text input
//   - array of objects                         → list with add/remove/up/down
//   - array of primitives                      → list of inputs
//   - object                                   → nested fieldset

import {
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { resolveAssetUrl, uploadImage } from "@/lib/api";
import { COURSE_MODE_SUGGESTIONS } from "@/lib/course-modes";
import { ImageCropDialog } from "@/components/admin/ImageCropDialog";

type Json = unknown;

const IMAGE_KEY_RE = /^(image|avatar|logo[^a-z]*|logoUrl|ogImage|src|photo)$/i;
// Person photos get the circular WhatsApp-style crop tool before upload.
const AVATAR_KEY_RE = /^(avatar|photo)$/i;
const URL_KEY_RE = /^(href|to|ctaHref|primaryHref|secondaryHref|brochureUrl|canonical)$/i;
const MODE_SINGLE_KEY_RE = /^mode$/i;
const MODE_ARRAY_KEY_RE = /^modes$/i;
const DATE_KEY_RE = /date$/i;
const LONG_TEXT_KEY_RE =
  /^(description|body|quote|consent|bio|address|tagline|copyright|subtitle|content|expertise)$/i;

function humanize(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
    // Common acronyms that shouldn't be title-cased.
    .replace(/\b(Lpa|Url|Cta|Faq|Seo|Id|Emi|Isa)\b/g, (m) => m.toUpperCase());
}

function emptyLikeOf(sample: Json): Json {
  if (Array.isArray(sample)) {
    if (sample.length > 0) return cloneEmpty(sample[0]);
    return "";
  }
  if (sample && typeof sample === "object") {
    const out: Record<string, Json> = {};
    for (const [k, v] of Object.entries(sample as Record<string, Json>)) {
      out[k] = cloneEmpty(v);
    }
    return out;
  }
  return cloneEmpty(sample);
}

function cloneEmpty(v: Json): Json {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return "";
  if (typeof v === "number") return 0;
  if (typeof v === "boolean") return false;
  if (Array.isArray(v)) return [];
  if (typeof v === "object") {
    const out: Record<string, Json> = {};
    for (const [k, vv] of Object.entries(v as Record<string, Json>)) {
      out[k] = cloneEmpty(vv);
    }
    return out;
  }
  return "";
}

type FieldProps = {
  label: string;
  fieldKey: string;
  value: Json;
  onChange: (next: Json) => void;
  /** Sample (existing first item or current value) used to construct new array entries. */
  sampleForNew?: Json;
};

function PrimitiveField({ label, fieldKey, value, onChange }: FieldProps) {
  const isImage = IMAGE_KEY_RE.test(fieldKey);
  const isUrl = URL_KEY_RE.test(fieldKey);
  const isLong = LONG_TEXT_KEY_RE.test(fieldKey);

  if (typeof value === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        <span className="font-medium text-foreground">{label}</span>
      </label>
    );
  }

  if (typeof value === "number") {
    return (
      <div>
        <label className="block text-xs font-medium text-muted-foreground">
          {label}
        </label>
        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange(Number.isFinite(n) ? n : 0);
          }}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>
    );
  }

  // string-ish
  const stringValue = typeof value === "string" ? value : "";

  if (MODE_SINGLE_KEY_RE.test(fieldKey)) {
    return (
      <SingleModeField
        label={label}
        value={stringValue}
        onChange={(v) => onChange(v)}
      />
    );
  }

  if (DATE_KEY_RE.test(fieldKey)) {
    return (
      <div>
        <label className="block text-xs font-medium text-muted-foreground">
          {label}
        </label>
        <input
          type="date"
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <p className="mt-1 text-[10px] text-muted-foreground">
          Leave blank for rolling / flexible intake.
        </p>
      </div>
    );
  }

  if (isImage) {
    return (
      <ImageField
        label={label}
        value={stringValue}
        onChange={onChange}
        circleCrop={AVATAR_KEY_RE.test(fieldKey)}
      />
    );
  }

  if (isLong) {
    return (
      <div>
        <label className="block text-xs font-medium text-muted-foreground">
          {label}
        </label>
        <textarea
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>
    );
  }

  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <input
        type={isUrl ? "url" : "text"}
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Course mode selectors — tappable chips instead of free-text. Online/Offline
// are presets; any other value already in use is shown as a chip too, and new
// modes can be added inline (keeps modes dynamic without a code change).
// ────────────────────────────────────────────────────────────────────────────

function ModeChip({
  mode,
  selected,
  onClick,
}: {
  mode: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        selected
          ? "border-brand-purple bg-brand-purple text-white shadow-sm"
          : "border-border bg-background text-foreground/80 hover:border-brand-purple/50 hover:text-foreground",
      ].join(" ")}
    >
      {selected && <Check className="h-3.5 w-3.5" />}
      {mode}
    </button>
  );
}

// Single delivery mode (e.g. an `upcoming_courses` card) — pick exactly one.
function SingleModeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const options = useMemo(() => {
    const set = [...COURSE_MODE_SUGGESTIONS] as string[];
    if (value && !set.includes(value)) set.push(value);
    return set;
  }, [value]);

  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        {options.map((m) => (
          <ModeChip
            key={m}
            mode={m}
            selected={value === m}
            onClick={() => onChange(m)}
          />
        ))}
      </div>
    </div>
  );
}

// Multiple delivery modes (e.g. a catalog course's `modes`) — pick any.
function ModesMultiField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const selected = Array.isArray(value) ? value : [];
  const options = useMemo(() => {
    const set = [...COURSE_MODE_SUGGESTIONS] as string[];
    for (const m of selected) if (!set.includes(m)) set.push(m);
    return set;
  }, [selected]);

  const toggle = (mode: string) => {
    if (selected.includes(mode)) {
      onChange(selected.filter((m) => m !== mode));
    } else {
      onChange([...selected, mode]);
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        {options.map((m) => (
          <ModeChip
            key={m}
            mode={m}
            selected={selected.includes(m)}
            onClick={() => toggle(m)}
          />
        ))}
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground">
        Tap to toggle which modes this course is offered in.
      </p>
    </div>
  );
}

function ImageField({
  label,
  value,
  onChange,
  circleCrop,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  /** When true, selecting a file opens a circular crop tool before upload. */
  circleCrop?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const previewSrc = value ? resolveAssetUrl(value) : "";

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const res = await uploadImage(file);
      if (!res.ok) {
        toast.error(res.error || "Upload failed");
        return;
      }
      onChange(res.url);
      toast.success("Image uploaded");
    } finally {
      setUploading(false);
    }
  };

  const handleFile = async (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Images must be smaller than 5 MB.");
      return;
    }
    // Avatars/photos go through the crop tool first; everything else uploads
    // as-is.
    if (circleCrop) {
      setCropSrc(URL.createObjectURL(file));
      return;
    }
    await uploadFile(file);
  };

  const closeCrop = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="block text-xs font-medium text-muted-foreground">
          {label}
        </label>
        <span className="text-[10px] text-muted-foreground/80">
          PNG · JPG · WebP · SVG · max 5 MB
        </span>
      </div>

      <div
        className={[
          "mt-1.5 flex flex-col gap-3 rounded-xl border border-dashed bg-background p-3 transition sm:flex-row sm:items-center",
          dragOver
            ? "border-brand-purple bg-brand-purple/5"
            : "border-border",
        ].join(" ")}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          void handleFile(file ?? null);
        }}
      >
        <div className="flex shrink-0 items-center justify-center">
          {previewSrc ? (
            <div
              className={[
                "group relative h-20 w-20 overflow-hidden ring-1 ring-border",
                circleCrop ? "rounded-full" : "rounded-lg",
              ].join(" ")}
            >
              <img
                src={previewSrc}
                alt="preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.opacity = "0.25";
                }}
              />
              <button
                type="button"
                onClick={() => onChange("")}
                title="Clear image"
                aria-label="Clear image"
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          ) : (
            <div
              className={[
                "flex h-20 w-20 items-center justify-center border border-dashed border-border bg-muted/40 text-muted-foreground",
                circleCrop ? "rounded-full" : "rounded-lg",
              ].join(" ")}
            >
              <Upload className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <input
            type="url"
            value={value}
            placeholder="https://…/image.jpg or /uploads/…"
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-brand-purple focus:outline-none"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                void handleFile(file);
                if (fileRef.current) fileRef.current.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-purple px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Upload image
                </>
              )}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Clear
              </button>
            )}
            <span className="text-[10px] text-muted-foreground">
              or drop a file here
            </span>
          </div>
        </div>
      </div>

      {circleCrop && cropSrc && (
        <ImageCropDialog
          open={!!cropSrc}
          onOpenChange={(o) => {
            if (!o) closeCrop();
          }}
          src={cropSrc}
          onCropped={async (blob) => {
            const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
            await uploadFile(file);
            closeCrop();
          }}
        />
      )}
    </div>
  );
}

type ArrayFieldProps = FieldProps & {
  /** Hidden keys for each item's nested object editor (e.g. hide `mode` when a
   *  parent group already pins it). */
  omitKeys?: string[];
  /** Fields merged into every newly-added item (e.g. preset `mode`). */
  presetItem?: Record<string, Json>;
  /** When true, skip the Online/Offline grouped rendering (used by the grouped
   *  sub-lists themselves to avoid infinite recursion). */
  disableModeGrouping?: boolean;
};

function ArrayField({
  label,
  fieldKey,
  value,
  onChange,
  sampleForNew,
  omitKeys,
  presetItem,
  disableModeGrouping,
}: ArrayFieldProps) {
  const arr = Array.isArray(value) ? value : [];

  // Course delivery modes: render as a compact chip multi-select rather than
  // the generic add/remove list of text inputs.
  if (
    MODE_ARRAY_KEY_RE.test(fieldKey) &&
    arr.every((m) => typeof m === "string")
  ) {
    return (
      <ModesMultiField
        label={label}
        value={arr as string[]}
        onChange={(next) => onChange(next)}
      />
    );
  }

  const isObjectArr = arr.length > 0 && typeof arr[0] === "object" && arr[0] !== null && !Array.isArray(arr[0]);

  // Course showcase: items each carry a single Online/Offline `mode`. Render
  // them as two clearly-separated sections so the admin manages Online and
  // Offline courses independently.
  const isModeGrouped =
    !disableModeGrouping &&
    isObjectArr &&
    arr.every(
      (item) =>
        typeof (item as Record<string, Json>).mode === "string",
    );
  if (isModeGrouped) {
    return (
      <ModeGroupedArray
        label={label}
        fieldKey={fieldKey}
        value={arr}
        onChange={onChange}
      />
    );
  }

  const add = () => {
    const sample = arr.length > 0 ? arr[0] : sampleForNew;
    let next: Json =
      arr.length > 0 || sampleForNew != null ? cloneEmpty(sample) : "";
    if (presetItem && next && typeof next === "object" && !Array.isArray(next)) {
      next = { ...(next as Record<string, Json>), ...presetItem };
    }
    onChange([...arr, next]);
  };

  const remove = (idx: number) => onChange(arr.filter((_, i) => i !== idx));

  const swap = (a: number, b: number) => {
    if (b < 0 || b >= arr.length) return;
    const next = [...arr];
    [next[a], next[b]] = [next[b], next[a]];
    onChange(next);
  };

  const setAt = (idx: number, v: Json) => {
    const next = [...arr];
    next[idx] = v;
    onChange(next);
  };

  // Use first item's "name"/"title"/"label" as a card heading when present.
  const itemTitle = (item: Json, i: number): string => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const o = item as Record<string, Json>;
      const candidate = o.name ?? o.title ?? o.label ?? o.heading;
      if (typeof candidate === "string" && candidate.trim()) return candidate;
    }
    return `${humanize(fieldKey).replace(/s$/, "")} #${i + 1}`;
  };

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-foreground">
          {label}
          <span className="ml-2 rounded-full bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border">
            {arr.length} item{arr.length === 1 ? "" : "s"}
          </span>
        </div>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 rounded-lg bg-brand-purple px-2.5 py-1 text-xs font-semibold text-white transition hover:brightness-110"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {arr.length === 0 && (
        <p className="rounded-lg border border-dashed border-border bg-card/60 px-3 py-4 text-center text-xs text-muted-foreground">
          No {humanize(fieldKey).toLowerCase()} yet — click "Add" to create one.
        </p>
      )}

      <div className="space-y-2.5">
        {arr.map((item, i) => (
          <details
            key={i}
            open={isObjectArr ? i === 0 : true}
            className="group rounded-lg border border-border bg-card shadow-sm"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-t-lg px-3 py-2 hover:bg-muted/50">
              <span className="flex min-w-0 items-center gap-2">
                {isObjectArr && (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition group-open:rotate-180" />
                )}
                <span className="truncate text-xs font-semibold text-foreground">
                  {itemTitle(item, i)}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-0.5">
                <IconBtn
                  title="Move up"
                  disabled={i === 0}
                  onClick={(e) => {
                    e.preventDefault();
                    swap(i, i - 1);
                  }}
                >
                  <ChevronUp className="h-4 w-4" />
                </IconBtn>
                <IconBtn
                  title="Move down"
                  disabled={i === arr.length - 1}
                  onClick={(e) => {
                    e.preventDefault();
                    swap(i, i + 1);
                  }}
                >
                  <ChevronDown className="h-4 w-4" />
                </IconBtn>
                <IconBtn
                  title="Remove"
                  destructive
                  onClick={(e) => {
                    e.preventDefault();
                    if (confirm(`Remove "${itemTitle(item, i)}"?`)) remove(i);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </IconBtn>
              </span>
            </summary>
            <div className="border-t border-border px-3 py-3">
              {isObjectArr ? (
                <ObjectFields
                  value={item as Record<string, Json>}
                  onChange={(next) => setAt(i, next)}
                  omitKeys={omitKeys}
                />
              ) : (
                <PrimitiveField
                  label="Value"
                  fieldKey={fieldKey}
                  value={item}
                  onChange={(next) => setAt(i, next)}
                />
              )}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

// Renders a course list (items each carrying a single `mode`) as two separate
// Online / Offline sections, so an admin clearly manages each. The underlying
// data stays one flat array — each item keeps its own `mode`; only the editing
// UI is split.
function ModeGroupedArray({
  label,
  fieldKey,
  value,
  onChange,
}: {
  label: string;
  fieldKey: string;
  value: Json[];
  onChange: (next: Json) => void;
}) {
  const arr = value as Record<string, Json>[];
  const sample = arr[0];
  const modeOf = (item: Record<string, Json>) =>
    String(item.mode ?? "").toLowerCase();
  const inMode = (mode: string) =>
    arr.filter((item) => modeOf(item) === mode.toLowerCase());
  // Items with an unexpected mode are preserved untouched at the end.
  const others = arr.filter(
    (item) => !["online", "offline"].includes(modeOf(item)),
  );

  const rebuild = (mode: "Online" | "Offline", nextSubset: Json) => {
    const online = mode === "Online" ? (nextSubset as Json[]) : inMode("Online");
    const offline =
      mode === "Offline" ? (nextSubset as Json[]) : inMode("Offline");
    onChange([...online, ...offline, ...others]);
  };

  const GROUPS: Array<{ mode: "Online" | "Offline"; title: string }> = [
    { mode: "Online", title: "Online Courses" },
    { mode: "Offline", title: "Offline Courses" },
  ];

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-foreground">{label}</div>
      {GROUPS.map(({ mode, title }) => (
        <ArrayField
          key={mode}
          label={title}
          fieldKey={fieldKey}
          value={inMode(mode)}
          onChange={(next) => rebuild(mode, next)}
          sampleForNew={sample}
          presetItem={{ mode }}
          omitKeys={["mode"]}
          disableModeGrouping
        />
      ))}
    </div>
  );
}

function IconBtn({
  title,
  onClick,
  disabled,
  destructive,
  children,
}: {
  title: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  destructive?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={[
        "rounded-md p-1.5 transition disabled:cursor-not-allowed disabled:opacity-30",
        destructive
          ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function ObjectFields({
  value,
  onChange,
  omitKeys,
}: {
  value: Record<string, Json>;
  onChange: (next: Record<string, Json>) => void;
  /** Keys to hide from the editor (their values are preserved untouched). */
  omitKeys?: string[];
}) {
  const setKey = (k: string, v: Json) => onChange({ ...value, [k]: v });

  return (
    <div className="space-y-3">
      {Object.entries(value)
        .filter(([k]) => !(k === "badge" && "titleStart" in value))
        .filter(([k]) => !omitKeys?.includes(k))
        .map(([k, v]) => {
        const label = humanize(k);
        if (Array.isArray(v)) {
          return (
            <ArrayField
              key={k}
              label={label}
              fieldKey={k}
              value={v}
              onChange={(next) => setKey(k, next)}
            />
          );
        }
        if (v && typeof v === "object") {
          return (
            <div
              key={k}
              className="rounded-xl border border-border bg-muted/40 p-3 sm:p-4"
            >
              <div className="mb-3 text-sm font-semibold text-foreground">
                {label}
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <ObjectFields
                  value={v as Record<string, Json>}
                  onChange={(next) => setKey(k, next)}
                />
              </div>
            </div>
          );
        }
        return (
          <PrimitiveField
            key={k}
            label={label}
            fieldKey={k}
            value={v}
            onChange={(next) => setKey(k, next)}
          />
        );
      })}
    </div>
  );
}

export function CmsFieldEditor({
  value,
  onChange,
}: {
  value: Record<string, Json>;
  onChange: (next: Record<string, Json>) => void;
}) {
  return <ObjectFields value={value} onChange={onChange} />;
}

// Toggle button + raw JSON fallback for power users.
export function CmsRawEditor({
  value,
  onChange,
}: {
  value: Record<string, Json>;
  onChange: (next: Record<string, Json>) => void;
}) {
  const [draft, setDraft] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | null>(null);

  // Re-sync draft when value changes from the outside (e.g. after Save).
  const valueKey = useMemo(() => JSON.stringify(value), [value]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => {
    setDraft(JSON.stringify(value, null, 2));
    setError(null);
  }, [valueKey]);

  return (
    <div>
      <textarea
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          try {
            const parsed = JSON.parse(e.target.value);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
              onChange(parsed);
              setError(null);
            } else {
              setError("Top-level value must be a JSON object");
            }
          } catch (err) {
            setError((err as Error).message);
          }
        }}
        spellCheck={false}
        className="h-[60vh] w-full rounded-lg border border-border bg-background p-3 font-mono text-xs leading-relaxed focus:border-primary focus:outline-none"
      />
      {error && <p className="mt-2 text-xs text-red-600">JSON: {error}</p>}
    </div>
  );
}
