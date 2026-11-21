import { addDays, localDateKey } from '../calendar/dates'
import { expandCommitments } from './expand'
import type { Commitment, Occurrence } from './types'

export type NextUp = { commitment: Commitment; next?: Occurrence }

/** How far ahead to look for a weekly commitment's next occurrence. */
const LOOKAHEAD_DAYS = 400

/** The next occurrence that hasn't ended yet (one happening right now counts). */
export function nextOccurrence(c: Commitment, now: Date): Occurrence | undefined {
  const today = localDateKey(now)
  const nowIso = now.toISOString()
  return expandCommitments([c], today, addDays(today, LOOKAHEAD_DAYS)).find((o) => o.end > nowIso)
}

/** Commitments in the order they next happen. Finished ones go last, in their original order. */
export function sortByNextUp(cs: Commitment[], now: Date): NextUp[] {
  return cs
    .map((commitment) => ({ commitment, next: nextOccurrence(commitment, now) }))
    .sort((a, b) => {
      if (a.next && b.next) return a.next.start.localeCompare(b.next.start)
      if (a.next) return -1
      if (b.next) return 1
      return 0
    })
}
