import { useEffect, useState } from "react";
import { Loader2, Calendar, Users, Phone } from "lucide-react";
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
import { submitApplication } from "@/lib/api";
import { applicationSchema, type ApplicationFormValues } from "@/lib/api-schemas";
import { GmailLocalPartField } from "@/components/forms/GmailLocalPartInputRow";
import { useCourseOptions } from "@/hooks/useCourseOptions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseTitle: string;
  ctaLabel?: string;
  selectedBatch?: { day: string; month: string; note: string };
  selectedMode?: { label: string; subtitle: string };
};

export function ApplyDialog({
  open,
  onOpenChange,
  courseTitle,
  ctaLabel = "Submit Application",
  selectedBatch,
  selectedMode,
}: Props) {
  const [form, setForm] = useState<ApplicationFormValues>({
    fullName: "",
    email: "",
    phone: "",
    course: courseTitle,
    learningMode: selectedMode?.label || "",
  });
  const [phoneNum, setPhoneNum] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Indian mobile only: fixed +91 prefix + the 10-digit national number.
  useEffect(() => {
    setForm((f) => ({ ...f, phone: phoneNum ? `+91${phoneNum}` : "" }));
  }, [phoneNum]);

  useEffect(() => {
    if (open) setForm((f) => ({ ...f, course: courseTitle }));
  }, [open, courseTitle]);

  useEffect(() => {
    if (open && selectedMode) {
      setForm((f) => ({ ...f, learningMode: selectedMode.label }));
    }
  }, [open, selectedMode]);

  // Hybrid list: built-in courses + admin-created catalog courses, with the
  // current page's course guaranteed present (even if unpublished).
  const courseOptions = useCourseOptions(courseTitle);

  const applyHeadingCourse =
    form.course.trim() || courseTitle.trim() || courseOptions[0] || "this course";

  const batchMatchesSelectedCourse =
    !courseTitle.trim() || form.course.trim() === courseTitle.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = applicationSchema.safeParse({
      ...form,
      course: form.course,
      learningMode: form.learningMode,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await submitApplication(parsed.data);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Application submitted! Our team will reach out shortly.");
      onOpenChange(false);
      setPhoneNum("");
      setForm({
        fullName: "",
        email: "",
        phone: "",
        course: courseTitle,
        learningMode: selectedMode?.label || "",
      });
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for {applyHeadingCourse}</DialogTitle>
          <DialogDescription>
            Share your details and our team will reach out to guide you through
            enrollment.
          </DialogDescription>
        </DialogHeader>

        {selectedBatch && selectedMode && batchMatchesSelectedCourse && (
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="flex items-center gap-2.5 rounded-2xl border border-brand-purple/15 bg-brand-purple/[0.06] px-3 py-3 sm:gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-purple text-white shadow-sm shadow-brand-purple/30">
                <Calendar className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-brand-purple/70">
                  Batch Starts
                </div>
                <div className="text-sm font-extrabold leading-snug text-foreground">
                  {selectedBatch.day} {selectedBatch.month}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-2xl border border-brand-teal/20 bg-brand-teal/[0.06] px-3 py-3 sm:gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-teal text-white shadow-sm shadow-brand-teal/30">
                <Users className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-brand-teal/80">
                  Learning Mode
                </div>
                <div className="line-clamp-2 text-sm font-extrabold leading-snug text-foreground">
                  {selectedMode.label}
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <Label htmlFor="a-name">Full Name</Label>
            <Input
              id="a-name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Your name"
              maxLength={100}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-destructive">{errors.fullName}</p>
            )}
          </div>
          <GmailLocalPartField
            id="a-email"
            value={form.email}
            onValueChange={(v) => setForm({ ...form, email: v })}
            error={errors.email}
          />
          <div>
            <Label htmlFor="a-phone">Phone Number</Label>
            <div className="mt-1 flex h-9 items-center gap-2 rounded-md border border-input bg-transparent px-3 shadow-sm transition-colors focus-within:border-brand-purple focus-within:ring-2 focus-within:ring-brand-purple/20">
              <Phone className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              <span className="shrink-0 text-sm font-medium text-muted-foreground">
                +91
              </span>
              <input
                id="a-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={phoneNum}
                onChange={(e) =>
                  setPhoneNum(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="10-digit mobile number"
                maxLength={10}
                className="h-full flex-1 bg-transparent text-sm focus:outline-none"
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-xs text-destructive">{errors.phone}</p>
            )}
          </div>
          <div>
            <Label htmlFor="a-course">Course</Label>
            <select
              id="a-course"
              value={form.course}
              onChange={(e) => {
                const next = e.target.value;
                setForm((prev) => {
                  const matchesPage =
                    next.trim() === courseTitle.trim();
                  return {
                    ...prev,
                    course: next,
                    learningMode: matchesPage
                      ? selectedMode?.label || ""
                      : "",
                  };
                });
              }}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
            >
              {courseOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.course && (
              <p className="mt-1 text-xs text-destructive">{errors.course}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-orange py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-110 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Submitting..." : ctaLabel}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
