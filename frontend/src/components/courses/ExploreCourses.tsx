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
  LayoutGrid,
  List,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import courseFullstack from "@/assets/course-fullstack.jpg";
import courseUiux from "@/assets/course-uiux.jpg";
import courseData from "@/assets/course-data.jpg";
import { BrochureDownloadDialog } from "@/components/course-detail/BrochureDownloadDialog";
import { getCourse } from "@/data/courses";
import { useCmsSection } from "@/hooks/useCmsSection";
import {
  COURSES_CATALOG_FALLBACK,
  type CatalogCourse,
  type CoursesCatalogData,
} from "@/lib/api";

type Mode = "All" | "Online" | "Offline";
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
  slug: string;
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
  filterCategories: Category[];
  nextBatchStart: string;
  batchNote: string;
  selected?: boolean;
  // Lowest price option for the course (used as the starting price).
  price: number;
  // Highest price option across all modes/tier variants.
  maxPrice: number;
};

/** Next advertised batch start (ISO date) per course — powers START DATE filter. */
const NEXT_BATCH_START: Record<ReturnType<typeof slugFor>, string> = {
  fullstack: "2026-06-01",
  "data-analytics": "2026-07-15",
  uiux: "2026-08-01",
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
    batchNote: "Upcoming Batch",
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
    batchNote: "Next Batch Starting Soon",
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
    batchNote: "Upcoming Batch",
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
  const slug = slugFor(course.title);
  const minPrice = bounds?.minPrice ?? course.price;
  const maxPrice = bounds?.maxPrice ?? minPrice;
  const row = {
    ...course,
    modeBadge: modeMeta.modeBadge,
    modeKeywords: modeMeta.modeKeywords,
    price: minPrice,
    maxPrice: Math.max(maxPrice, minPrice),
  };
  return {
    ...row,
    slug,
    filterCategories: courseFilterCategories(row),
    nextBatchStart: NEXT_BATCH_START[slug],
  };
});

/** Maps an admin-created catalog course into a listing Course row. */
function catalogToCourse(entry: CatalogCourse): Course {
  const tiers = entry.pricingTiers ?? [];
  const prices = tiers
    .map((t) => parsePriceToNumber(t.price))
    .filter((p) => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : minPrice;
  const modes = entry.modes ?? [];
  const months = Number((entry.duration ?? "").match(/\d+/)?.[0] ?? 0);
  const category: Category = (["AI", "Design", "Development", "Data"] as const).includes(
    entry.category as Category,
  )
    ? (entry.category as Category)
    : "Development";
  const row = {
    title: entry.title,
    image: entry.heroImage || courseFullstack,
    rating: entry.rating ?? 4.8,
    students: entry.students ?? "",
    duration: entry.duration ?? "",
    durationMonths: months,
    level: "Beginner",
    category,
    batchNote: entry.batchNote ?? "",
    price: minPrice,
    maxPrice: Math.max(maxPrice, minPrice),
    modeBadge: modes.join(" / "),
    modeKeywords: modes.map((m) => m.toLowerCase()),
  };
  return {
    ...row,
    slug: entry.slug,
    selected: false,
    filterCategories: courseFilterCategories(row),
    nextBatchStart: entry.batchDate ?? "",
  };
}

const MODES: Mode[] = ["All", "Online", "Offline"];
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

function courseFilterCategories(course: Pick<Course, "title" | "category">): Category[] {
  const tags = new Set<Category>([course.category]);
  if (/\bai\b|ai\s*\/|machine learning|claude/i.test(course.title)) {
    tags.add("AI");
  }
  return [...tags];
}

function matchesFilters(
  course: Course,
  filters: CourseFilters,
  searchQuery: string,
): boolean {
  if (
    filters.mode !== "All" &&
    !course.modeKeywords.includes(filters.mode.toLowerCase())
  ) {
    return false;
  }
  if (filters.categories.length) {
    const tags = course.filterCategories;
    if (!filters.categories.some((cat) => tags.includes(cat))) return false;
  }
  if (!durationMatch(filters.duration, course.durationMonths)) return false;
  if (course.price > filters.price) return false;
  if (filters.startDate && course.nextBatchStart < filters.startDate) {
    return false;
  }
  if (searchQuery && !course.title.toLowerCase().includes(searchQuery.toLowerCase())) {
    return false;
  }
  return true;
}

export function ExploreCourses() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDesktopFilterOpen, setIsDesktopFilterOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const [filters, setFilters] = useState<CourseFilters>(getDefaultFilters());

  // Admin-created courses (published only) are appended to the built-in list.
  const catalog = useCmsSection<CoursesCatalogData>(
    "courses_catalog",
    COURSES_CATALOG_FALLBACK,
  );
  const allCourses = useMemo(() => {
    const extra = (catalog.courses ?? [])
      .filter((c) => c.published !== false && c.slug && c.title)
      .map(catalogToCourse);
    return [...COURSES, ...extra];
  }, [catalog]);

  const reset = () => {
    setFilters(getDefaultFilters());
    setQuery("");
  };

  const openFilters = () => setIsFilterOpen(true);

  const toggleCategory = (c: Category) =>
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(c)
        ? prev.categories.filter((x) => x !== c)
        : [...prev.categories, c],
    }));

  const removeFilter = (key: keyof CourseFilters, value?: Category) => {
    setFilters((prev) => {
      const next = { ...prev };
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
      return next;
    });
  };

  const filtered = useMemo(
    () => allCourses.filter((c) => matchesFilters(c, filters, query)),
    [allCourses, filters, query],
  );

  const hasActiveFilters =
    filters.mode !== "All" ||
    filters.categories.length > 0 ||
    filters.duration !== "Any" ||
    filters.price < FILTER_MAX_PRICE ||
    filters.startDate !== "";

  return (
    <section className="border-t border-border bg-muted/40 py-10 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-10">
        <div
          className={[
            "grid gap-6 lg:gap-8",
            isDesktopFilterOpen ? "lg:grid-cols-[minmax(0,240px)_1fr]" : "lg:grid-cols-1",
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
              isDesktopFilterOpen ? "lg:block" : "lg:hidden",
              isFilterOpen
                ? "fixed bottom-0 left-0 right-0 z-50 flex max-h-[90vh] flex-col rounded-t-[2rem] bg-white px-6 pb-6 pt-4 shadow-2xl transition-transform duration-300 ease-out translate-y-0 lg:relative lg:inset-auto lg:max-h-none lg:translate-y-0 lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none"
                : "fixed bottom-0 left-0 right-0 z-50 flex max-h-[90vh] translate-y-full flex-col rounded-t-[2rem] bg-white px-6 pb-6 pt-4 shadow-2xl transition-transform duration-300 ease-out lg:relative lg:inset-auto lg:max-h-none lg:translate-y-0 lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none",
            ].join(" ")}
          >
            <div className="flex min-h-0 flex-1 flex-col lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:rounded-2xl lg:bg-white lg:p-6 lg:shadow-[0_2px_12px_rgba(0,0,0,0.04)] lg:ring-1 lg:ring-border">
            {/* Mobile Header Drag Handle */}
            <div className="mx-auto mb-1.5 h-1 w-10 rounded-full bg-muted/60 lg:hidden" />
            {/* Mobile Header */}
            <div className="mb-3 flex items-center justify-between lg:hidden">
              <h2 className="text-base font-bold text-foreground">Filters</h2>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="rounded-full p-1.5 hover:bg-muted"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex shrink-0 items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2 text-foreground">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-purple/10">
                  <SlidersHorizontal className="h-4 w-4 text-brand-purple" />
                </span>
                <span className="text-base font-bold text-foreground">Filters</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium text-brand-purple transition hover:bg-brand-purple/10"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setIsDesktopFilterOpen(false)}
                  className="hidden h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted lg:inline-flex"
                  title="Close filters"
                  aria-label="Close filters"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
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
                        filters.mode === m
                          ? "border-brand-purple"
                          : "border-muted-foreground/40",
                      ].join(" ")}
                    >
                      {filters.mode === m && (
                        <span className="h-2 w-2 rounded-full bg-brand-purple" />
                      )}
                    </span>
                    <input
                      type="radio"
                      name="mode"
                      className="sr-only"
                      checked={filters.mode === m}
                      onChange={() => setFilters((p) => ({ ...p, mode: m }))}
                    />
                    <span className="text-foreground">{m}</span>
                  </label>
                ))}
              </FilterGroup>

              {/* Category */}
              <FilterGroup title="CATEGORY">
                {CATEGORIES.map((c) => {
                  const checked = filters.categories.includes(c);
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
                        onChange={() => toggleCategory(c)}
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
                          filters.duration === d
                          ? "border-brand-purple"
                          : "border-muted-foreground/40",
                      ].join(" ")}
                    >
                        {filters.duration === d && (
                          <span className="h-2 w-2 rounded-full bg-brand-purple" />
                        )}
                      </span>
                      <input
                        type="radio"
                        name="duration"
                        className="sr-only"
                        checked={filters.duration === d}
                        onChange={() =>
                          setFilters((p) => ({ ...p, duration: d }))
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
                    value={filters.startDate}
                    onChange={(e) =>
                      setFilters((p) => ({
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
                  value={filters.price}
                  onChange={(e) =>
                    setFilters((p) => ({
                      ...p,
                      price: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-brand-purple"
                />
                <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatCompactPrice(FILTER_MIN_PRICE)}</span>
                  <span className="font-semibold text-foreground">
                    Up to {formatCompactPrice(filters.price)}
                  </span>
                  <span>{formatCompactPrice(FILTER_MAX_PRICE)}</span>
                </div>
              </FilterGroup>
            </div>
            </div>
          </aside>

          {/* Main */}
          <div className="min-w-0">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-[2rem]">
                  Explore Courses
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
                  {filtered.length}{" "}
                  {filtered.length === 1 ? "course" : "courses"} found
                  {hasActiveFilters ? " · filters applied" : ""}
                </p>
              </div>
              <div className="flex w-full items-center gap-3 lg:max-w-md lg:flex-1 lg:justify-end">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search AI, Data, Web3..."
                    className="w-full rounded-full border border-border/80 bg-white py-3 pl-11 pr-4 text-sm text-foreground shadow-[0_2px_12px_rgba(0,0,0,0.04)] ring-1 ring-black/5 placeholder:text-muted-foreground focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={openFilters}
                  className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted lg:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4 text-brand-purple" />
                  Filters
                </button>
                {!isDesktopFilterOpen && (
                  <button
                    type="button"
                    onClick={() => setIsDesktopFilterOpen(true)}
                    className="hidden h-11 shrink-0 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted lg:inline-flex"
                  >
                    <SlidersHorizontal className="h-4 w-4 text-brand-purple" />
                    Show Filters
                  </button>
                )}
                <div className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    aria-pressed={view === "list"}
                    className={[
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition",
                      view === "list"
                        ? "bg-brand-orange/10 text-brand-orange"
                        : "text-muted-foreground hover:bg-muted",
                    ].join(" ")}
                  >
                    <List className="h-4 w-4" />
                    List
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("grid")}
                    aria-pressed={view === "grid"}
                    className={[
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition",
                      view === "grid"
                        ? "bg-brand-orange/10 text-brand-orange"
                        : "text-muted-foreground hover:bg-muted",
                    ].join(" ")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    Card
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-sm font-medium text-muted-foreground">
                  Applied:
                </span>
                {filters.mode !== "All" && (
                  <FilterTag
                    label={filters.mode}
                    onRemove={() => removeFilter("mode")}
                  />
                )}
                {filters.categories.map((c) => (
                  <FilterTag
                    key={c}
                    label={c}
                    onRemove={() => removeFilter("categories", c)}
                  />
                ))}
                {filters.duration !== "Any" && (
                  <FilterTag
                    label={filters.duration}
                    onRemove={() => removeFilter("duration")}
                  />
                )}
                {filters.price < FILTER_MAX_PRICE && (
                  <FilterTag
                    label={`Under ${formatCompactPrice(filters.price)}`}
                    onRemove={() => removeFilter("price")}
                  />
                )}
                {filters.startDate && (
                  <FilterTag
                    label={filters.startDate}
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

            {filtered.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground sm:mt-10">
                No courses match your filters.
              </div>
            ) : view === "grid" ? (
              <div
                className={[
                  "mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 sm:gap-6",
                  isDesktopFilterOpen
                    ? "lg:grid-cols-2 xl:grid-cols-3"
                    : "lg:grid-cols-3",
                ].join(" ")}
              >
                {filtered.map((c, i) => (
                  <CourseCard key={`${c.title}-${i}`} c={c} />
                ))}
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-border sm:mt-8">
                <div className="overflow-x-auto">
                  <div className="min-w-[780px]">
                    <div
                      className={`${LIST_COLS} bg-brand-orange/5 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground`}
                    >
                      <div>Batch #</div>
                      <div>Course Details</div>
                      <div>Duration</div>
                      <div>Rating</div>
                      <div>Tuition</div>
                      <div className="text-center">Action</div>
                    </div>
                    {filtered.map((c, i) => (
                      <CourseListRow key={`${c.title}-${i}`} c={c} />
                    ))}
                  </div>
                </div>
              </div>
            )}
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
    <div className="mt-5 border-t border-border/80 pt-4 first:mt-4 first:border-t-0 first:pt-0">
      <h3 className="mb-2 text-[11px] font-bold tracking-[0.14em] text-brand-purple/80">
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

function CourseMeta({ c, className }: { c: Course; className?: string }) {
  return (
    <div
      className={[
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground",
        className ?? "",
      ].join(" ")}
    >
      <span className="inline-flex items-center gap-1">
        <Star className="h-3.5 w-3.5 fill-brand-orange text-brand-orange" />
        <span className="font-medium text-foreground">{c.rating}</span>
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
  );
}

function CourseCard({ c }: { c: Course }) {
  const [open, setOpen] = useState(false);
  const slug = c.slug;
  const brochureUrl = getCourse(slug).brochureUrl;

  return (
    <article
      className={[
        "flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] ring-1 transition hover:-translate-y-1 hover:shadow-xl",
        c.selected ? "ring-brand-purple ring-2" : "ring-border",
      ].join(" ")}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Link
          to="/course-detail"
          search={{ course: slug }}
          className="block h-full w-full"
        >
          <img
            src={c.image}
            alt={c.title}
            width={800}
            height={512}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </Link>
        <span className="absolute left-3 top-3 inline-flex max-w-[calc(100%-7rem)] items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand-purple shadow-sm">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{c.modeBadge}</span>
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-brand-orange px-3 py-1 text-xs font-semibold text-white shadow-sm">
          {c.level}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <Link
          to="/course-detail"
          search={{ course: slug }}
          className="line-clamp-2 text-base font-bold leading-snug text-foreground transition hover:text-brand-purple"
        >
          {c.title}
        </Link>

        <CourseMeta c={c} className="mt-3" />

        <div className="mt-auto flex flex-col gap-2 pt-4 sm:grid sm:grid-cols-2 sm:gap-1.5">
          <Link
            to="/course-detail"
            search={{ course: slug }}
            className="flex h-9 min-w-0 items-center justify-center rounded-lg bg-brand-orange px-3 text-center text-xs font-semibold leading-none text-white shadow-sm transition hover:brightness-110"
          >
            Register Now
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-9 min-w-0 items-center justify-center rounded-lg border border-brand-purple px-3 text-center text-xs font-semibold leading-none text-brand-purple transition hover:bg-brand-purple hover:text-white"
          >
            Download Syllabus
          </button>
        </div>
      </div>

      <BrochureDownloadDialog
        open={open}
        onOpenChange={setOpen}
        courseTitle={c.title}
        brochureUrl={brochureUrl}
      />
    </article>
  );
}

/** Shared column template so the list-view header and rows stay aligned. */
const LIST_COLS =
  "grid grid-cols-[100px_minmax(150px,1.5fr)_80px_104px_112px_128px] items-center gap-3";

function formatBatchDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CourseListRow({ c }: { c: Course }) {
  const [open, setOpen] = useState(false);
  const slug = c.slug;
  const brochureUrl = getCourse(slug).brochureUrl;

  return (
    <div
      className={[
        LIST_COLS,
        "border-t border-border px-4 py-4 transition hover:bg-muted/30",
        c.selected ? "bg-brand-purple/[0.04]" : "",
      ].join(" ")}
    >
      {/* Batch */}
      <div className="flex items-center gap-2">
        {c.nextBatchStart ? (
          <>
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-foreground">
              {formatBatchDate(c.nextBatchStart)}
            </span>
          </>
        ) : (
          <>
            <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40" />
            <span className="text-xs font-medium text-muted-foreground">
              Flexible intake
            </span>
          </>
        )}
      </div>

      {/* Course details */}
      <div className="min-w-0">
        <Link
          to="/course-detail"
          search={{ course: slug }}
          className="line-clamp-1 text-sm font-medium text-foreground transition hover:text-brand-purple"
        >
          {c.title}
        </Link>
        <span className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{c.modeBadge}</span>
        </span>
      </div>

      {/* Duration */}
      <div className="text-xs text-foreground">{c.duration}</div>

      {/* Rating */}
      <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
        <Star className="h-3.5 w-3.5 shrink-0 fill-brand-orange text-brand-orange" />
        <span className="font-medium text-foreground">{c.rating}</span>
        <span className="truncate">· {c.students}</span>
      </div>

      {/* Tuition */}
      <div className="min-w-0">
        <div className="text-sm font-semibold text-foreground">
          ₹{c.price.toLocaleString("en-IN")}
        </div>
        {c.batchNote ? (
          <div className="truncate text-[11px] font-medium text-emerald-600">
            {c.batchNote}
          </div>
        ) : null}
      </div>

      {/* Action */}
      <div className="flex flex-col items-stretch gap-1.5">
        <Link
          to="/course-detail"
          search={{ course: slug }}
          className="flex h-9 items-center justify-center whitespace-nowrap rounded-full bg-brand-orange px-4 text-xs font-semibold leading-none text-white shadow-sm transition hover:brightness-110"
        >
          Enroll Now
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-1 whitespace-nowrap text-[11px] font-semibold text-muted-foreground transition hover:text-brand-purple"
        >
          <Download className="h-3.5 w-3.5 shrink-0" />
          PDF
        </button>
      </div>

      <BrochureDownloadDialog
        open={open}
        onOpenChange={setOpen}
        courseTitle={c.title}
        brochureUrl={brochureUrl}
      />
    </div>
  );
}
