import ICAL from 'ical.js'
import { isCanvasAssignmentUid, splitCanvasTitle } from './canvas'
import type { ParsedItem } from './types'

export class IcsParseError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'IcsParseError'
  }
}

/** Recurring events are expanded only inside this window, so endless rules can't hang the app. */
const WINDOW_DAYS_BACK = 365
const WINDOW_DAYS_AHEAD = 365
const MAX_OCCURRENCES = 500
/** Safety stop for rules that start long before the window. */
const MAX_ITERATIONS = 20_000

const DAY_MS = 24 * 60 * 60 * 1000

function formatTime(t: ICAL.Time): string {
  // All-day values stay plain dates so they never shift across time zones.
  return t.isDate ? t.toString().slice(0, 10) : t.toJSDate().toISOString()
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

function toItem(event: ICAL.Event, start: ICAL.Time, end: ICAL.Time | null, uid: string): ParsedItem {
  const summary = optionalString(event.summary) ?? '(untitled)'
  const { title, courseName } = splitCanvasTitle(summary)
  const startStr = formatTime(start)
  let endStr = end ? formatTime(end) : undefined
  // Canvas deadlines have DTEND equal to DTSTART. Treat them as zero-length.
  if (endStr !== undefined && endStr <= startStr) endStr = undefined
  // An all-day event that ends the next day is still a single-day item.
  if (start.isDate && end && end.isDate && end.compare(start.clone().adjust(1, 0, 0, 0)) === 0) {
    endStr = undefined
  }

  const item: ParsedItem = {
    uid,
    kind: isCanvasAssignmentUid(event.uid ?? '') ? 'assignment' : 'event',
    title,
    start: startStr,
    allDay: start.isDate,
  }
  if (courseName) item.courseName = courseName
  if (endStr) item.end = endStr
  const url = optionalString(event.component.getFirstPropertyValue('url'))
  if (url) item.url = url
  const description = optionalString(event.description)
  if (description) item.description = description
  return item
}

export function parseIcs(text: string, now: Date = new Date()): ParsedItem[] {
  if (!/BEGIN:VCALENDAR/i.test(text)) {
    throw new IcsParseError("This doesn't look like a calendar (.ics) file.")
  }

  let root: ICAL.Component
  try {
    root = new ICAL.Component(ICAL.parse(text))
  } catch (cause) {
    throw new IcsParseError('The calendar file could not be read.', { cause })
  }

  const windowStart = ICAL.Time.fromJSDate(new Date(now.getTime() - WINDOW_DAYS_BACK * DAY_MS), true)
  const windowEnd = ICAL.Time.fromJSDate(new Date(now.getTime() + WINDOW_DAYS_AHEAD * DAY_MS), true)

  const items: ParsedItem[] = []
  for (const vevent of root.getAllSubcomponents('vevent')) {
    const event = new ICAL.Event(vevent)
    // Modified single occurrences (RECURRENCE-ID) are applied through their parent event.
    if (event.isRecurrenceException()) continue
    const uid = optionalString(event.uid)
    if (!uid || !event.startDate) continue

    if (!event.isRecurring()) {
      items.push(toItem(event, event.startDate, event.endDate ?? null, uid))
      continue
    }

    const iterator = event.iterator()
    let count = 0
    for (let i = 0; i < MAX_ITERATIONS && count < MAX_OCCURRENCES; i++) {
      const next = iterator.next()
      if (!next || next.compare(windowEnd) > 0) break
      if (next.compare(windowStart) < 0) continue
      const details = event.getOccurrenceDetails(next)
      const start = formatTime(details.startDate)
      items.push(toItem(details.item, details.startDate, details.endDate, `${uid}::${start}`))
      count++
    }
  }
  return items
}
