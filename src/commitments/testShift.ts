import { addDays, localDateKey } from '../calendar/dates'
import type { Commitment } from './types'

/** A made-up work schedule for testing conflicts: Tue/Thu 4–9 pm and Sat 10 am–4 pm. */
export function buildTestShift(today: Date): Commitment[] {
  const monday = addDays(localDateKey(today), -((today.getDay() + 6) % 7))
  const base = { title: 'Work (test shift)', type: 'work' as const, date: monday }
  return [
    { ...base, id: crypto.randomUUID(), startTime: '16:00', endTime: '21:00', weekly: { days: [2, 4] } },
    { ...base, id: crypto.randomUUID(), startTime: '10:00', endTime: '16:00', weekly: { days: [6] } },
  ]
}
