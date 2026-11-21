import { addDays, localDateKey } from '../calendar/dates'
import { weekdayOf } from './expand'
import type { Commitment, Occurrence } from './types'

/** "This week only" or "Every week". */
export type Scope = 'one' | 'all'

const pad = (n: number) => String(n).padStart(2, '0')
const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

function endsAtNextMidnight(start: Date, end: Date): boolean {
  return localDateKey(end) === addDays(localDateKey(start), 1) && end.getHours() === 0 && end.getMinutes() === 0
}

/** End time as `HH:mm`; a commitment ending at midnight is stored as "24:00". */
function endTimeOf(start: Date, end: Date): string {
  return endsAtNextMidnight(start, end) ? '24:00' : hhmm(end)
}

/** Returns an error message, or null if the times are fine. */
export function validateTimes(start: Date, end: Date): string | null {
  if (end.getTime() <= start.getTime()) return 'The end time has to be after the start time.'
  if (localDateKey(start) !== localDateKey(end) && !endsAtNextMidnight(start, end)) {
    return 'Commitments have to start and end on the same day.'
  }
  return null
}

export function moveOccurrence(c: Commitment, occ: Occurrence, newStart: Date, newEnd: Date, scope: Scope): Commitment {
  const date = localDateKey(newStart)
  const startTime = hhmm(newStart)
  const endTime = endTimeOf(newStart, newEnd)

  if (!c.weekly) return { ...c, date, startTime, endTime }

  if (scope === 'one') {
    const exception = date === occ.originalDate ? { startTime, endTime } : { date, startTime, endTime }
    return { ...c, exceptions: { ...c.exceptions, [occ.originalDate]: exception } }
  }

  const fromDay = weekdayOf(occ.originalDate)
  const toDay = weekdayOf(date)
  const days = [...new Set(c.weekly.days.map((d) => (d === fromDay ? toDay : d)))].sort((x, y) => x - y)
  return {
    ...c,
    startTime,
    endTime,
    date: date < c.date ? date : c.date,
    weekly: { ...c.weekly, days },
  }
}

/** Returns the updated commitment, or null when the whole thing should be deleted. */
export function deleteOccurrence(c: Commitment, originalDate: string, scope: Scope): Commitment | null {
  if (!c.weekly || scope === 'all') return null
  return { ...c, exceptions: { ...c.exceptions, [originalDate]: { skip: true } } }
}
