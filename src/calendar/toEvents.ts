import type { EventInput } from '@fullcalendar/core'
import { commitmentColor } from '../commitments/colors'
import type { Occurrence } from '../commitments/types'
import type { CalendarItem, Course } from '../db/db'
import { itemDateKey } from './dates'

export const DEFAULT_EVENT_COLOR = '#8a8f98'

export type EventProps =
  | { kind: 'assignment' | 'event'; itemId: string; dueTime?: string }
  | { kind: 'commitment'; occurrenceId: string; commitmentId: string }

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
