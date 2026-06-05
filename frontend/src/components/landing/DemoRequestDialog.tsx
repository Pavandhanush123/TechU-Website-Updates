import { useEffect, useState } from "react";
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
import { submitDemoRequest } from "@/lib/api";
import { GmailLocalPartField } from "@/components/forms/GmailLocalPartInputRow";
import {
  demoRequestSchema,
  validateField,
  type DemoRequestFormValues,
} from "@/lib/api-schemas";
import { sanitizeGmailLocalTyping } from "@/lib/gmail-local-part";
import {
  useCourseOptions,
  DEFAULT_COURSE_TITLE,
} from "@/hooks/useCourseOptions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic?: string;
};

const empty: DemoRequestFormValues = {
  fullName: "",
  email: "",
  phone: "",
  course: DEFAULT_COURSE_TITLE,
};

export function DemoRequestDialog({ open, onOpenChange, topic }: Props) {
  const courseOptions = useCourseOptions();
  const [form, setForm] = useState<DemoRequestFormValues>(empty);
  const [errors, setErrors] = useState<
    Partial<Record<keyof DemoRequestFormValues, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState<
    Partial<Record<keyof DemoRequestFormValues, boolean>>
  >({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setTouched({});
    if (topic) {
      setForm({ fullName: "", email: "", phone: "", course: topic });
    } else {
      setForm(empty);
    }
  }, [open, topic]);

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

  const handleBlur = <K extends keyof DemoRequestFormValues>(key: K) => {
    setTouched((t) => ({ ...t, [key]: true }));
    const msg = validateField(demoRequestSchema, key, form[key], form);
    setErrors((e) => ({ ...e, [key]: msg }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = demoRequestSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof DemoRequestFormValues, string>> =
        {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof DemoRequestFormValues;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await submitDemoRequest({
        ...parsed.data,
        phone: parsed.data.phone.startsWith("+")
          ? parsed.data.phone
          : `+91${parsed.data.phone}`,
      });
      if (res.ok) {
        toast.success("Thanks! We'll be in touch shortly.");
        setForm(empty);
        onOpenChange(false);
      } else {
        toast.error(res.error ?? "Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (hasError: boolean) =>
    `mt-1 h-11 w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 ${
      hasError
        ? "border-destructive focus:border-destructive focus:ring-destructive/20"
        : "border-input focus:border-brand-purple focus:ring-brand-purple/20"
    }`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md min-w-0 overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>
            {topic ? `Register for ${topic}` : "Register for a Free Demo"}
          </DialogTitle>
          <DialogDescription>
            {topic
              ? "We'll email you the joining details."
              : "See what learning at TechU is like — book a live demo session."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="min-w-0 space-y-4">
          <div className="min-w-0 overflow-hidden">
            <label className="text-sm font-medium">Full name</label>
            <input
              className={inputCls(!!errors.fullName)}
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              onBlur={() => handleBlur("fullName")}
              maxLength={100}
              autoComplete="name"
              required
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-destructive">{errors.fullName}</p>
            )}
          </div>
          <GmailLocalPartField
            id="demo-email"
            className="min-w-0 overflow-hidden"
            value={form.email}
            onValueChange={(v) => update("email", v)}
            onBlur={() => handleBlur("email")}
            error={errors.email}
          />
          <div className="min-w-0 overflow-hidden">
            <label className="text-sm font-medium">Phone</label>
            <div
              className={`mt-1 flex h-11 w-full min-w-0 items-center gap-2 overflow-hidden rounded-xl border bg-background/70 px-3 ${
                errors.phone
                  ? "border-destructive focus-within:border-destructive"
                  : "border-border focus-within:border-brand-purple"
              }`}
            >
              <span className="shrink-0 text-sm font-medium text-muted-foreground">
                +91
              </span>
              <input
                className="h-full flex-1 min-w-0 overflow-hidden bg-transparent text-ellipsis whitespace-nowrap text-sm text-foreground focus:outline-none"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value.replace(/\D/g, ""))}
                onBlur={() => {
                  update("phone", form.phone.replace(/\D/g, ""));
                  handleBlur("phone");
                }}
                maxLength={10}
                autoComplete="tel-national"
                required
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-xs text-destructive">{errors.phone}</p>
            )}
          </div>
          {topic ? (
            <div className="min-w-0 overflow-hidden">
              <p className="text-sm font-medium">Webinar</p>
              <p className="mt-1 rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-sm text-foreground">
                {topic}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                You&apos;re registering for this session — no need to pick a
                course separately.
              </p>
            </div>
          ) : (
            <div className="min-w-0 overflow-hidden">
              <label className="text-sm font-medium">Course of interest</label>
              <Select
                value={form.course || undefined}
                onValueChange={(v) => update("course", v)}
                onOpenChange={(openSel) => {
                  if (!openSel) handleBlur("course");
                }}
              >
                <SelectTrigger
                  aria-invalid={!!errors.course}
                  className={`mt-1 h-11 w-full min-w-0 overflow-hidden rounded-xl border bg-background/70 text-base shadow-none ring-offset-0 focus:ring-2 focus:ring-brand-purple/25 data-[placeholder]:text-muted-foreground [&>span]:block [&>span]:min-w-0 [&>span]:flex-1 [&>span]:truncate [&>span]:text-left [&>span]:pr-2 [&>svg]:shrink-0 ${
                    errors.course ? "border-destructive" : "border-border"
                  }`}
                >
                  <SelectValue
                    className="truncate"
                    placeholder="Select course"
                  />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  className="rounded-xl border border-border/70 bg-white/95 p-1.5 shadow-[0_18px_45px_-20px_rgba(0,0,0,0.45)] backdrop-blur-md"
                >
                  {courseOptions.map((course) => (
                    <SelectItem
                      key={course}
                      value={course}
                      className="rounded-lg px-3 py-2 text-sm font-medium focus:bg-brand-purple/10 focus:text-brand-purple"
                    >
                      {course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.course && (
                <p className="mt-1 text-xs text-destructive">{errors.course}</p>
              )}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-lg bg-brand-orange px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {submitting
              ? "Submitting..."
              : topic
                ? "Register for this webinar"
                : "Register for Free Demo"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
