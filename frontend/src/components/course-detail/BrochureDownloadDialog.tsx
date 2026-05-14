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
import {
  brochureRequestSchema,
  sanitizePhone,
  validateField,
} from "@/lib/api-schemas";

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
      const next = { ...f, [key]: value };
      if (touched[key]) {
        const msg = validateField(brochureRequestSchema, key, value, {
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
    const value = key === "phone" ? sanitizePhone(form.phone) : form[key];
    if (key === "phone") setForm((f) => ({ ...f, phone: value }));
    const msg = validateField(brochureRequestSchema, key, value, {
      ...form,
      [key]: value,
      course: courseTitle,
    });
    setErrors((e) => ({ ...e, [key]: msg }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized = { ...form, phone: sanitizePhone(form.phone) };
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
      const res = await submitBrochureRequest(parsed.data);
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
          <div>
            <Label htmlFor="b-email">Email</Label>
            <Input
              id="b-email"
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              onBlur={() => blurField("email")}
              placeholder="you@example.com"
              maxLength={255}
              autoComplete="email"
              aria-invalid={!!errors.email}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email}</p>
            )}
          </div>
          <div>
            <Label htmlFor="b-phone">Phone</Label>
            <Input
              id="b-phone"
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(e) =>
                setField("phone", e.target.value.replace(/[^\d+\s\-()]/g, ""))
              }
              onBlur={() => blurField("phone")}
              placeholder="9876543210"
              maxLength={20}
              autoComplete="tel"
              aria-invalid={!!errors.phone}
              className={errors.phone ? "border-destructive" : ""}
            />
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
