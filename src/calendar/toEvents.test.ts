import { describe, expect, it } from 'vitest'
import type { CalendarItem, Course } from '../db/db'
import { localDateKey } from './dates'
import { DEFAULT_EVENT_COLOR, toCalendarEvents } from './toEvents'

const base = { feedId: 'f', done: false, userEdited: false, removedFromSource: false }
const courses: Course[] = [{ id: 'c1', name: 'CS 210', color: '#8b7cf6' }]

describe('toCalendarEvents', () => {
  it('keeps all-day assignments on their date and colors them by course', () => {
    const [ev] = toCalendarEvents(
      [{ ...base, id: 'a', uid: 'a', kind: 'assignment', title: 'Lab', start: '2026-12-05', allDay: true, courseId: 'c1' }],
      courses,
    )
    expect(ev).toMatchObject({ start: '2026-12-05', allDay: true, color: '#8b7cf6' })
    expect(ev.classNames).toEqual(['sb-assignment'])
  })

  it('puts timed deadlines in the all-day row on their local day', () => {
    const start = '2026-12-04T06:59:00.000Z'
    const [ev] = toCalendarEvents(
      [{ ...base, id: 'q', uid: 'q', kind: 'assignment', title: 'Quiz', start, allDay: false }],
      courses,
    )
    expect(ev.allDay).toBe(true)
    expect(ev.start).toBe(localDateKey(new Date(start)))
    expect(ev.color).toBe(DEFAULT_EVENT_COLOR)
    expect(ev.extendedProps?.dueTime).toBeTruthy()
  })

  it('keeps timed events as time blocks and marks done/removed items', () => {
    const item: CalendarItem = {
      ...base,
      id: 'e',
      uid: 'e',
      kind: 'event',
      title: 'Review',
      start: '2026-12-03T17:00:00.000Z',
      end: '2026-12-03T18:00:00.000Z',
      allDay: false,
      done: true,
      removedFromSource: true,
    }
    const [ev] = toCalendarEvents([item], courses)
    expect(ev).toMatchObject({ start: item.start, end: item.end, allDay: false })
    expect(ev.classNames).toEqual(['sb-event', 'is-done', 'is-removed'])
  })
})
