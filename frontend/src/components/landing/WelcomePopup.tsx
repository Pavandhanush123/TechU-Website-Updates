// First-visit welcome popup. Reads its content/config from the CMS
// (`welcome_popup` section). Persists dismissal in localStorage so it
// doesn't pester returning visitors.
//
//   - `enabled: false` → never shows.
//   - `version` is bumped server-side when copy materially changes; the
//     popup re-shows for everyone on a new version.
//   - `showAgainAfterDays` controls cooldown; 0 = once forever.
//   - `delaySeconds` is the wait before the popup appears on first paint.

import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCmsSection } from "@/hooks/useCmsSection";
import { useCourseOptions } from "@/hooks/useCourseOptions";
import {
  resolveAssetUrl,
  submitDemoRequest,
  type WelcomePopupData,
} from "@/lib/api";
import {
  demoRequestSchema,
  sanitizePhone,
  validateField,
  type DemoRequestFormValues,
} from "@/lib/api-schemas";
import { GmailLocalPartField } from "@/components/forms/GmailLocalPartInputRow";
import { sanitizeGmailLocalTyping } from "@/lib/gmail-local-part";

const STORAGE_KEY = "techu.welcome_popup";

const FALLBACK: WelcomePopupData = {
  enabled: true,
  title: "Get a Free 1:1 Counselling Session",
  subtitle:
    "Talk to our admissions team and find the right course in under 10 minutes.",
  badge: "Limited time offer",
  primaryLabel: "Book my free call",
  image: "",
  courseOptions: [
    "Full Stack Development with Claude AI",
    "Data Analytics with AI / ML",
    "UI/UX Designing + Digital Marketing + Graphic Designing with AI",
  ],
  delaySeconds: 4,
  showAgainAfterDays: 7,
  version: 1,
};

type StoredState = {
  dismissedAt: number;
  version: number;
  submitted?: boolean;
};

function readStored(): StoredState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredState;
  } catch {
    return null;
  }
}

function writeStored(state: StoredState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* localStorage may be disabled — popup falls back to per-tab dismissal */
  }
}

function shouldShow(cfg: WelcomePopupData): boolean {
  if (!cfg.enabled) return false;
  const stored = readStored();
  if (!stored) return true;
  // Re-show if the version has been bumped admin-side.
  if (stored.version !== cfg.version) return true;
  // Submitted? Don't show again unless cooldown explicitly elapses.
  if (stored.submitted) {
    if (cfg.showAgainAfterDays <= 0) return false;
    const ageMs = Date.now() - stored.dismissedAt;
    return ageMs > cfg.showAgainAfterDays * 24 * 60 * 60 * 1000;
  }
  // Plain dismissal cooldown.
  if (cfg.showAgainAfterDays <= 0) return false;
  const ageMs = Date.now() - stored.dismissedAt;
  return ageMs > cfg.showAgainAfterDays * 24 * 60 * 60 * 1000;
}

const empty: DemoRequestFormValues = {
  fullName: "",
  email: "",
  phone: "",
  course: "",
};

export function WelcomePopup() {
  const cfg = useCmsSection<WelcomePopupData>("welcome_popup", FALLBACK);
  const [open, setOpen] = useState(false);
  const triggered = useRef(false);

  // Hybrid list: any admin-curated welcome-popup options + built-in courses +
  // published admin-created catalog courses, deduped.
  const courseOptions = useCourseOptions(cfg.courseOptions);

  const [form, setForm] = useState<DemoRequestFormValues>({
    ...empty,
    course: courseOptions[0] ?? "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof DemoRequestFormValues, string>>
  >({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof DemoRequestFormValues, boolean>>
  >({});
  const [submitting, setSubmitting] = useState(false);

  // Schedule the popup once the CMS config has loaded.
  useEffect(() => {
    if (triggered.current) return;
    if (!shouldShow(cfg)) return;
    triggered.current = true;
    const delay = Math.max(0, Number(cfg.delaySeconds) || 0) * 1000;
    const id = window.setTimeout(() => setOpen(true), delay);
    return () => window.clearTimeout(id);
  }, [cfg]);

  // Sync default course when options change.
  useEffect(() => {
    setForm((f) => (f.course ? f : { ...f, course: courseOptions[0] ?? "" }));
  }, [courseOptions]);

  const update = <K extends keyof DemoRequestFormValues>(
    key: K,
    value: DemoRequestFormValues[K],
  ) => {
    setForm((f) => {
      const next = {
        ...f,
        [key]: key === "email" ? sanitizeGmailLocalTyping(String(value)) : value,
      } as DemoRequestFormValues;
      if (touched[key]) {
        const msg = validateField(demoRequestSchema, key, next[key], next);
        setErrors((e) => ({ ...e, [key]: msg }));
      }
      return next;
    });
  };

  const blur = <K extends keyof DemoRequestFormValues>(key: K) => {
    setTouched((t) => ({ ...t, [key]: true }));
    const merged = { ...form };
    if (key === "phone") {
      merged.phone = sanitizePhone(form.phone);
      setForm(merged);
    } else if (key === "email") {
      merged.email = sanitizeGmailLocalTyping(form.email);
      setForm(merged);
    }
    const value =
      key === "phone"
        ? merged.phone
        : key === "email"
          ? merged.email
          : merged[key];
    const msg = validateField(demoRequestSchema, key, value, merged);
    setErrors((e) => ({ ...e, [key]: msg }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = demoRequestSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<
        Record<keyof DemoRequestFormValues, string>
      > = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof DemoRequestFormValues;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      setTouched({
        fullName: true,
        email: true,
        phone: true,
        course: true,
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitDemoRequest({
        ...parsed.data,
        phone: parsed.data.phone.startsWith("+")
          ? parsed.data.phone
          : `+91${parsed.data.phone}`,
      });
      if (!res.ok) {
        toast.error(res.error || "Could not send. Please try again.");
        return;
      }
      writeStored({
        dismissedAt: Date.now(),
        version: cfg.version ?? 1,
        submitted: true,
      });
      toast.success(
        "You're in! Our admissions team will reach out within one working day.",
      );
      setForm({ ...empty, course: courseOptions[0] ?? "" });
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const dismiss = () => {
    writeStored({ dismissedAt: Date.now(), version: cfg.version ?? 1 });
    setOpen(false);
  };

  if (!cfg.enabled) return null;

  const image = cfg.image && cfg.image.trim() ? resolveAssetUrl(cfg.image) : "";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) dismiss();
        else setOpen(true);
      }}
    >
      <DialogContent className="max-w-2xl gap-0 overflow-y-auto p-0">
        <div className="grid sm:grid-cols-[1.05fr_1fr]">
            {/* Left: visual + value prop */}
            <div className="relative hidden overflow-hidden bg-brand-gradient p-6 text-white sm:flex sm:flex-col sm:justify-end">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-brand-grid opacity-40"
              />
              {image && (
                <img
                  src={image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-luminosity"
                />
              )}
              <div className="relative">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" />
                  {cfg.badge}
                </span>
                <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight lg:text-3xl">
                  {cfg.title}
                </h2>
                <p className="mt-3 text-sm text-white/90">{cfg.subtitle}</p>
                <ul className="mt-5 space-y-2 text-sm text-white/85">
                  <li className="flex items-center gap-2">
                    <Dot /> 95% placement support
                  </li>
                  <li className="flex items-center gap-2">
                    <Dot /> Live mentor-led classes
                  </li>
                  <li className="flex items-center gap-2">
                    <Dot /> EMI options available
                  </li>
                </ul>
              </div>
            </div>

            {/* Right: form */}
            <div className="p-6 sm:p-7">
              <DialogHeader className="sm:hidden">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-purple/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-purple">
                  <Sparkles className="h-3 w-3" /> {cfg.badge}
                </span>
                <DialogTitle className="mt-2 text-lg leading-tight">
                  {cfg.title}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {cfg.subtitle}
                </DialogDescription>
              </DialogHeader>

              <DialogHeader className="hidden sm:block">
                <DialogTitle className="text-base font-semibold">
                  Reserve your slot
                </DialogTitle>
                <DialogDescription className="text-xs">
                  We'll call you within one working day.
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={onSubmit}
                noValidate
                className="mt-4 space-y-3"
                aria-label="Welcome demo request form"
              >
                <Field
                  label="Full name"
                  value={form.fullName}
                  onChange={(v) => update("fullName", v)}
                  onBlur={() => blur("fullName")}
                  error={errors.fullName}
                  autoComplete="name"
                  maxLength={100}
                />
                <GmailLocalPartField
                  id="welcome-email"
                  value={form.email}
                  onValueChange={(v) => update("email", v)}
                  onBlur={() => blur("email")}
                  error={errors.email}
                />
                <Field
                  label="Phone"
                  prefix="+91"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(v) => update("phone", v.replace(/\D/g, ""))}
                  onBlur={() => blur("phone")}
                  error={errors.phone}
                  autoComplete="tel"
                  maxLength={10}
                />
                <SelectField
                  label="Course"
                  value={form.course}
                  onChange={(v) => update("course", v)}
                  onBlur={() => blur("course")}
                  error={errors.course}
                  options={courseOptions}
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-orange px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-110 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    cfg.primaryLabel
                  )}
                </button>
                <p className="text-center text-[11px] text-muted-foreground">
                  By submitting you agree to be contacted by TechU about
                  admissions and events.
                </p>
              </form>
            </div>
          </div>
      </DialogContent>
    </Dialog>
  );
}

function Dot() {
  return (
    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
  );
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  error,
  type = "text",
  prefix,
  autoComplete,
  inputMode,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  type?: string;
  prefix?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground">
        {label}
      </label>
      <div
        className={`mt-1 flex items-center gap-2 rounded-lg border bg-background px-3 ${
          error ? "border-red-400" : "border-border focus-within:border-brand-purple"
        }`}
      >
        {prefix && (
          <span className="text-sm font-medium text-muted-foreground">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={!!error}
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        />
      </div>
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  onBlur,
  error,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground">
        {label}
      </label>
      <Select
        value={value || undefined}
        onValueChange={(v) => {
          onChange(v);
          onBlur?.();
        }}
        onOpenChange={(open) => {
          if (!open) onBlur?.();
        }}
      >
        <SelectTrigger
          aria-invalid={!!error}
          className={`mt-1 h-10 rounded-xl border bg-background/70 text-base shadow-none ring-offset-0 focus:ring-2 focus:ring-brand-purple/25 data-[placeholder]:text-muted-foreground ${
            error ? "border-destructive" : "border-border"
          }`}
        >
          <SelectValue placeholder="Select course" />
        </SelectTrigger>
        <SelectContent
          position="popper"
          className="rounded-xl border border-border/70 bg-white/95 p-1.5 shadow-[0_18px_45px_-20px_rgba(0,0,0,0.45)] backdrop-blur-md"
        >
          {options.map((opt) => (
            <SelectItem
              key={opt}
              value={opt}
              className="rounded-lg px-3 py-2 text-sm font-medium focus:bg-brand-purple/10 focus:text-brand-purple"
            >
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
