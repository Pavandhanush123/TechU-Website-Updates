import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  Calendar,
  Star,
  Users,
  Clock,
  MapPin,
  X,
  Download,
  ArrowRight,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import courseFullstack from "@/assets/course-fullstack.jpg";
import courseUiux from "@/assets/course-uiux.jpg";
import courseData from "@/assets/course-data.jpg";
import { BrochureDownloadDialog } from "@/components/course-detail/BrochureDownloadDialog";
import { getCourse } from "@/data/courses";

type Mode = "All" | "Online" | "Offline" | "Hybrid" | "Recorded";
type Category = "AI" | "Design" | "Development" | "Data";
type Duration = "Any" | "Short" | "Medium" | "Long";
type CourseFilters = {
  mode: Mode;
  categories: Category[];
  duration: Duration;
  price: number;
  startDate: string;
};

type Course = {
  title: string;
  image: string;
  rating: number;
  students: string;
  duration: string;
  durationMonths: number;
  level: string;
  modeBadge: string;
  modeKeywords: string[];
  category: Category;
  selected?: boolean;
  // Lowest price option for the course (used as the starting price).
  price: number;
  // Highest price option across all modes/tier variants.
  maxPrice: number;
};

function slugFor(title: string): "fullstack" | "data-analytics" | "uiux" {
  const t = title.toLowerCase();
  if (t.includes("data")) return "data-analytics";
  if (t.includes("ui/ux") || t.includes("ui-ux") || t.includes("design"))
    return "uiux";
  return "fullstack";
}

const BASE_COURSES = [
  {
    title: "Full Stack Development with Claude AI",
    image: courseFullstack,
    rating: 4.8,
    students: "3,567",
    duration: "4 Months",
    durationMonths: 4,
    level: "Beginner",
    category: "Development",
    selected: true,
    price: 65000,
  },
  {
    title: "Data Analytics with AI / ML",
    image: courseData,
    rating: 4.8,
    students: "2,980",
    duration: "4 Months",
    durationMonths: 4,
    level: "Beginner",
    category: "Data",
    price: 65000,
  },
  {
    title: "UI/UX Designing + Digital Marketing + Graphic Designing with AI",
    image: courseUiux,
    rating: 4.8,
    students: "3,210",
    duration: "5 Months",
    durationMonths: 5,
    level: "Beginner",
    category: "Design",
    price: 65000,
  },
] as const;

function parsePriceToNumber(priceText: string) {
  const digits = priceText.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function getCoursePriceBounds(title: string) {
  const slug = slugFor(title);
  const tiers = getCourse(slug).pricingTiers;
  const prices = tiers.map((tier) => parsePriceToNumber(tier.price)).filter((p) => p > 0);
  if (!prices.length) return null;
  return {
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
  };
}

function normalizeModeLabel(label: string) {
  const trimmed = label.trim();
  if (/online/i.test(trimmed)) return "Online";
  if (/offline/i.test(trimmed)) return "Offline";
  if (/hybrid/i.test(trimmed)) return "Hybrid";
  if (/recorded/i.test(trimmed)) return "Recorded";
  return trimmed.replace(/\s*\([^)]*\)\s*/g, "").trim();
}

function getCourseModeMeta(title: string) {
  const slug = slugFor(title);
  const tiers = getCourse(slug).pricingTiers;
  const modeLabels = Array.from(
    new Set(tiers.map((tier) => normalizeModeLabel(tier.label))),
  );
  const modeKeywords = Array.from(
    new Set(
      tiers.flatMap((tier) => {
        const lower = tier.label.toLowerCase();
        const keys: string[] = [];
        if (lower.includes("online")) keys.push("online");
        if (lower.includes("offline")) keys.push("offline");
        if (lower.includes("hybrid")) keys.push("hybrid");
        if (lower.includes("recorded")) keys.push("recorded");
        return keys;
      }),
    ),
  );

  const modeBadge =
    modeLabels.length <= 2
      ? modeLabels.join(" / ")
      : `${modeLabels.slice(0, 2).join(" / ")} / +${modeLabels.length - 2}`;

  return { modeBadge, modeKeywords };
}

const COURSES: Course[] = BASE_COURSES.map((course) => {
  const bounds = getCoursePriceBounds(course.title);
  const modeMeta = getCourseModeMeta(course.title);
  const minPrice = bounds?.minPrice ?? course.price;
  const maxPrice = bounds?.maxPrice ?? minPrice;
  return {
    ...course,
    modeBadge: modeMeta.modeBadge,
    modeKeywords: modeMeta.modeKeywords,
    price: minPrice,
    maxPrice: Math.max(maxPrice, minPrice),
  };
});

const MODES: Mode[] = ["All", "Online", "Offline", "Hybrid", "Recorded"];
const CATEGORIES: Category[] = ["AI", "Design", "Development", "Data"];
const DURATIONS: Duration[] = ["Any", "Short", "Medium", "Long"];
const PRICE_STEP = 5000;
const COURSE_MIN_PRICE = COURSES.length
  ? Math.min(...COURSES.map((c) => c.price))
  : 0;
const COURSE_MAX_PRICE = COURSES.length
  ? Math.max(...COURSES.map((c) => c.maxPrice))
  : 0;
const FILTER_MIN_PRICE = Math.max(
  0,
  Math.floor(COURSE_MIN_PRICE / PRICE_STEP) * PRICE_STEP,
);
const FILTER_MAX_PRICE = Math.max(
  FILTER_MIN_PRICE,
  Math.ceil(COURSE_MAX_PRICE / PRICE_STEP) * PRICE_STEP,
);

function formatCompactPrice(value: number) {
  if (value >= 100000) {
    const lakhs = value / 100000;
    const formattedLakhs = Number.isInteger(lakhs)
      ? String(lakhs)
      : lakhs.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
    return `₹${formattedLakhs}L`;
  }
  return `₹${Math.round(value / 1000)}K`;
}

function getDefaultFilters(): CourseFilters {
  return {
    mode: "All",
    categories: [],
    duration: "Any",
    price: FILTER_MAX_PRICE,
    startDate: "",
  };
}

function durationMatch(d: Duration, months: number) {
  if (d === "Any") return true;
  if (d === "Short") return months < 1;
  if (d === "Medium") return months >= 1 && months <= 3;
  return months > 3;
}

export function ExploreCourses() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDesktopFilterOpen, setIsDesktopFilterOpen] = useState(false);
  const [query, setQuery] = useState("");

  const [tempFilters, setTempFilters] = useState<CourseFilters>(getDefaultFilters());

  const [appliedFilters, setAppliedFilters] = useState<CourseFilters>(getDefaultFilters());

  const reset = () => {
    const defaults = getDefaultFilters();
    setTempFilters(defaults);
    setAppliedFilters(defaults);
    setQuery("");
  };

  const applyFilters = () => {
    setAppliedFilters(tempFilters);
    setIsFilterOpen(false);
  };

  const toggleTempCategory = (c: Category) =>
    setTempFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(c)
        ? prev.categories.filter((x) => x !== c)
        : [...prev.categories, c],
    }));

  const removeFilter = (key: keyof typeof appliedFilters, value?: any) => {
    const next = { ...appliedFilters };
    if (key === "categories" && value) {
      next.categories = next.categories.filter((c) => c !== value);
    } else if (key === "mode") {
      next.mode = "All";
    } else if (key === "duration") {
      next.duration = "Any";
    } else if (key === "price") {
      next.price = FILTER_MAX_PRICE;
    } else if (key === "startDate") {
      next.startDate = "";
    }
    setAppliedFilters(next);
    setTempFilters(next);
  };

  const tempFilteredCount = useMemo(() => {
    return COURSES.filter((c) => {
      if (
        tempFilters.mode !== "All" &&
        !c.modeKeywords.includes(tempFilters.mode.toLowerCase())
      )
        return false;
      if (
        tempFilters.categories.length &&
        !tempFilters.categories.includes(c.category)
      )
        return false;
      if (!durationMatch(tempFilters.duration, c.durationMonths)) return false;
      if (c.price > tempFilters.price) return false;
      if (query && !c.title.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    }).length;
  }, [tempFilters, query]);

  const filtered = useMemo(() => {
    return COURSES.filter((c) => {
      if (
        appliedFilters.mode !== "All" &&
        !c.modeKeywords.includes(appliedFilters.mode.toLowerCase())
      )
        return false;
      if (
        appliedFilters.categories.length &&
        !appliedFilters.categories.includes(c.category)
      )
        return false;
      if (!durationMatch(appliedFilters.duration, c.durationMonths))
        return false;
      if (c.price > appliedFilters.price) return false;
      if (query && !c.title.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });
  }, [appliedFilters, query]);

  const hasActiveFilters =
    appliedFilters.mode !== "All" ||
    appliedFilters.categories.length > 0 ||
    appliedFilters.duration !== "Any" ||
    appliedFilters.price < FILTER_MAX_PRICE ||
    appliedFilters.startDate !== "";

  return (
    <section className="bg-background border-t border-border py-8 lg:py-12">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div
          className={[
            "grid gap-8",
            isDesktopFilterOpen ? "lg:grid-cols-[260px_1fr]" : "lg:grid-cols-1",
          ].join(" ")}
        >
          {/* Mobile Filter Backdrop */}
          {isFilterOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setIsFilterOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside
            className={[
              "lg:border-r lg:border-border lg:pr-6",
              isDesktopFilterOpen ? "lg:block" : "lg:hidden",
              isFilterOpen
                ? "fixed bottom-0 left-0 right-0 z-50 flex max-h-[90vh] flex-col rounded-t-[2rem] bg-background px-6 pb-6 pt-4 shadow-2xl transition-transform duration-300 ease-out translate-y-0 lg:relative lg:inset-auto lg:max-h-none lg:rounded-none lg:p-0 lg:shadow-none lg:translate-y-0"
                : "fixed bottom-0 left-0 right-0 z-50 translate-y-full lg:relative lg:inset-auto lg:translate-y-0",
            ].join(" ")}
          >
            {/* Mobile Header Drag Handle */}
            <div className="mx-auto mb-1.5 h-1 w-10 rounded-full bg-muted/60 lg:hidden" />
            {/* Mobile Header */}
            <div className="mb-3 flex items-center justify-between lg:hidden">
              <h2 className="text-base font-bold text-foreground">Filters</h2>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="rounded-full p-1.5 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-foreground">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="text-base font-semibold">Filters</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:border-brand-purple hover:text-foreground lg:border-transparent lg:px-2"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setIsDesktopFilterOpen(false)}
                  className="hidden h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:border-brand-purple hover:text-foreground lg:inline-flex"
                  title="Close filters"
                  aria-label="Close filters"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto lg:overflow-visible">
              {/* Mode */}
              <FilterGroup title="MODE">
                {MODES.map((m) => (
                  <label
                    key={m}
                    className="flex cursor-pointer items-center gap-2.5 py-1.5 text-sm"
                  >
                    <span
                      className={[
                        "flex h-4 w-4 items-center justify-center rounded-full border-2 transition",
                        tempFilters.mode === m
                          ? "border-brand-purple"
                          : "border-muted-foreground/40",
                      ].join(" ")}
                    >
                      {tempFilters.mode === m && (
                        <span className="h-2 w-2 rounded-full bg-brand-purple" />
                      )}
                    </span>
                    <input
                      type="radio"
                      name="mode"
                      className="sr-only"
                      checked={tempFilters.mode === m}
                      onChange={() =>
                        setTempFilters((p) => ({ ...p, mode: m }))
                      }
                    />
                    <span className="text-foreground">{m}</span>
                  </label>
                ))}
              </FilterGroup>

              {/* Category */}
              <FilterGroup title="CATEGORY">
                {CATEGORIES.map((c) => {
                  const checked = tempFilters.categories.includes(c);
                  return (
                    <label
                      key={c}
                      className="flex cursor-pointer items-center gap-2.5 py-1.5 text-sm"
                    >
                      <span
                        className={[
                          "flex h-4 w-4 items-center justify-center rounded-[4px] border-2 transition",
                          checked
                            ? "border-brand-purple bg-brand-purple"
                            : "border-muted-foreground/40",
                        ].join(" ")}
                      >
                        {checked && (
                          <svg
                            viewBox="0 0 12 12"
                            className="h-2.5 w-2.5 text-white"
                          >
                            <path
                              d="M2 6l3 3 5-6"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                            />
                          </svg>
                        )}
                      </span>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggleTempCategory(c)}
                      />
                      <span className="text-foreground">{c}</span>
                    </label>
                  );
                })}
              </FilterGroup>

              {/* Duration */}
              <FilterGroup title="DURATION">
                {DURATIONS.map((d) => {
                  const label =
                    d === "Short"
                      ? "Short (< 1 month)"
                      : d === "Medium"
                        ? "Medium (1–3 months)"
                        : d === "Long"
                          ? "Long (3+ months)"
                          : d;
                  return (
                    <label
                      key={d}
                      className="flex cursor-pointer items-center gap-2.5 py-1.5 text-sm"
                    >
                      <span
                        className={[
                          "flex h-4 w-4 items-center justify-center rounded-full border-2 transition",
                          tempFilters.duration === d
                            ? "border-brand-purple"
                            : "border-muted-foreground/40",
                        ].join(" ")}
                      >
                        {tempFilters.duration === d && (
                          <span className="h-2 w-2 rounded-full bg-brand-purple" />
                        )}
                      </span>
                      <input
                        type="radio"
                        name="duration"
                        className="sr-only"
                        checked={tempFilters.duration === d}
                        onChange={() =>
                          setTempFilters((p) => ({ ...p, duration: d }))
                        }
                      />
                      <span className="text-foreground">{label}</span>
                    </label>
                  );
                })}
              </FilterGroup>

              {/* Start date */}
              <FilterGroup title="START DATE">
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="date"
                    value={tempFilters.startDate}
                    onChange={(e) =>
                      setTempFilters((p) => ({
                        ...p,
                        startDate: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-purple focus:outline-none"
                  />
                </div>
              </FilterGroup>

              {/* Price */}
              <FilterGroup title="PRICE RANGE">
                <input
                  type="range"
                  min={FILTER_MIN_PRICE}
                  max={FILTER_MAX_PRICE}
                  step={PRICE_STEP}
                  value={tempFilters.price}
                  onChange={(e) =>
                    setTempFilters((p) => ({
                      ...p,
                      price: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-brand-purple"
                />
                <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatCompactPrice(FILTER_MIN_PRICE)}</span>
                  <span className="font-semibold text-foreground">
                    Up to {formatCompactPrice(tempFilters.price)}
                  </span>
                  <span>{formatCompactPrice(FILTER_MAX_PRICE)}</span>
                </div>
              </FilterGroup>
            </div>

            {/* Sidebar Bottom Buttons */}
            <div className="mt-8 flex flex-col gap-2.5 border-t border-border pt-6">
              <button
                type="button"
                onClick={applyFilters}
                className="flex h-11 items-center justify-center rounded-xl bg-brand-purple px-4 text-sm font-semibold text-white transition hover:brightness-110"
              >
                {`Show ${tempFilteredCount} ${tempFilteredCount === 1 ? "Result" : "Results"}`}
              </button>
              <button
                type="button"
                onClick={reset}
                className="flex h-11 items-center justify-center rounded-xl border border-border text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                Reset
              </button>
            </div>
          </aside>

          {/* Main */}
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between lg:gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground sm:text-2xl lg:text-3xl">
                  Explore Courses
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
                  {filtered.length}{" "}
                  {filtered.length === 1 ? "course" : "courses"} found
                </p>
              </div>
              <div className="flex w-full items-center gap-3 sm:w-auto">
                <div className="relative flex-1 sm:w-80">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search AI, Data, Web3..."
                    className="w-full rounded-full border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-purple focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(true)}
                  className="flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted lg:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filter
                </button>
                {!isDesktopFilterOpen && (
                  <button
                    type="button"
                    onClick={() => setIsDesktopFilterOpen(true)}
                    className="hidden h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted lg:inline-flex"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Show Filters
                  </button>
                )}
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-sm font-medium text-muted-foreground">
                  Applied:
                </span>
                {appliedFilters.mode !== "All" && (
                  <FilterTag
                    label={appliedFilters.mode}
                    onRemove={() => removeFilter("mode")}
                  />
                )}
                {appliedFilters.categories.map((c) => (
                  <FilterTag
                    key={c}
                    label={c}
                    onRemove={() => removeFilter("categories", c)}
                  />
                ))}
                {appliedFilters.duration !== "Any" && (
                  <FilterTag
                    label={appliedFilters.duration}
                    onRemove={() => removeFilter("duration")}
                  />
                )}
                {appliedFilters.price < FILTER_MAX_PRICE && (
                  <FilterTag
                    label={`Under ${formatCompactPrice(appliedFilters.price)}`}
                    onRemove={() => removeFilter("price")}
                  />
                )}
                {appliedFilters.startDate && (
                  <FilterTag
                    label={appliedFilters.startDate}
                    onRemove={() => removeFilter("startDate")}
                  />
                )}
                <button
                  onClick={reset}
                  className="text-xs font-semibold text-brand-purple hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c, i) => (
                <CourseCard key={`${c.title}-${i}`} c={c} />
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                  No courses match your filters.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5 border-t border-border pt-4 first-of-type:border-t-0 first-of-type:pt-2 lg:mt-7 lg:pt-5 lg:first-of-type:pt-7">
      <h3 className="mb-1.5 text-[10px] font-bold tracking-[0.12em] text-muted-foreground lg:mb-2 lg:text-xs">
        {title}
      </h3>
      <div>{children}</div>
    </div>
  );
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-purple/10 px-3 py-1 text-xs font-medium text-brand-purple">
      {label}
      <button
        onClick={onRemove}
        className="rounded-full transition hover:bg-brand-purple/20"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function CourseCard({ c }: { c: Course }) {
  const [open, setOpen] = useState(false);
  const slug = slugFor(c.title);
  return (
    <article
      className={[
        "flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition hover:-translate-y-1 hover:shadow-xl",
        c.selected ? "ring-2 ring-brand-purple" : "ring-1 ring-border",
      ].join(" ")}
    >
      <div className="relative h-40 overflow-hidden">
        <Link
          to="/course-detail"
          search={{ course: slug }}
          className="block h-full w-full"
        >
          <img
            src={c.image}
            alt={c.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </Link>
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-brand-purple shadow-sm">
          <MapPin className="h-3 w-3" />
          {c.modeBadge}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-brand-orange px-3 py-1 text-xs font-medium text-white shadow-sm">
          {c.level}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="min-h-[4rem]">
          <h3 className="text-base font-bold leading-tight text-foreground">
            <Link
              to="/course-detail"
              search={{ course: slug }}
              className="transition hover:text-brand-purple"
            >
              {c.title}
            </Link>
          </h3>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-brand-orange text-brand-orange" />
            <span className="font-semibold text-foreground">{c.rating}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {c.students}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {c.duration}
          </span>
        </div>
        <div className="mt-auto pt-4 grid grid-cols-2 gap-3">
          <Link
            to="/course-detail"
            search={{ course: slug }}
            className="group inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-brand-orange px-3 text-center text-sm font-semibold text-white shadow-[0_10px_24px_-16px_rgba(249,115,22,0.95)] transition hover:-translate-y-0.5 hover:brightness-110"
          >
            <span>Register Now</span>
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-brand-purple/35 bg-brand-purple/5 px-3 text-center text-sm font-semibold text-brand-purple transition hover:-translate-y-0.5 hover:bg-brand-purple hover:text-white"
          >
            <Download className="h-4 w-4" />
            Download Brochure
          </button>
        </div>
      </div>
      <BrochureDownloadDialog
        open={open}
        onOpenChange={setOpen}
        courseTitle={c.title}
        brochureUrl={`/brochures/${slug}-brochure.pdf`}
      />
    </article>
  );
}
