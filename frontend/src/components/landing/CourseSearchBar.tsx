import { useEffect, useMemo, useState } from "react";
import { Search, MapPin } from "lucide-react";
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
import { ApplyDialog } from "@/components/course-detail/ApplyDialog";
import { COURSE_SEARCH_FALLBACK } from "@/data/course-search-fallback";
import { useCmsSection } from "@/hooks/useCmsSection";
import type { CourseSearchData } from "@/lib/api";
import {
  locationOptionsFromCourseSearch,
  resolvedCourseSearchOptions,
} from "@/lib/course-search-options";

type SearchResult = {
  title: string;
  slug: string;
  modeLabel: string;
  modeSubtitle: string;
  location: string;
};

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center gap-2.5 px-3 py-2 sm:gap-3 sm:px-5 sm:py-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple sm:h-9 sm:w-9">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold leading-tight text-foreground sm:text-xs">
          {label}
        </div>
        <div className="text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

export function CourseSearchBar() {
  const courseSearchData = useCmsSection<CourseSearchData>(
    "course_search",
    COURSE_SEARCH_FALLBACK,
  );

  const availableCourses = useMemo(
    () => resolvedCourseSearchOptions(courseSearchData),
    [courseSearchData],
  );

  const locationOptions = useMemo(
    () => locationOptionsFromCourseSearch(courseSearchData),
    [courseSearchData],
  );

  const [selectedCourse, setSelectedCourse] = useState<string>(
    () => resolvedCourseSearchOptions(COURSE_SEARCH_FALLBACK)[0]?.slug ?? "",
  );
  const [selectedMode, setSelectedMode] = useState("");
  const [location, setLocation] = useState<string>(() =>
    locationOptionsFromCourseSearch(COURSE_SEARCH_FALLBACK)[0] ?? "Madhapur",
  );
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollCourseTitle, setEnrollCourseTitle] = useState("");
  const [enrollSelectedMode, setEnrollSelectedMode] = useState<
    { label: string; subtitle: string } | undefined
  >(undefined);

  const selectedCourseData = useMemo(
    () => availableCourses.find((course) => course.slug === selectedCourse),
    [availableCourses, selectedCourse],
  );

  const selectedModes = selectedCourseData?.modes ?? [];

  useEffect(() => {
    setSelectedCourse((prev) =>
      prev && availableCourses.some((c) => c.slug === prev)
        ? prev
        : availableCourses[0]?.slug ?? "",
    );
  }, [availableCourses]);

  useEffect(() => {
    setLocation((prev) =>
      locationOptions.includes(prev) ? prev : locationOptions[0] ?? "Madhapur",
    );
  }, [locationOptions]);

  useEffect(() => {
    if (!selectedModes.length) {
      setSelectedMode("");
      return;
    }
    if (!selectedModes.some((mode) => mode.id === selectedMode)) {
      setSelectedMode(selectedModes[0].id);
    }
  }, [selectedModes, selectedMode]);

  const onSearch = () => {
    if (!selectedCourseData) {
      setResults([]);
      return;
    }
    const filteredModes = selectedCourseData.modes.filter((mode) =>
      selectedMode ? mode.id === selectedMode : true,
    );
    setResults(
      filteredModes.map((mode) => ({
        title: selectedCourseData.title,
        slug: selectedCourseData.slug,
        modeLabel: mode.label,
        modeSubtitle: mode.subtitle,
        location,
      })),
    );
  };

  return (
    <>
      <div className="relative z-20 mx-auto -mt-7 w-full max-w-[1240px] px-3 sm:-mt-9 sm:px-6 lg:-mt-10 lg:px-10">
        <div className="rounded-2xl bg-white p-2 shadow-2xl shadow-black/10 ring-1 ring-black/5 sm:p-3 sm:rounded-3xl lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-stretch lg:gap-0 lg:rounded-full lg:p-2">
          {/* Course selector */}
          <div className="lg:min-w-0 lg:border-r lg:border-border">
            <Field icon={<Search className="h-4 w-4" />} label="Find Course">
              <Select
                value={selectedCourse}
                onValueChange={setSelectedCourse}
              >
                <SelectTrigger className="h-6 w-full border-0 bg-transparent p-0 pr-6 text-left text-sm font-medium text-foreground shadow-none ring-0 focus:ring-0 focus:ring-offset-0 [&>span]:truncate [&>svg]:opacity-65">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  className="rounded-xl border border-border/70 bg-white/95 p-1.5 shadow-[0_18px_45px_-20px_rgba(0,0,0,0.45)] backdrop-blur-md"
                >
                  {availableCourses.map((course) => (
                    <SelectItem
                      key={course.slug}
                      value={course.slug}
                      className="rounded-lg px-3 py-2 text-sm font-medium focus:bg-brand-purple/10 focus:text-brand-purple"
                    >
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 sm:gap-0 lg:contents">
            <div className="lg:min-w-0 lg:border-r lg:border-border">
              <Field icon={<MapPin className="h-4 w-4" />} label="Mode">
                <Select
                  value={selectedMode}
                  onValueChange={setSelectedMode}
                >
                  <SelectTrigger className="h-6 w-full border-0 bg-transparent p-0 pr-6 text-left text-sm font-medium text-foreground shadow-none ring-0 focus:ring-0 focus:ring-offset-0 [&>span]:truncate [&>svg]:opacity-65">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    className="rounded-xl border border-border/70 bg-white/95 p-1.5 shadow-[0_18px_45px_-20px_rgba(0,0,0,0.45)] backdrop-blur-md"
                  >
                  {selectedModes.map((mode) => (
                    <SelectItem
                      key={mode.id}
                      value={mode.id}
                      className="rounded-lg px-3 py-2 text-sm font-medium focus:bg-brand-purple/10 focus:text-brand-purple"
                    >
                      {mode.label}
                    </SelectItem>
                  ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="lg:min-w-0">
              <Field icon={<MapPin className="h-4 w-4" />} label="Location">
                <Select
                  value={location}
                  onValueChange={setLocation}
                >
                  <SelectTrigger className="h-6 w-full border-0 bg-transparent p-0 pr-6 text-left text-sm font-medium text-foreground shadow-none ring-0 focus:ring-0 focus:ring-offset-0 [&>span]:truncate [&>svg]:opacity-65">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    className="rounded-xl border border-border/70 bg-white/95 p-1.5 shadow-[0_18px_45px_-20px_rgba(0,0,0,0.45)] backdrop-blur-md"
                  >
                  {locationOptions.map((loc) => (
                    <SelectItem
                      key={loc}
                      value={loc}
                      className="rounded-lg px-3 py-2 text-sm font-medium focus:bg-brand-purple/10 focus:text-brand-purple"
                    >
                      {loc}
                    </SelectItem>
                  ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>

          <button
            type="button"
            onClick={onSearch}
            className="mt-2 w-full rounded-xl bg-brand-orange px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-110 sm:py-3.5 lg:ml-2 lg:mt-0 lg:w-auto lg:rounded-full lg:px-7 lg:py-4"
          >
            Search Courses
          </button>
        </div>
      </div>

      <Dialog
        open={results !== null}
        onOpenChange={(o) => !o && setResults(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Matching courses</DialogTitle>
            <DialogDescription>
              {results?.length
                ? `${results.length} course${results.length === 1 ? "" : "s"} match your filters.`
                : "No courses match. Try adjusting your filters."}
            </DialogDescription>
          </DialogHeader>
          <ul className="mt-2 divide-y divide-border">
            {results?.map((c) => (
              <li
                key={`${c.slug}-${c.modeLabel}`}
                className="flex items-start justify-between gap-4 py-3"
              >
                <div>
                  <div className="font-medium text-foreground">{c.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {[c.modeLabel, c.modeSubtitle, c.location]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResults(null);
                    setEnrollCourseTitle(c.title);
                    setEnrollSelectedMode({
                      label: c.modeLabel,
                      subtitle: [c.modeSubtitle, c.location]
                        .filter(Boolean)
                        .join(" · "),
                    });
                    setEnrollOpen(true);
                  }}
                  className="rounded-md border border-brand-orange px-3 py-1 text-xs font-medium text-brand-orange hover:bg-brand-orange hover:text-white"
                >
                  Apply
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      <ApplyDialog
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        courseTitle={enrollCourseTitle}
        ctaLabel="Enroll Now"
        selectedMode={enrollSelectedMode}
      />
    </>
  );
}
