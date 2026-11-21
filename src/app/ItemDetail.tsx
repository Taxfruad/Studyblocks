import { useEffect, useRef } from 'react'
import type { CalendarItem, Course } from '../db/db'
import { db } from '../db/db'
import { formatDue } from '../calendar/dates'
import { ExternalIcon, XIcon } from './icons'

type Props = { item: CalendarItem; course?: Course; onClose: () => void }

function formatRange(item: CalendarItem): string {
  if (item.kind === 'assignment' || !item.end || item.allDay) return formatDue(item)
  const end = new Date(item.end).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return `${formatDue(item)} – ${end}`
}

export function ItemDetail({ item, course, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    ref.current?.showModal()
  }, [])

  return (
    <dialog ref={ref} className="modal detail" onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}>
      <div className="modal-body">
        <header className="modal-header">
          <span className="kind">{item.kind === 'assignment' ? 'Assignment' : 'Event'}</span>
          <button className="icon-btn" onClick={() => ref.current?.close()} aria-label="Close"><XIcon /></button>
        </header>
        <h2>{item.title}</h2>
        <dl>
          {course && (<><dt>Course</dt><dd><span className="dot" style={{ background: course.color }} />{course.name}</dd></>)}
          <dt>{item.kind === 'assignment' ? 'Due' : 'When'}</dt>
          <dd>{formatRange(item)}</dd>
        </dl>
        {item.removedFromSource && <p className="flag">This was removed from Canvas. Kept because you marked it done.</p>}
        {item.description && <p className="description">{item.description}</p>}
        <footer className="modal-footer">
          {item.kind === 'assignment' && (
            <label className="check">
              <input type="checkbox" checked={item.done}
                onChange={(e) => db.items.update(item.id, { done: e.target.checked })} />
              Done
            </label>
          )}
          {item.url && (
            <a className="ghost-btn" href={item.url} target="_blank" rel="noreferrer">
              Open in Canvas <ExternalIcon />
            </a>
          )}
        </footer>
      </div>
    </dialog>
  )
}
