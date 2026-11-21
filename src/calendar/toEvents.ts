import type { EventInput } from '@fullcalendar/core'
import type { CalendarItem, Course } from '../db/db'
import { itemDateKey } from './dates'

export const DEFAULT_EVENT_COLOR = '#8a8f98'

export type EventProps = { itemId: string; kind: CalendarItem['kind']; dueTime?: string }

/**
 * Assignments are deadlines, not blocks of time, so they always sit in the all-day row
 * on the day they're due (in the viewer's time zone). Timed events keep their times.
 */
export function toCalendarEvents(items: CalendarItem[], courses: Course[]): EventInput[] {
  const colors = new Map(courses.map((c) => [c.id, c.color]))
  return items.map((item) => {
    const color = (item.courseId && colors.get(item.courseId)) || DEFAULT_EVENT_COLOR
    const classNames = [item.kind === 'assignment' ? 'sb-assignment' : 'sb-event']
    if (item.done) classNames.push('is-done')
    if (item.removedFromSource) classNames.push('is-removed')
    const extendedProps: EventProps = { itemId: item.id, kind: item.kind }

    if (item.kind === 'assignment') {
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
        color,
        classNames,
        extendedProps,
      }
    }
    return {
      id: item.id,
      title: item.title,
      start: item.start,
      ...(item.end ? { end: item.end } : {}),
      allDay: item.allDay,
      color,
      classNames,
      extendedProps,
    }
  })
}
