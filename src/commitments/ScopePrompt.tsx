import { useEffect, useRef } from 'react'
import type { Scope } from './edit'

type Props = {
  /** e.g. "Move this commitment?" */
  title: string
  onChoose: (scope: Scope | null) => void
}

/** Asks whether a change to a weekly commitment applies to this week or every week. */
export function ScopePrompt({ title, onChoose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const chosen = useRef<Scope | null>(null)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  const choose = (scope: Scope | null) => {
    chosen.current = scope
    ref.current?.close()
  }

  return (
    <dialog ref={ref} className="modal scope" onClose={() => onChoose(chosen.current)}
      onClick={(e) => e.target === ref.current && choose(null)}>
      <div className="modal-body">
        <h2>{title}</h2>
        <p className="muted">This repeats every week.</p>
        <div className="scope-actions">
          <button className="ghost-btn" onClick={() => choose(null)}>Cancel</button>
          <button className="ghost-btn" onClick={() => choose('one')}>This week only</button>
          <button className="primary-btn" onClick={() => choose('all')} autoFocus>Every week</button>
        </div>
      </div>
    </dialog>
  )
}
