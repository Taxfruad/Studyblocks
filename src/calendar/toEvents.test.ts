import { describe, expect, it } from 'vitest'
import type { CalendarItem, Course } from '../db/db'
import { localDateKey } from './dates'
import { TYPE_COLORS } from '../commitments/colors'
import { commitmentEvents, DEFAULT_EVENT_COLOR, studyBlockEvents, toCalendarEvents } from './toEvents'

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
    expect((ev.extendedProps as { dueTime?: string }).dueTime).toBeTruthy()
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

describe('conflict marks and commitments', () => {
  it('outlines marked items and keeps imported items locked', () => {
    const marks = { red: new Set(['q']), amber: new Set<string>() }
    const [ev] = toCalendarEvents(
      [{ ...base, id: 'q', uid: 'q', kind: 'assignment', title: 'Quiz', start: '2026-12-04T17:00:00.000Z', allDay: false }],
      courses,
      marks,
    )
    expect(ev.classNames).toContain('is-conflict')
    expect(ev.editable).toBe(false)
  })

  it('makes commitments editable blocks colored by type or course', () => {
    const occ = {
      id: 'w::2026-11-17', commitmentId: 'w', originalDate: '2026-11-17', date: '2026-11-17', title: 'Work',
      type: 'work' as const, start: '2026-11-17T23:00:00.000Z', end: '2026-11-18T04:00:00.000Z', recurring: true,
    }
    const [work] = commitmentEvents([occ], courses, { red: new Set(), amber: new Set([occ.id]) })
    expect(work).toMatchObject({ editable: true, allDay: false, start: occ.start, end: occ.end, color: TYPE_COLORS.work })
    expect(work.classNames).toEqual(['sb-commitment', 'type-work', 'is-tight'])
    const [cls] = commitmentEvents([{ ...occ, type: 'class', courseId: 'c1' }], courses)
    expect(cls.color).toBe('#8b7cf6')
  })
})

describe('studyBlockEvents', () => {
  const lab: CalendarItem = { ...base, id: 'lab', uid: 'lab', kind: 'assignment', title: 'Lab 9', start: '2026-12-05', allDay: true, courseId: 'c1' }
  const block = { id: 'b1', itemId: 'lab', start: '2026-12-01T17:00:00.000Z', end: '2026-12-01T18:00:00.000Z', pinned: false }

  it('shows a translucent block in the course color, titled after the assignment', () => {
    const [ev] = studyBlockEvents([block], [lab], courses)
    expect(ev).toMatchObject({ title: 'Lab 9', start: block.start, end: block.end, editable: true, borderColor: '#8b7cf6' })
    expect(ev.backgroundColor).toBe('rgba(139, 124, 246, 0.22)')
    expect(ev.classNames).toEqual(['sb-study'])
    expect(ev.extendedProps).toEqual({ kind: 'study', blockId: 'b1', itemId: 'lab' })
  })

  it('marks pinned blocks, and crosses out (and locks) blocks of finished work', () => {
    const [pinned] = studyBlockEvents([{ ...block, pinned: true }], [lab], courses)
    expect(pinned.classNames).toContain('is-pinned')
    const [crossed] = studyBlockEvents([block], [{ ...lab, done: true }], courses)
    expect(crossed.classNames).toContain('is-crossed')
    expect(crossed.editable).toBe(false)
    // Un-checking the assignment brings the block back to normal.
    const [again] = studyBlockEvents([block], [{ ...lab, done: false }], courses)
    expect(again.classNames).not.toContain('is-crossed')
  })

  it('skips blocks whose assignment is gone', () => {
    expect(studyBlockEvents([block], [], courses)).toEqual([])
  })
})
