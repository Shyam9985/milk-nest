/** Number and date formatting shared by the chapters that show live figures. */

/** 3134.42 -> "3,134". Litres are shown whole; the decimals are noise at display size. */
export const formatLitres = (value) => Math.round(Number(value) || 0).toLocaleString();

/** countOf(1, "farm") -> "1 farm"; countOf(4, "branch", "branches") -> "4 branches". */
export const countOf = (value, singular, plural = `${singular}s`) =>
  `${Number(value || 0).toLocaleString()} ${Number(value) === 1 ? singular : plural}`;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* "2026-10-05" -> "Mon". Built from its parts on purpose: new Date("2026-10-05") is
   midnight UTC, which is still the day before in any timezone behind UTC. */
export const weekdayOf = (date) => {
  const [year, month, day] = String(date).split("-").map(Number);
  return WEEKDAYS[new Date(year, month - 1, day).getDay()];
};
