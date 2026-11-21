import { useState } from 'react'
import type { CalendarItem, Course } from '../db/db'
import { db } from '../db/db'
import { formatDue } from '../calendar/dates'
import { DEFAULT_EVENT_COLOR } from '../calendar/toEvents'
import { groupAssignments } from './group'

type Props = { items: CalendarItem[]; courses: Course[]; onSelect: (id: string) => void }

export function AssignmentList({ items, courses, onSelect }: Props) {
  const byId = new Map(courses.map((c) => [c.id, c]))
  const [today] = useState(() => new Date())
  const groups = groupAssignments(items, today)

  if (groups.length === 0) {
    return <div className="list-empty muted">No assignments yet.</div>
  }

  return (
    <div className="assignments">
      <h1 className="page-title">Assignments</h1>
      {groups.map((g) => (
        <section key={g.label} className={`group group-${g.label.toLowerCase().replace(' ', '-')}`}>
          <h2>
            {g.label} <span className="count">{g.items.length}</span>
          </h2>
          <ul>
            {g.items.map((item) => {
              const course = item.courseId ? byId.get(item.courseId) : undefined
              return (
                <li key={item.id} className={`assignment${item.done ? ' is-done' : ''}`}>
                  <input type="checkbox" checked={item.done} aria-label={`Mark ${item.title} done`}
                    onChange={(e) => db.items.update(item.id, { done: e.target.checked })} />
                  <button className="assignment-main" onClick={() => onSelect(item.id)}>
                    <span className="assignment-title">{item.title}</span>
                    <span className="assignment-meta">
                      {course && (
                        <span className="course-tag">
                          <span className="dot" style={{ background: course.color ?? DEFAULT_EVENT_COLOR }} />
                          {course.name}
                        </span>
                      )}
                      <span>{formatDue(item)}</span>
                      {item.removedFromSource && <span className="flag">Removed from Canvas</span>}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
