import type { CalendarItem } from '../db/db'

const pad = (n: number) => String(n).padStart(2, '0')

/** `YYYY-MM-DD` for a Date in the viewer's local time zone. */
export function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** The local calendar day an item falls on. All-day items keep their date as-is. */
export function itemDateKey(item: Pick<CalendarItem, 'start' | 'allDay'>): string {
  return item.allDay ? item.start.slice(0, 10) : localDateKey(new Date(item.start))
}

/** Adds whole days to a `YYYY-MM-DD` key. */
export function addDays(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  return localDateKey(new Date(y, m - 1, d + days))
}

/** "Fri, Dec 4 · 11:59 PM", or "Sat, Dec 5" for all-day items. */
export function formatDue(item: Pick<CalendarItem, 'start' | 'allDay'>): string {
  const [y, m, d] = itemDateKey(item).split('-').map(Number)
  const day = new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  if (item.allDay) return day
  const time = new Date(item.start).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return `${day} · ${time}`
}
