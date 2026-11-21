import { localInstant } from './expand'
import type { Commitment } from './types'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function time(hhmm: string): string {
  return localInstant('2026-01-01', hhmm).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${time(startTime)} – ${time(endTime)}`
}

/** "Tue, Thu · 4:00 PM – 9:00 PM" or "Fri, Nov 20 · 9:00 AM – 10:00 AM" */
export function describeCommitment(c: Commitment): string {
  const when = c.weekly
    ? [...c.weekly.days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => DAY_NAMES[d]).join(', ')
    : localInstant(c.date, '12:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  return `${when} · ${formatTimeRange(c.startTime, c.endTime)}`
}
