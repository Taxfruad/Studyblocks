import { useEffect, useRef, useState } from 'react'
import { XIcon } from '../app/icons'
import type { Course } from '../db/db'
import { weekdayOf } from './expand'
import { TYPE_LABELS } from './colors'
import type { Commitment, CommitmentType } from './types'

export type FormInitial = Partial<Pick<Commitment, 'date' | 'startTime' | 'endTime'>>

type Props = {
  /** Editing an existing commitment, or undefined to create one. */
  commitment?: Commitment
  initial?: FormInitial
  courses: Course[]
  onSave: (c: Commitment) => void
  onDelete?: () => void
  onClose: () => void
}

const WEEK = [
  { day: 1, label: 'M' }, { day: 2, label: 'T' }, { day: 3, label: 'W' }, { day: 4, label: 'T' },
  { day: 5, label: 'F' }, { day: 6, label: 'S' }, { day: 0, label: 'S' },
]
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** Time inputs can't show "24:00", so midnight endings are shown as 23:59 and saved back as 24:00. */
const toInput = (t: string) => (t === '24:00' ? '23:59' : t)
const fromInput = (t: string, original?: string) => (t === '23:59' && original === '24:00' ? '24:00' : t)

export function CommitmentForm({ commitment, initial, courses, onSave, onDelete, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [title, setTitle] = useState(commitment?.title ?? '')
  const [type, setType] = useState<CommitmentType>(commitment?.type ?? 'class')
  const [courseId, setCourseId] = useState(commitment?.courseId ?? '')
  const [date, setDate] = useState(commitment?.date ?? initial?.date ?? '')
  const [startTime, setStartTime] = useState(toInput(commitment?.startTime ?? initial?.startTime ?? '09:00'))
  const [endTime, setEndTime] = useState(toInput(commitment?.endTime ?? initial?.endTime ?? '10:00'))
  const [repeats, setRepeats] = useState(Boolean(commitment?.weekly))
  const [days, setDays] = useState<number[]>(commitment?.weekly?.days ?? [])
  const [until, setUntil] = useState(commitment?.weekly?.until ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  function toggleRepeats(on: boolean) {
    setRepeats(on)
    if (on && days.length === 0 && date) setDays([weekdayOf(date)])
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const end = fromInput(endTime, commitment?.endTime)
    if (!title.trim()) return setError('Give it a name.')
    if (!date) return setError('Pick a date.')
    if (end <= startTime) return setError('The end time has to be after the start time.')
    if (repeats && days.length === 0) return setError('Pick at least one day of the week.')
    if (repeats && until && until < date) return setError('“Until” has to be after the start date.')

    const saved: Commitment = {
      id: commitment?.id ?? crypto.randomUUID(),
      title: title.trim(),
      type,
      date,
      startTime,
      endTime: end,
    }
    if (courseId) saved.courseId = courseId
    if (repeats) {
      saved.weekly = { days: [...days].sort((a, b) => a - b), ...(until ? { until } : {}) }
      if (commitment?.weekly && commitment.exceptions) saved.exceptions = commitment.exceptions
    }
    onSave(saved)
    ref.current?.close()
  }

  return (
    <dialog ref={ref} className="modal commitment-form" onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}>
      <form className="modal-body" onSubmit={submit}>
        <header className="modal-header">
          <h2>{commitment ? 'Edit commitment' : 'New commitment'}</h2>
          <button type="button" className="icon-btn" onClick={() => ref.current?.close()} aria-label="Close"><XIcon /></button>
        </header>

        <label className="field">
          <span>Name</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Work, CS 210 lecture, Soccer practice" autoFocus />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Type</span>
            <select value={type} onChange={(e) => setType(e.target.value as CommitmentType)}>
              {(Object.keys(TYPE_LABELS) as CommitmentType[]).map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Course (optional)</span>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              <option value="">None</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span>{repeats ? 'Starts on' : 'Date'}</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="field">
            <span>From</span>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </label>
          <label className="field">
            <span>To</span>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </label>
        </div>

        <label className="check">
          <input type="checkbox" checked={repeats} onChange={(e) => toggleRepeats(e.target.checked)} />
          Repeats every week
        </label>

        {repeats && (
          <div className="repeat">
            <div className="weekdays" role="group" aria-label="Days of the week">
              {WEEK.map(({ day, label }) => (
                <button type="button" key={day} aria-label={DAY_NAMES[day]} aria-pressed={days.includes(day)}
                  className={days.includes(day) ? 'active' : ''}
                  onClick={() => setDays((d) => (d.includes(day) ? d.filter((x) => x !== day) : [...d, day]))}>
                  {label}
                </button>
              ))}
            </div>
            <label className="field">
              <span>Until (optional)</span>
              <input type="date" value={until} min={date} onChange={(e) => setUntil(e.target.value)} />
            </label>
            {commitment?.weekly && <p className="hint">Changes here apply to every week.</p>}
          </div>
        )}

        {error && <p className="alert error" role="alert">{error}</p>}

        <footer className="modal-footer">
          {onDelete ? (
            <button type="button" className="ghost-btn danger" onClick={() => { onDelete(); ref.current?.close() }}>Delete</button>
          ) : <span />}
          <button className="primary-btn">{commitment ? 'Save' : 'Add'}</button>
        </footer>
      </form>
    </dialog>
  )
}
