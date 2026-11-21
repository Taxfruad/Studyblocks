import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { splitCanvasTitle } from './canvas'
import { IcsParseError, parseIcs } from './parseIcs'

const fixture = (name: string) =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')

const NOW = new Date('2026-11-20T12:00:00Z')

describe('splitCanvasTitle', () => {
  it('pulls the course out of the trailing bracket', () => {
    expect(splitCanvasTitle('Lab 7 [CS 210 Fall 2026]')).toEqual({
      title: 'Lab 7',
      courseName: 'CS 210 Fall 2026',
    })
  })

  it('uses only the last bracket as the course', () => {
    expect(splitCanvasTitle('Quiz [1], review [CS 210]')).toEqual({
      title: 'Quiz [1], review',
      courseName: 'CS 210',
    })
  })

  it('leaves titles without a course alone', () => {
    expect(splitCanvasTitle('Office hours')).toEqual({ title: 'Office hours' })
  })
})

describe('parseIcs (Canvas feed)', () => {
  const items = parseIcs(fixture('canvas-sample.ics'), NOW)
  const byUid = (uid: string) => items.find((i) => i.uid === uid)!

  it('parses every event', () => {
    expect(items).toHaveLength(4)
  })

  it('marks event-assignment-* as assignments and the rest as events', () => {
    expect(byUid('event-assignment-1001').kind).toBe('assignment')
    expect(byUid('event-assignment-1002').kind).toBe('assignment')
    expect(byUid('event-calendar-event-2001').kind).toBe('event')
  })

  it('keeps all-day due dates as plain dates (no time zone shift)', () => {
    const a = byUid('event-assignment-1001')
    expect(a.allDay).toBe(true)
    expect(a.start).toBe('2026-12-05')
    expect(a.end).toBeUndefined()
    expect(a.title).toBe('Project 10')
    expect(a.courseName).toBe('CS 210 Fall 2026')
    expect(a.url).toBe('https://canvas.example.edu/courses/1/assignments/1001')
    expect(a.description).toBe('Write the final project report.')
  })

  it('unescapes commas and keeps earlier brackets in the title', () => {
    const q = byUid('event-assignment-1002')
    expect(q.title).toBe('Quiz [1], review')
    expect(q.courseName).toBe('MATH 120 Fall 2026')
    expect(q.start).toBe('2026-12-04T06:59:00.000Z')
    expect(q.end).toBeUndefined() // zero-length deadline
  })

  it('keeps timed events in UTC with their end time', () => {
    const e = byUid('event-calendar-event-2001')
    expect(e.allDay).toBe(false)
    expect(e.start).toBe('2026-12-03T17:00:00.000Z')
    expect(e.end).toBe('2026-12-03T18:00:00.000Z')
    expect(e.description).toContain('more than one line')
  })

  it('handles events with no course', () => {
    expect(byUid('event-calendar-event-2002').courseName).toBeUndefined()
  })
})

describe('parseIcs (recurring events)', () => {
  const items = parseIcs(fixture('recurring.ics'), NOW)

  it('expands a weekly rule into separate occurrences with unique uids', () => {
    const lectures = items.filter((i) => i.title === 'Lecture')
    expect(lectures.map((l) => l.start)).toEqual([
      '2026-11-02T16:00:00.000Z',
      '2026-11-09T16:00:00.000Z',
      '2026-11-16T16:00:00.000Z',
      '2026-11-23T16:00:00.000Z',
    ])
    expect(new Set(lectures.map((l) => l.uid)).size).toBe(4)
    expect(lectures[0].uid).toBe('weekly-lecture@example::2026-11-02T16:00:00.000Z')
  })

  it('bounds endless rules to a window around today and a max count', () => {
    const daily = items.filter((i) => i.title === 'Daily standup')
    expect(daily.length).toBe(500)
    expect(daily[0].start >= '2025-11-20').toBe(true)
  })
})

describe('parseIcs (bad input)', () => {
  it('throws IcsParseError on garbage', () => {
    expect(() => parseIcs('this is not a calendar')).toThrow(IcsParseError)
  })

  it('throws IcsParseError on an HTML page', () => {
    expect(() => parseIcs('<!doctype html><html></html>')).toThrow(IcsParseError)
  })

  it('returns an empty list for an empty calendar', () => {
    expect(parseIcs('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n')).toEqual([])
  })
})
