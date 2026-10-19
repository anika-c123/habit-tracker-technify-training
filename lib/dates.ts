// The one place that turns dates into the "YYYY-MM-DD" strings the app
// uses (and the database stores in completions.completed_on).
//
// These use the time zone of wherever the code runs: in the browser that's
// the user's own time zone, which is what "today" means in this app.

export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// "2026-10-31" + 1 → "2026-11-01". Handles month and year boundaries.
export function addDays(dateString: string, days: number): string {
  const [year, month, day] = dateString.split("-").map(Number);
  return toDateString(new Date(year, month - 1, day + days));
}

// The 7 days ending with `today`, oldest first: [today - 6, ..., today].
export function lastSevenDays(today: string): string[] {
  return [-6, -5, -4, -3, -2, -1, 0].map((offset) => addDays(today, offset));
}

// "2026-10-19" → { weekday: "M", day: 19 } for the week grid's column headers.
export function dayLabel(dateString: string): { weekday: string; day: number } {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return {
    weekday: date.toLocaleDateString(undefined, { weekday: "narrow" }),
    day,
  };
}
