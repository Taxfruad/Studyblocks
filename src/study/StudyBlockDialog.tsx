import { useEffect, useRef } from 'react'
import { XIcon } from '../app/icons'
import { formatDue } from '../calendar/dates'
import type { CalendarItem, Course } from '../db/db'
import { db } from '../db/db'
import type { StudyBlock } from './types'

type Props = {
  block: StudyBlock
  item: CalendarItem
  course?: Course
  onOpenAssignment: () => void
  onClose: () => void
}

const time = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

export function StudyBlockDialog({ block, item, course, onOpenAssignment, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    ref.current?.showModal()
  }, [])
  const close = () => ref.current?.close()
  const day = new Date(block.start).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <dialog ref={ref} className="modal detail" onClose={onClose} onClick={(e) => e.target === ref.current && close()}>
      <div className="modal-body">
        <header className="modal-header">
          <span className="kind">Study block{block.pinned ? ' · pinned' : ''}</span>
          <button className="icon-btn" onClick={close} aria-label="Close"><XIcon /></button>
        </header>
        <h2 className={item.done ? 'crossed' : ''}>{item.title}</h2>
        <dl>
          {course && (<><dt>Course</dt><dd><span className="dot" style={{ background: course.color }} />{course.name}</dd></>)}
          <dt>When</dt>
          <dd>{day} · {time(block.start)} – {time(block.end)}</dd>
          <dt>Due</dt>
          <dd>{formatDue(item)}</dd>
        </dl>
        {item.done && <p className="muted">This assignment is done, so this block is crossed out.</p>}
        {block.pinned && !item.done && (
          <p className="muted">You moved this block, so “Plan my study time” won’t move it.</p>
        )}
        <footer className="modal-footer">
          <button className="ghost-btn danger" onClick={() => { void db.studyBlocks.delete(block.id); close() }}>Delete</button>
          <span className="footer-actions">
            {block.pinned && (
              <button className="ghost-btn" onClick={() => { void db.studyBlocks.update(block.id, { pinned: false }); close() }}>Unpin</button>
            )}
            <button className="ghost-btn" onClick={() => { close(); onOpenAssignment() }}>Open assignment</button>
          </span>
        </footer>
      </div>
    </dialog>
  )
}
