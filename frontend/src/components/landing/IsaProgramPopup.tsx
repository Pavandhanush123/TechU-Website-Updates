import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  isaProgramEnquirySchema,
  validateField,
  type IsaProgramEnquiryFormValues,
} from "@/lib/api-schemas";
import { submitIsaProgramEnquiry } from "@/lib/api";
import { GmailLocalPartField } from "@/components/forms/GmailLocalPartInputRow";
import { useCourseOptions } from "@/hooks/useCourseOptions";
import isaPopupHero from "../../../assets/ISA-assets/ISA_popup-Hero.png";

const TEXTS = {
  applyNowFor: "Apply Now for",
  techU: "TechU ",
  isa: "ISA",
  program: " Program",
  description: "Unlock premium career tracks, AI mentoring, and high-impact tech courses designed for modern professionals.",
  fullNameLabel: "Full Name",
  phoneLabel: "Phone number",
  selectCourseLabel: "Select course",
  chooseCourseOption: "Choose a course",
  preferredModeLabel: "Preferred Mode",
  noCommitment: "No commitment • Cancel anytime",
  exploreCourses: "Explore Courses",
};

const SESSION_STORAGE_KEY = "techu.isa_popup_shown";

const emptyForm: IsaProgramEnquiryFormValues = {
  fullName: "",
  phone: "",
  email: "",
  course: "",
  preferredMode: "Online",
};

export function IsaProgramPopup() {
  const courseOptions = useCourseOptions();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<IsaProgramEnquiryFormValues>(emptyForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof IsaProgramEnquiryFormValues, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState<
    Partial<Record<keyof IsaProgramEnquiryFormValues, boolean>>
  >({});

  useEffect(() => {
    let eligibleByDelay = false;
    let scrolled = false;
    let opened = false;
    const tryOpen = () => {
      if (opened) return;
      if (!eligibleByDelay || !scrolled) return;
      opened = true;
      setOpen(true);
    };
    try {
      const seen = sessionStorage.getItem(SESSION_STORAGE_KEY) === "1";
      if (seen) return;
    } catch {
      // Continue without storage guarantees.
    }
    const delayMs = 4000; // Between the requested 3–5s window.
    const delayId = window.setTimeout(() => {
      eligibleByDelay = true;
      tryOpen();
    }, delayMs);
    const onScroll = () => {
      if (window.scrollY <= 24) return;
      scrolled = true;
      tryOpen();
      if (opened) {
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.clearTimeout(delayId);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const update = <K extends keyof IsaProgramEnquiryFormValues>(
    key: K,
    value: IsaProgramEnquiryFormValues[K],
  ) => {
    setForm((prev) => {
      const next = {
        ...prev,
        [key]: key === "phone" ? String(value).replace(/\D/g, "") : value,
      } as IsaProgramEnquiryFormValues;
      if (Reflect.get(touched, key)) {
        const msg = validateField(isaProgramEnquirySchema, key, Reflect.get(next, key), next);
        setErrors((old) => ({ ...old, [key]: msg }));
      }
      return next;
    });
  };

  const blur = <K extends keyof IsaProgramEnquiryFormValues>(key: K) => {
    setTouched((old) => ({ ...old, [key]: true }));
    const msg = validateField(isaProgramEnquirySchema, key, Reflect.get(form, key), form);
    setErrors((old) => ({ ...old, [key]: msg }));
  };

  const close = () => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, "1");
    } catch {
      // Ignore storage failures and continue closing.
    }
    setOpen(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      phone: form.phone.startsWith("+91") ? form.phone : `+91${form.phone}`,
    };
    const parsed = isaProgramEnquirySchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Partial<
        Record<keyof IsaProgramEnquiryFormValues, string>
      > = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof IsaProgramEnquiryFormValues;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setTouched({
        fullName: true,
        phone: true,
        email: true,
        course: true,
        preferredMode: true,
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitIsaProgramEnquiry(parsed.data);
      if (!res.ok) {
        toast.error(res.error || "Unable to submit right now.");
        return;
      }
      toast.success("ISA Program enquiry submitted.");
      setForm(emptyForm);
      close();
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (hasError: boolean) =>
    `w-full rounded-lg border px-3 py-1.5 text-sm text-foreground focus:outline-none ${
      hasError
        ? "border-red-400 focus:border-red-500"
        : "border-border focus:border-brand-purple"
    }`;

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? close() : setOpen(true))}>
      <DialogContent className="w-[min(96vw,980px)] max-w-[980px] max-h-[92vh] gap-0 overflow-hidden p-0">
        <button
          type="button"
          aria-label="Close ISA popup"
          onClick={close}
          className="absolute right-4 top-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-foreground shadow-sm transition hover:bg-white"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex max-h-[92vh] flex-col md:flex-row">
          <div className="order-2 flex-1 overflow-y-auto bg-white px-4 py-4 sm:px-6 sm:py-5 md:order-1 md:w-[52%]">
            <DialogHeader className="space-y-0">
              <DialogTitle className="text-2xl sm:text-3xl font-extrabold leading-tight text-foreground">
                {TEXTS.applyNowFor}
                <br />
                {TEXTS.techU}<span className="text-rose-600">{TEXTS.isa}</span>{TEXTS.program}
              </DialogTitle>
            </DialogHeader>
            <p className="mt-1.5 text-xs sm:text-sm leading-snug text-muted-foreground">
              {TEXTS.description}
            </p>
            <form onSubmit={onSubmit} className="mt-3 space-y-2 sm:space-y-2.5" noValidate>
              <div>
                <label className="text-sm font-medium text-foreground">{TEXTS.fullNameLabel}</label>
                <input
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  onBlur={() => blur("fullName")}
                  maxLength={100}
                  autoComplete="name"
                  placeholder="Your full name"
                  className={`${fieldClass(!!errors.fullName)} mt-1`}
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">{TEXTS.phoneLabel}</label>
                <div className="mt-1 grid grid-cols-[64px_1fr] gap-2">
                  <input
                    value="+91"
                    readOnly
                    className={fieldClass(false)}
                    aria-label="Country code"
                  />
                  <input
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    onBlur={() => blur("phone")}
                    inputMode="numeric"
                    maxLength={10}
                    autoComplete="tel"
                    placeholder="9876543210"
                    className={fieldClass(!!errors.phone)}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                )}
              </div>

              <GmailLocalPartField
                id="isa-enquiry-email"
                label="Email Address"
                value={form.email}
                onValueChange={(v) => update("email", v)}
                onBlur={() => blur("email")}
                error={errors.email}
              />

              <div>
                <label className="text-sm font-medium text-foreground">{TEXTS.selectCourseLabel}</label>
                <select
                  value={form.course}
                  onChange={(e) => update("course", e.target.value)}
                  onBlur={() => blur("course")}
                  className={`${fieldClass(!!errors.course)} mt-1 bg-white`}
                >
                  <option value="">{TEXTS.chooseCourseOption}</option>
                  {courseOptions.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
                {errors.course && (
                  <p className="mt-1 text-xs text-red-600">{errors.course}</p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-foreground">{TEXTS.preferredModeLabel}</p>
                <div className="mt-1 grid grid-cols-2 gap-1.5">
                  {(["Online", "Offline"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => update("preferredMode", mode)}
                      className={[
                        "rounded-lg border px-3 py-1.5 text-sm transition",
                        form.preferredMode === mode
                          ? "border-brand-purple bg-brand-purple/10 text-brand-purple"
                          : "border-border bg-white text-foreground hover:bg-muted/50",
                      ].join(" ")}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-1.5 w-full rounded-full bg-[#ff8400] px-4 py-2 sm:py-2.5 text-sm sm:text-base font-semibold text-white transition hover:brightness-105 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Enquire Now"}
              </button>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{TEXTS.noCommitment}</span>
                <a href="/courses" className="text-brand-purple hover:underline">
                  {TEXTS.exploreCourses}
                </a>
              </div>
            </form>
          </div>

          <div className="relative order-1 h-48 shrink-0 bg-muted/10 md:order-2 md:h-auto md:w-[48%]">
            <img
              src={isaPopupHero}
              alt="TechU ISA Program"
              className="h-full w-full object-contain md:absolute md:inset-0"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
