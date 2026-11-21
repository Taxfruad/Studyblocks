import type { EventInput } from '@fullcalendar/core'
import { commitmentColor } from '../commitments/colors'
import type { Occurrence } from '../commitments/types'
import type { CalendarItem, Course } from '../db/db'
import type { StudyBlock } from '../study/types'
import { itemDateKey } from './dates'

export const DEFAULT_EVENT_COLOR = '#8a8f98'

export type EventProps =
  | { kind: 'assignment' | 'event'; itemId: string; dueTime?: string }
  | { kind: 'commitment'; occurrenceId: string; commitmentId: string }
  | { kind: 'study'; blockId: string; itemId: string }

export type Marks = { red: Set<string>; amber: Set<string> }
const NO_MARKS: Marks = { red: new Set(), amber: new Set() }

function markClass(id: string, marks: Marks): string[] {
  if (marks.red.has(id)) return ['is-conflict']
  if (marks.amber.has(id)) return ['is-tight']
  return []
}

/**
 * Assignments are deadlines, not blocks of time, so they always sit in the all-day row
 * on the day they're due (in the viewer's time zone). Timed events keep their times.
 * Imported items are never draggable.
 */
export function toCalendarEvents(items: CalendarItem[], courses: Course[], marks: Marks = NO_MARKS): EventInput[] {
  const colors = new Map(courses.map((c) => [c.id, c.color]))
  return items.map((item) => {
    const color = (item.courseId && colors.get(item.courseId)) || DEFAULT_EVENT_COLOR
    const classNames = [item.kind === 'assignment' ? 'sb-assignment' : 'sb-event']
    if (item.done) classNames.push('is-done')
    if (item.removedFromSource) classNames.push('is-removed')
    classNames.push(...markClass(item.id, marks))

    if (item.kind === 'assignment') {
      const extendedProps: EventProps = { kind: 'assignment', itemId: item.id }
      if (!item.allDay) {
        extendedProps.dueTime = new Date(item.start).toLocaleTimeString(undefined, {
          hour: 'numeric',
          minute: '2-digit',
        })
      }
      return {
        id: item.id,
        title: item.title,
        start: itemDateKey(item),
        allDay: true,
        editable: false,
        color,
        classNames,
        extendedProps,
      }
    }
    const extendedProps: EventProps = { kind: 'event', itemId: item.id }
    return {
      id: item.id,
      title: item.title,
      start: item.start,
      ...(item.end ? { end: item.end } : {}),
      allDay: item.allDay,
      editable: false,
      color,
      classNames,
      extendedProps,
    }
  })
}

/** Commitments are solid blocks the student can drag and resize. */
export function commitmentEvents(occs: Occurrence[], courses: Course[], marks: Marks = NO_MARKS): EventInput[] {
  return occs.map((o) => {
    const extendedProps: EventProps = { kind: 'commitment', occurrenceId: o.id, commitmentId: o.commitmentId }
    return {
      id: o.id,
      title: o.title,
      start: o.start,
      end: o.end,
      allDay: false,
      editable: true,
      color: commitmentColor(o, courses),
      classNames: ['sb-commitment', `type-${o.type}`, ...markClass(o.id, marks)],
      extendedProps,
    }
  })
}

function translucent(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  if (!m) return hex
  const [r, g, b] = m.slice(1).map((x) => parseInt(x, 16))
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Study blocks look secondary: a light tint of the course color with a solid edge.
 * Blocks of finished assignments stay, crossed out and locked.
 */
export function studyBlockEvents(blocks: StudyBlock[], items: CalendarItem[], courses: Course[]): EventInput[] {
  const byId = new Map(items.map((i) => [i.id, i]))
  const colors = new Map(courses.map((c) => [c.id, c.color]))
  const out: EventInput[] = []
  for (const b of blocks) {
    const item = byId.get(b.itemId)
    if (!item) continue
    const color = (item.courseId && colors.get(item.courseId)) || DEFAULT_EVENT_COLOR
    const classNames = ['sb-study']
    if (b.pinned) classNames.push('is-pinned')
    if (item.done) classNames.push('is-crossed')
    const extendedProps: EventProps = { kind: 'study', blockId: b.id, itemId: item.id }
    out.push({
      id: `study:${b.id}`,
      title: item.title,
      start: b.start,
      end: b.end,
      allDay: false,
      editable: !item.done,
      backgroundColor: translucent(color, 0.22),
      borderColor: color,
      textColor: 'var(--text)',
      classNames,
      extendedProps,
    })
  }
  return out
}
