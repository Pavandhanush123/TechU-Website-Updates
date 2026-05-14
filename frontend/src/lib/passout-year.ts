const BASE_START_YEAR = 2021;
const BASE_END_YEAR = 2026;
const BASE_REFERENCE_YEAR = 2026;
const APRIL_MONTH_INDEX = 3;

export type PassoutYearRange = {
  startYear: number;
  endYear: number;
  options: number[];
};

export function getPassoutYearRange(today: Date = new Date()): PassoutYearRange {
  const year = today.getFullYear();
  const month = today.getMonth();
  const effectiveYear = month >= APRIL_MONTH_INDEX ? year : year - 1;
  const shift = Math.max(0, effectiveYear - BASE_REFERENCE_YEAR);

  const startYear = BASE_START_YEAR + shift;
  const endYear = BASE_END_YEAR + shift;
  const options = Array.from(
    { length: endYear - startYear + 1 },
    (_, index) => endYear - index,
  );

  return { startYear, endYear, options };
}

export function isPassoutYearInRange(
  value: string,
  today: Date = new Date(),
): boolean {
  if (!/^\d{4}$/.test(value.trim())) return false;
  const numeric = Number(value);
  const { startYear, endYear } = getPassoutYearRange(today);
  return numeric >= startYear && numeric <= endYear;
}
