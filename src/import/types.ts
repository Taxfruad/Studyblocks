/** One calendar entry pulled out of an .ics file, before it is saved. */
export type ParsedItem = {
  /** Stable id from the feed. Recurring occurrences get `${uid}::${start}`. */
  uid: string
  kind: 'assignment' | 'event'
  title: string
  courseName?: string
  /** UTC ISO string for timed items, `YYYY-MM-DD` for all-day items. */
  start: string
  /** Same format as `start`. Missing for deadlines (zero-length) items. */
  end?: string
  allDay: boolean
  url?: string
  description?: string
}
