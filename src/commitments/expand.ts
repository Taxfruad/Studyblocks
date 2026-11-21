import { addDays } from '../calendar/dates'
import type { Commitment, Occurrence } from './types'

/** A local date + wall-clock time as a real instant. */
export function localInstant(dateKey: string, hhmm: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number)
  const [hh, mm] = hhmm.split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm)
}

export function weekdayOf(dateKey: string): number {
  return localInstant(dateKey, '12:00').getDay()
}

/** A single week can be moved at most this far, so we look this far outside the range. */
const MOVE_SLACK_DAYS = 7

function occurrence(c: Commitment, originalDate: string): Occurrence | null {
  const exception = c.exceptions?.[originalDate]
  if (exception && 'skip' in exception) return null
  const date = exception?.date ?? originalDate
  const startTime = exception?.startTime ?? c.startTime
  const endTime = exception?.endTime ?? c.endTime
  const occ: Occurrence = {
    id: `${c.id}::${originalDate}`,
    commitmentId: c.id,
    originalDate,
    date,
    title: c.title,
    type: c.type,
    start: localInstant(date, startTime).toISOString(),
    end: localInstant(date, endTime).toISOString(),
    recurring: Boolean(c.weekly),
  }
  if (c.courseId) occ.courseId = c.courseId
  return occ
}

/** Turns commitments into the occurrences between two dates (inclusive), sorted by start. */
export function expandCommitments(cs: Commitment[], fromKey: string, toKey: string): Occurrence[] {
  const out: Occurrence[] = []
  for (const c of cs) {
    if (!c.weekly) {
      const occ = occurrence(c, c.date)
      if (occ) out.push(occ)
      continue
    }
    const days = new Set(c.weekly.days)
    let key = [c.date, addDays(fromKey, -MOVE_SLACK_DAYS)].sort()[1]
    let last = addDays(toKey, MOVE_SLACK_DAYS)
    if (c.weekly.until && c.weekly.until < last) last = c.weekly.until
    for (; key <= last; key = addDays(key, 1)) {
      if (!days.has(weekdayOf(key))) continue
      const occ = occurrence(c, key)
      if (occ) out.push(occ)
    }
  }
  return out
    .filter((o) => o.date >= fromKey && o.date <= toKey)
    .sort((a, b) => a.start.localeCompare(b.start))
}
