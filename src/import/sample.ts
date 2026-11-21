import { addDays, localDateKey } from '../calendar/dates'

/**
 * A made-up Canvas-style feed, dated relative to `today`, so anyone can try the
 * app without a Canvas account. Same shape as a real Canvas feed.
 */
export function buildSampleIcs(today: Date): string {
  const todayKey = localDateKey(today)
  const date = (offset: number) => addDays(todayKey, offset).replaceAll('-', '')
  /** Local wall-clock time on a day offset, written as UTC like Canvas does. */
  const at = (offset: number, hour: number, minute = 0) => {
    const [y, m, d] = addDays(todayKey, offset).split('-').map(Number)
    return new Date(y, m - 1, d, hour, minute).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  }

  const CS = 'CS 210 Intro to Programming'
  const MATH = 'MATH 120 Calculus I'
  const ENG = 'ENGL 101 Composition'

  type E = { uid: string; summary: string; start: string; end?: string; allDay?: boolean; description?: string }
  const events: E[] = [
    { uid: 'event-assignment-s1', summary: `Lab 9: Recursion [${CS}]`, start: at(1, 23, 59) },
    { uid: 'event-assignment-s2', summary: `Problem Set 7 [${MATH}]`, start: at(2, 23, 59) },
    { uid: 'event-assignment-s3', summary: `Essay draft: Argument [${ENG}]`, start: date(4), allDay: true },
    { uid: 'event-assignment-s4', summary: `Quiz 5 [${MATH}]`, start: at(5, 10, 0) },
    { uid: 'event-assignment-s5', summary: `Project 10: Final project [${CS}]`, start: at(9, 23, 59),
      description: 'Build and document a small program of your choice.' },
    { uid: 'event-assignment-s6', summary: `Peer review [${ENG}]`, start: date(11), allDay: true },
    { uid: 'event-assignment-s7', summary: `Problem Set 8 [${MATH}]`, start: at(13, 23, 59) },
    { uid: 'event-assignment-s8', summary: `Lab 8: Files [${CS}]`, start: at(-2, 23, 59) },
    { uid: 'event-calendar-event-s9', summary: `Exam review session [${MATH}]`, start: at(3, 17, 0), end: at(3, 18, 30) },
    { uid: 'event-calendar-event-s10', summary: `Writing center appointment [${ENG}]`, start: at(6, 14, 0), end: at(6, 14, 45) },
  ]

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//StudyBlocks//Sample//EN',
    'X-WR-CALNAME:Sample Canvas Calendar',
  ]
  for (const e of events) {
    lines.push('BEGIN:VEVENT', `UID:${e.uid}`, `DTSTAMP:${at(0, 0)}`)
    if (e.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${e.start}`, `DTEND;VALUE=DATE:${e.start}`)
    } else {
      lines.push(`DTSTART:${e.start}`, `DTEND:${e.end ?? e.start}`)
    }
    lines.push(`SUMMARY:${e.summary}`)
    if (e.description) lines.push(`DESCRIPTION:${e.description}`)
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n') + '\r\n'
}
