import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { submitBrochureRequest } from "@/lib/api";
import { GmailLocalPartField } from "@/components/forms/GmailLocalPartInputRow";
import {
  brochureRequestSchema,
  sanitizePhone,
  validateField,
} from "@/lib/api-schemas";
import { sanitizeGmailLocalTyping } from "@/lib/gmail-local-part";

type BrochureField = "fullName" | "email" | "phone";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseTitle: string;
  brochureUrl: string;
};

export function BrochureDownloadDialog({
  open,
  onOpenChange,
  courseTitle,
  brochureUrl,
}: Props) {
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Partial<Record<BrochureField, string>>>(
    {},
  );
  const [touched, setTouched] = useState<Partial<Record<BrochureField, boolean>>>(
    {},
  );
  const [loading, setLoading] = useState(false);

  const setField = (key: BrochureField, value: string) => {
    setForm((f) => {
      const next = {
        ...f,
        [key]: key === "email" ? sanitizeGmailLocalTyping(value) : value,
      };
      if (touched[key]) {
        const fieldVal = next[key];
        const msg = validateField(brochureRequestSchema, key, fieldVal, {
          ...next,
          course: courseTitle,
        });
        setErrors((e) => ({ ...e, [key]: msg }));
      }
      return next;
    });
  };
  const blurField = (key: BrochureField) => {
    setTouched((t) => ({ ...t, [key]: true }));
    let merged = { ...form };
    if (key === "phone") {
      merged = { ...merged, phone: sanitizePhone(form.phone) };
    } else if (key === "email") {
      merged = { ...merged, email: sanitizeGmailLocalTyping(form.email) };
    }
    setForm(merged);
    const fieldVal =
      key === "phone" ? merged.phone : key === "email" ? merged.email : merged[key];
    const msg = validateField(brochureRequestSchema, key, fieldVal, {
      ...merged,
      course: courseTitle,
    });
    setErrors((e) => ({ ...e, [key]: msg }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized = {
      ...form,
      phone: sanitizePhone(form.phone),
      email: sanitizeGmailLocalTyping(form.email),
    };
    setForm(sanitized);
    const parsed = brochureRequestSchema.safeParse({
      ...sanitized,
      course: courseTitle,
    });
    if (!parsed.success) {
      const fieldErrors: Partial<Record<BrochureField, string>> = {};
      parsed.error.issues.forEach((i) => {
        const k = i.path[0] as BrochureField;
        if (k && !fieldErrors[k]) fieldErrors[k] = i.message;
      });
      setErrors(fieldErrors);
      setTouched({ fullName: true, email: true, phone: true });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await submitBrochureRequest({
        ...parsed.data,
        phone: parsed.data.phone.startsWith("+")
          ? parsed.data.phone
          : `+91${parsed.data.phone}`,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Thanks! Your brochure download is starting.");
      if (brochureUrl && brochureUrl !== "#") {
        const a = document.createElement("a");
        a.href = brochureUrl;
        a.download = "";
        a.target = "_blank";
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      onOpenChange(false);
      setForm({ fullName: "", email: "", phone: "" });
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download Brochure</DialogTitle>
          <DialogDescription>
            Share your details to download the {courseTitle} brochure.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <div>
            <Label htmlFor="b-name">Full Name</Label>
            <Input
              id="b-name"
              value={form.fullName}
              onChange={(e) => setField("fullName", e.target.value)}
              onBlur={() => blurField("fullName")}
              placeholder="Your name"
              maxLength={100}
              autoComplete="name"
              aria-invalid={!!errors.fullName}
              className={errors.fullName ? "border-destructive" : ""}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-destructive">{errors.fullName}</p>
            )}
          </div>
          <GmailLocalPartField
            id="b-email"
            value={form.email}
            onValueChange={(v) => setField("email", v)}
            onBlur={() => blurField("email")}
            error={errors.email}
          />
          <div>
            <Label htmlFor="b-phone">Phone</Label>
            <div
              className={`mt-1 flex h-9 items-center gap-2 rounded-md border bg-transparent px-3 shadow-sm transition-colors focus-within:ring-2 focus-within:ring-brand-purple/20 ${
                errors.phone
                  ? "border-destructive focus-within:border-destructive"
                  : "border-input focus-within:border-brand-purple"
              }`}
            >
              <span className="shrink-0 text-sm font-medium text-muted-foreground">
                +91
              </span>
              <input
                id="b-phone"
                type="tel"
                inputMode="numeric"
                value={form.phone}
                onChange={(e) =>
                  setField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                onBlur={() => blurField("phone")}
                placeholder="10-digit mobile number"
                maxLength={10}
                autoComplete="tel-national"
                aria-invalid={!!errors.phone}
                className="h-full flex-1 bg-transparent text-sm focus:outline-none"
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-xs text-destructive">{errors.phone}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-orange py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {loading ? "Submitting..." : "Get Brochure"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
