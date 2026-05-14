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
import { applicationSchema } from "@/lib/api-schemas";
import { getPassoutYearRange } from "@/lib/passout-year";

const COURSE_OPTIONS = [
  "Full Stack Development with Claude AI",
  "Data Analytics with AI / ML",
  "UI/UX Designing + Digital Marketing + Graphic Designing with AI",
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseTitle: string;
  ctaLabel?: string;
  selectedBatch?: { day: string; month: string; note: string };
  selectedMode?: { label: string; subtitle: string };
};

const COUNTRY_CODES = [
  { code: "+91", country: "IN", name: "India", length: 10 },
  { code: "+1", country: "US/CA", name: "USA/Canada", length: 10 },
  { code: "+44", country: "GB", name: "UK", length: 10 },
  { code: "+971", country: "AE", name: "UAE", length: 9 },
  { code: "+61", country: "AU", name: "Australia", length: 9 },
  { code: "+65", country: "SG", name: "Singapore", length: 8 },
  { code: "+49", country: "DE", name: "Germany", length: 11 },
];

export function ApplyDialog({
  open,
  onOpenChange,
  courseTitle,
  ctaLabel = "Submit Application",
  selectedBatch,
  selectedMode,
}: Props) {
  const passoutRange = getPassoutYearRange();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    experience: "",
    course: courseTitle,
    learningMode: selectedMode?.label || "",
  });
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNum, setPhoneNum] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Sync combined phone field
  useEffect(() => {
    setForm((f) => ({ ...f, phone: `${countryCode}${phoneNum}` }));
  }, [countryCode, phoneNum]);

  // Truncate phone number if limit changes
  useEffect(() => {
    const limit = COUNTRY_CODES.find((c) => c.code === countryCode)?.length || 15;
    if (phoneNum.length > limit) {
      setPhoneNum(phoneNum.substring(0, limit));
    }
  }, [countryCode, phoneNum.length]);

  useEffect(() => {
    if (open) setForm((f) => ({ ...f, course: courseTitle }));
  }, [open, courseTitle]);

  useEffect(() => {
    if (open && selectedMode) {
      setForm((f) => ({ ...f, learningMode: selectedMode.label }));
    }
  }, [open, selectedMode]);

  const courseOptions =
    courseTitle && !COURSE_OPTIONS.includes(courseTitle)
      ? [courseTitle, ...COURSE_OPTIONS]
      : COURSE_OPTIONS;

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
      setForm({
        fullName: "",
        email: "",
        phone: "",
        experience: "",
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
          <div className="mt-4 flex items-center justify-center gap-8 rounded-2xl border border-brand-purple/20 bg-brand-purple/5 px-4 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-purple text-white shadow-md shadow-brand-purple/20">
                <Calendar className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-brand-purple/70 uppercase tracking-wide">Batch Starts</span>
                <span className="text-sm font-extrabold text-foreground">{selectedBatch.day} {selectedBatch.month}</span>
              </div>
            </div>
            
            <div className="h-10 w-px bg-brand-purple/15" />
            
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-teal text-white shadow-md shadow-brand-teal/20">
                <Users className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-brand-teal/70 uppercase tracking-wide">Learning Mode</span>
                <span className="text-sm font-extrabold text-foreground">{selectedMode.label}</span>
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
          <div>
            <Label htmlFor="a-email">Email</Label>
            <Input
              id="a-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              maxLength={255}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email}</p>
            )}
          </div>
          <div>
            <Label htmlFor="a-phone">Phone Number</Label>
            <div className="mt-1 flex gap-2">
              <div className="relative w-28 shrink-0">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm transition-colors focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.country} ({c.code})
                    </option>
                  ))}
                  <option value="+">Other</option>
                </select>
              </div>
              <div className="relative flex-1">
                <Input
                  id="a-phone"
                  type="tel"
                  value={phoneNum}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    const limit = COUNTRY_CODES.find(c => c.code === countryCode)?.length || 15;
                    if (val.length <= limit) setPhoneNum(val);
                  }}
                  placeholder="Enter number"
                  className="pl-9"
                />
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
              </div>
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
          <div>
            <Label htmlFor="a-exp">Year of Passing</Label>
            <select
              id="a-exp"
              value={form.experience}
              onChange={(e) =>
                setForm({ ...form, experience: e.target.value.trim() })
              }
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
            >
              <option value="">Select passing year</option>
              {passoutRange.options.map((year) => (
                <option key={year} value={String(year)}>
                  {year}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Placement priority window: {passoutRange.startYear} -{" "}
              {passoutRange.endYear} (auto-updates every April)
            </p>
            {errors.experience && (
              <p className="mt-1 text-xs text-destructive">
                {errors.experience}
              </p>
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
