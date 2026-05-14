## Home Filter Change Log

### Step 1
- Identified target files:
  - `frontend/src/components/landing/CourseSearchBar.tsx`
  - `frontend/src/data/courses.ts`
  - `frontend/src/routes/courses.tsx`
- Confirmed home page filter currently uses `Find Course` text input + `Mode` + `Schedule` + `Location`.
- Confirmed course catalog currently has three available courses and pricing tiers used for mode variants.

### Step 2
- Updated `frontend/src/data/courses.ts`:
  - Changed `Advanced Coding Entrepreneur` price from `₹1,70,000` to `₹1,75,000`.
  - Added exported course catalog helpers:
    - `COURSE_SLUGS`
    - `CourseSlug`
    - `CourseModeOption`
    - `AvailableCourseOption`
    - `listAvailableCourses()`
  - Kept `getCourse()` behavior unchanged while tightening slug typing.

### Step 3
- Updated `frontend/src/components/landing/CourseSearchBar.tsx`:
  - Replaced free-text `Find Course` input with a dropdown of available courses.
  - Removed the `Schedule` filter.
  - Set `Location` filter to `Madhapur` only.
  - Wired `Mode` dropdown to selected course pricing tiers via `listAvailableCourses()`.
  - Added reactive mode reset behavior when the selected course changes.
  - Updated search results display to show `mode label + mode subtitle + location`.
