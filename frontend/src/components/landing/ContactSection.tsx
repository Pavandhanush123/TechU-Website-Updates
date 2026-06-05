import { useState } from "react";
import { flushSync } from "react-dom";
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
} from "lucide-react";
import { toast } from "sonner";
import { submitApplication, type ContactData } from "@/lib/api";
import {
  contactSectionApplicationSchema,
  validateField,
  wireContactNationalPhoneDigits,
} from "@/lib/api-schemas";
import { GmailLocalPartField } from "@/components/forms/GmailLocalPartInputRow";
import { normalizeIndianNationalMobileDigits } from "@/lib/indian-phone";
import { sanitizeGmailLocalTyping } from "@/lib/gmail-local-part";
import { useCmsSection } from "@/hooks/useCmsSection";
import { useCourseOptions } from "@/hooks/useCourseOptions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import msmeLogo from "@/assets/accreditations/msme.png";
import startupIndiaLogo from "@/assets/accreditations/startupindia.png";
import jainLogo from "@/assets/accreditations/jain.png";
import nasscomLogo from "@/assets/accreditations/nasscom.png";
import isoLogo from "@/assets/accreditations/iso.png";
import ncdaLogo from "@/assets/accreditations/ncda.png";

const ACCREDITATIONS = [
  { src: msmeLogo, alt: "MSME" },
  { src: startupIndiaLogo, alt: "Startup India" },
  { src: jainLogo, alt: "JAIN Center for Skills" },
  { src: nasscomLogo, alt: "NASSCOM" },
  { src: isoLogo, alt: "ISO 9001:2015 Certified" },
  { src: ncdaLogo, alt: "NCDA" },
];

type FieldErrors = Partial<
  Record<"fullName" | "email" | "phone" | "experience" | "course", string>
>;

type ContactFormState = {
  fullName: string;
  email: string;
  phone: string;
  experience: string;
  course: string;
};

const EXPERIENCE_YEAR_OPTIONS = Array.from({ length: 20 }, (_, i) =>
  String(i + 1),
);
const EXPERIENCE_MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) =>
  String(i),
);

function formatExperience(years: string, months: string) {
  if (!years) return "";
  const safeMonths = months === "" ? "0" : months;
  const yearLabel = years === "1" ? "year" : "years";
  const monthLabel = safeMonths === "1" ? "month" : "months";
  return `${years} ${yearLabel} ${safeMonths} ${monthLabel}`;
}

function wireContactSectionPayload(form: ContactFormState) {
  const digits = form.phone.replace(/\D/g, "").slice(0, 10);
  return {
    ...form,
    phone: wireContactNationalPhoneDigits(digits),
  };
}

/** Radix Select may call `onOpenChange(false)` before `onValueChange`; defer blur validation until after the value commits. */
function deferSelectBlur(onBlur?: () => void) {
  if (!onBlur) return;
  queueMicrotask(() => {
    onBlur();
  });
}

const FALLBACK: ContactData = {
  heading: "Contact Information",
  formBadge: "Admission Closing Soon",
  formTitle: "Start Your Application",
  formSubmitLabel: "Apply Now",
  consent:
    "By providing your contact details, you agree to be contacted by TechU regarding admissions and events.",
  email: "info@techu.in",
  phone: "+91 90001 44281",
  address: "101, Images Capital Park, Madhapur, Hyderabad, Telangana 500081",
  socials: {
    linkedin:
      "https://www.linkedin.com/company/techu-innovation-labs/?viewAsMember=true",
    facebook: "https://www.facebook.com/techutraining",
    instagram: "https://www.instagram.com/techu_in/",
    youtube: "https://www.youtube.com/@TechU_In",
  },
  stats: [
    { value: "5,910+", label: "Learners trained & growing every day" },
    { value: "100+", label: "Hiring partners across India & beyond" },
  ],
  courseOptions: [
    "Full Stack Development with Claude AI",
    "Data Analytics with AI / ML",
    "UI/UX Designing + Digital Marketing + Graphic Designing with AI",
  ],
};

export function ContactSection() {
  const cms = useCmsSection<ContactData>("contact", FALLBACK);
  // Hybrid list: admin-curated contact options + built-in courses + published
  // admin-created catalog courses, deduped.
  const COURSE_OPTIONS = useCourseOptions(cms.courseOptions);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    experience: "",
    course: "",
  });
  const [experienceYears, setExperienceYears] = useState("");
  const [experienceMonths, setExperienceMonths] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof FieldErrors, boolean>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  /** Bump after successful submit so Radix Select remounts (controlled empty value otherwise sticks visually). */
  const [selectResetSeq, setSelectResetSeq] = useState(0);

  type FieldKey = keyof FieldErrors;

  const setField = (key: FieldKey, value: string) => {
    let snapshot: ContactFormState;
    flushSync(() => {
      setForm((f) => {
        snapshot =
          key === "phone"
            ? { ...f, phone: normalizeIndianNationalMobileDigits(value) }
            : key === "email"
              ? { ...f, email: sanitizeGmailLocalTyping(value) }
              : { ...f, [key]: value };
        return snapshot;
      });
    });

    setErrors((prevErrors) => {
      const shouldValidate = touched[key] || !!prevErrors[key];
      if (!shouldValidate) return prevErrors;

      const wired = wireContactSectionPayload(snapshot);
      const fieldVal =
        key === "phone" ? wired.phone : (wired[key] as string);
      const msg = validateField(
        contactSectionApplicationSchema,
        key,
        fieldVal,
        wired,
      );
      const next = { ...prevErrors };
      if (msg) next[key] = msg;
      else delete next[key];
      return next;
    });
  };

  const blurField = (key: FieldKey) => {
    setTouched((t) => ({ ...t, [key]: true }));
    setForm((current) => {
      const snapshot =
        key === "phone"
          ? {
              ...current,
              phone: normalizeIndianNationalMobileDigits(current.phone),
            }
          : key === "email"
            ? { ...current, email: sanitizeGmailLocalTyping(current.email) }
            : current;

      const wired = wireContactSectionPayload(snapshot);
      const fieldVal =
        key === "phone" ? wired.phone : (wired[key] as string);
      const msg = validateField(
        contactSectionApplicationSchema,
        key,
        fieldVal,
        wired,
      );

      setErrors((prevErrors) => {
        const next = { ...prevErrors };
        if (msg) next[key] = msg;
        else delete next[key];
        return next;
      });

      return snapshot;
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const wired = wireContactSectionPayload(form);
    const parsed = contactSectionApplicationSchema.safeParse(wired);
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await submitApplication(parsed.data);
      if (res.ok) {
        toast.success(
          "Application submitted! Our team will reach out shortly.",
        );
        setForm({
          fullName: "",
          email: "",
          phone: "",
          experience: "",
          course: "",
        });
        setExperienceYears("");
        setExperienceMonths("");
        setTouched({});
        setSelectResetSeq((n) => n + 1);
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const SOCIALS = [
    { Icon: Linkedin, label: "LinkedIn", href: cms.socials?.linkedin },
    { Icon: Facebook, label: "Facebook", href: cms.socials?.facebook },
    { Icon: Instagram, label: "Instagram", href: cms.socials?.instagram },
    { Icon: Youtube, label: "YouTube", href: cms.socials?.youtube },
  ].filter((s): s is { Icon: typeof Linkedin; label: string; href: string } =>
    Boolean(s.href),
  );
  const stats = cms.stats?.length ? cms.stats : FALLBACK.stats;

  return (
    <section id="contact" className="scroll-mt-24 bg-background py-8 sm:py-10">
      {/* Full-bleed gradient band spanning the full screen width (square
          corners); the contact content stays within the page container. */}
      <div className="overflow-hidden bg-brand-gradient">
        <div className="mx-auto max-w-page px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
            {/* Left: Contact info */}
            <div className="flex h-full flex-col text-white">
              <h2 className="text-[clamp(1.6rem,4.8vw,2.2rem)] font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
                {cms.heading}
              </h2>

              <ul className="mt-5 space-y-2.5 sm:mt-7 sm:space-y-3.5">
                <li className="flex items-center gap-3 sm:gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center text-brand-orange sm:h-9 sm:w-9">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                  <a
                    href={`mailto:${cms.email}`}
                    className="break-all text-sm hover:underline sm:text-base"
                  >
                    {cms.email}
                  </a>
                </li>
                <li className="flex items-center gap-3 sm:gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center text-brand-orange sm:h-9 sm:w-9">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                  <a
                    href={`tel:${cms.phone.replace(/\s+/g, "")}`}
                    className="text-sm hover:underline sm:text-base"
                  >
                    {cms.phone}
                  </a>
                </li>
                <li className="flex items-start gap-3 sm:gap-4">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center text-brand-orange sm:h-9 sm:w-9">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                  <p className="max-w-md text-sm leading-relaxed sm:text-base whitespace-pre-line">
                    {cms.address}
                  </p>
                </li>
              </ul>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-7">
                {stats.slice(0, 2).map((s, i) => (
                  <div
                    key={`${s.label}-${i}`}
                    className={i === 0 ? "" : "border-t border-white/30 pt-3"}
                  >
                    <div className="text-xl font-bold sm:text-2xl lg:text-3xl">
                      {s.value}
                    </div>
                    <p className="mt-1 text-xs text-white/80 sm:mt-1.5 sm:text-sm">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 w-fit sm:mt-7">
                <p className="text-sm font-semibold text-white/90">Follow Us</p>
                <div className="mt-3 flex flex-wrap items-center gap-3.5">
                  {SOCIALS.map(({ Icon, label, href }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12 text-white ring-1 ring-white/25 shadow-sm transition hover:-translate-y-0.5 hover:bg-white/20 sm:h-16 sm:w-16"
                    >
                      <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Student admission application form */}
            <div
              id="student-application"
              className="scroll-mt-28 rounded-2xl bg-white/95 p-4 shadow-[0_20px_45px_-24px_rgba(0,0,0,0.45)] ring-1 ring-black/5 backdrop-blur-sm sm:scroll-mt-24 sm:rounded-3xl sm:p-5 lg:p-5"
            >
              <div className="text-center">
                <span className="inline-block rounded-full bg-brand-purple/10 px-3.5 py-1 text-[11px] font-semibold text-brand-purple">
                  {cms.formBadge}
                </span>
                <h3 className="mt-2.5 text-[1.65rem] font-bold text-foreground">
                  {cms.formTitle}
                </h3>
              </div>

              <form onSubmit={onSubmit} className="mt-5 space-y-3.5" noValidate>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FloatingField
                    label="Name"
                    required
                    value={form.fullName}
                    onChange={(v) => setField("fullName", v)}
                    onBlur={() => blurField("fullName")}
                    error={errors.fullName}
                    maxLength={100}
                    autoComplete="name"
                  />
                  <GmailLocalPartField
                    id="contact-email"
                    required
                    value={form.email}
                    onValueChange={(v) => setField("email", v)}
                    onBlur={() => blurField("email")}
                    error={errors.email}
                  />
                  <FloatingField
                    label="Phone number"
                    required
                    prefix="+91"
                    inputMode="tel"
                    value={form.phone}
                    onChange={(v) => setField("phone", v)}
                    onBlur={() => blurField("phone")}
                    error={errors.phone}
                    maxLength={10}
                    autoComplete="tel"
                  />
                  <FloatingSelect
                    label="Course"
                    required
                    resetSeq={selectResetSeq}
                    value={form.course}
                    onChange={(v) => setField("course", v)}
                    onBlur={() => blurField("course")}
                    error={errors.course}
                    options={COURSE_OPTIONS}
                    placeholder="Select a course"
                  />
                  <div className="sm:col-span-2">
                    <ExperienceField
                      key={`experience-${selectResetSeq}`}
                      years={experienceYears}
                      months={experienceMonths}
                      onYearsChange={(v) => {
                        setExperienceYears(v);
                        setField("experience", formatExperience(v, experienceMonths));
                      }}
                      onMonthsChange={(v) => {
                        setExperienceMonths(v);
                        setField("experience", formatExperience(experienceYears, v));
                      }}
                      onBlur={() => blurField("experience")}
                      error={errors.experience}
                    />
                  </div>
                </div>

                <p className="text-[11px] leading-snug text-muted-foreground">{cms.consent}</p>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-brand-orange px-6 py-2.5 text-base font-semibold text-white shadow-md transition hover:brightness-110 disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : cms.formSubmitLabel}
                </button>
              </form>
            </div>
          </div>

          {/* Accreditation logos */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-5 border-t border-white/15 pt-6 sm:mt-8 sm:justify-around sm:gap-10 sm:pt-7">
            {ACCREDITATIONS.map((logo) => (
              <img
                key={logo.alt}
                src={logo.src}
                alt={logo.alt}
                className="h-10 w-auto max-w-[130px] object-contain sm:h-11"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ExperienceField({
  years,
  months,
  onYearsChange,
  onMonthsChange,
  onBlur,
  error,
}: {
  years: string;
  months: string;
  onYearsChange: (v: string) => void;
  onMonthsChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground">
        Total work experience{" "}
        <span className="text-destructive" aria-hidden="true">
          *
        </span>
      </label>
      <div className="mt-1 grid grid-cols-2 gap-3">
        <Select
          value={years || undefined}
          onValueChange={(v) => {
            onYearsChange(v);
          }}
          onOpenChange={(open) => {
            if (!open) deferSelectBlur(onBlur);
          }}
        >
          <SelectTrigger
            aria-invalid={!!error}
            className={`h-10 rounded-xl border bg-background/70 text-base shadow-none ring-offset-0 focus:ring-2 focus:ring-brand-purple/25 data-[placeholder]:text-muted-foreground ${
              error ? "border-destructive" : "border-border"
            }`}
          >
            <SelectValue placeholder="Select years" />
          </SelectTrigger>
          <SelectContent
            position="popper"
            className="rounded-xl border border-border/70 bg-white/95 p-1.5 shadow-[0_18px_45px_-20px_rgba(0,0,0,0.45)] backdrop-blur-md"
          >
            {EXPERIENCE_YEAR_OPTIONS.map((year) => (
              <SelectItem
                key={year}
                value={year}
                className="rounded-lg px-3 py-2 text-sm font-medium focus:bg-brand-purple/10 focus:text-brand-purple"
              >
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={months || undefined}
          onValueChange={(v) => {
            onMonthsChange(v);
          }}
          onOpenChange={(open) => {
            if (!open) deferSelectBlur(onBlur);
          }}
        >
          <SelectTrigger
            aria-invalid={!!error}
            className={`h-10 rounded-xl border bg-background/70 text-base shadow-none ring-offset-0 focus:ring-2 focus:ring-brand-purple/25 data-[placeholder]:text-muted-foreground ${
              error ? "border-destructive" : "border-border"
            }`}
          >
            <SelectValue placeholder="Select months" />
          </SelectTrigger>
          <SelectContent
            position="popper"
            className="rounded-xl border border-border/70 bg-white/95 p-1.5 shadow-[0_18px_45px_-20px_rgba(0,0,0,0.45)] backdrop-blur-md"
          >
            {EXPERIENCE_MONTH_OPTIONS.map((month) => (
              <SelectItem
                key={month}
                value={month}
                className="rounded-lg px-3 py-2 text-sm font-medium focus:bg-brand-purple/10 focus:text-brand-purple"
              >
                {month} months
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function FloatingField({
  label,
  required,
  value,
  onChange,
  onBlur,
  error,
  type = "text",
  prefix,
  maxLength,
  autoComplete,
  inputMode,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  type?: string;
  prefix?: string;
  maxLength?: number;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground">
        {label}
        {required ? (
          <>
            {" "}
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </>
        ) : null}
      </label>
      <div
        className={`mt-1 flex items-center gap-2 border-b focus-within:border-brand-purple ${
          error ? "border-destructive" : "border-border"
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
          maxLength={maxLength}
          autoComplete={autoComplete}
          inputMode={inputMode}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={!!error}
          className="min-w-0 flex-1 bg-transparent py-1.5 text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        />
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function FloatingSelect({
  label,
  required,
  resetSeq,
  value,
  onChange,
  onBlur,
  error,
  options,
  placeholder,
}: {
  label: string;
  required?: boolean;
  /** Increment when the parent form resets so Radix Select clears its displayed label. */
  resetSeq: number;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  options: string[];
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground">
        {label}
        {required ? (
          <>
            {" "}
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </>
        ) : null}
      </label>
      <Select
        key={`${label}-${resetSeq}`}
        value={value || undefined}
        onValueChange={(v) => {
          onChange(v);
        }}
        onOpenChange={(open) => {
          if (!open) deferSelectBlur(onBlur);
        }}
      >
        <SelectTrigger
          aria-invalid={!!error}
          className={`mt-1 h-10 rounded-xl border bg-background/70 text-base shadow-none ring-offset-0 focus:ring-2 focus:ring-brand-purple/25 data-[placeholder]:text-muted-foreground ${
            error ? "border-destructive" : "border-border"
          }`}
        >
          <SelectValue placeholder={placeholder ?? "Select an option"} />
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
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
