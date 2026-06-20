// JST (UTC+9) date utilities

export function getJSTDateString(date: Date = new Date()): string {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0]
}

// Returns start of the JST day as a Date (for Supabase timestamp comparisons)
export function getJSTDayStart(date: Date = new Date()): Date {
  return new Date(getJSTDateString(date) + 'T00:00:00+09:00')
}
