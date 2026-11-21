import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import type { EventContentArg } from '@fullcalendar/core'
import { useMemo } from 'react'
import type { CalendarItem, Course } from '../db/db'
import { toCalendarEvents, type EventProps } from './toEvents'

type Props = {
  items: CalendarItem[]
  courses: Course[]
  onSelect: (itemId: string) => void
}

const isNarrow = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches

function renderEvent(arg: EventContentArg) {
  const props = arg.event.extendedProps as EventProps
  if (props.kind === 'assignment') {
    return (
      <div className="sb-deadline" title={props.dueTime ? `${arg.event.title} · due ${props.dueTime}` : arg.event.title}>
        <span className="dot" style={{ background: arg.event.backgroundColor }} />
        <span className="sb-title">{arg.event.title}</span>
        {props.dueTime && <span className="sb-time">{props.dueTime}</span>}
      </div>
    )
  }
  return true // FullCalendar renders timed events itself
}

export function CalendarView({ items, courses, onSelect }: Props) {
  const events = useMemo(() => toCalendarEvents(items, courses), [items, courses])
  const narrow = isNarrow()

  return (
    <div className="calendar-wrap">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView={narrow ? 'listWeek' : 'timeGridWeek'}
        headerToolbar={
          narrow
            ? { left: 'prev,next', center: 'title', right: 'dayGridMonth,listWeek' }
            : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listWeek' }
        }
        buttonText={{ today: 'Today', month: 'Month', week: 'Week', list: 'Agenda' }}
        allDayText="Due"
        height="100%"
        nowIndicator
        dayMaxEvents={4}
        scrollTime="08:00:00"
        firstDay={1}
        events={events}
        eventContent={renderEvent}
        eventClick={(info) => onSelect((info.event.extendedProps as EventProps).itemId)}
        noEventsText="Nothing scheduled."
      />
    </div>
  )
}
