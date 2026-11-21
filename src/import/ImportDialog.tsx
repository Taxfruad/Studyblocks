import { useEffect, useRef, useState } from 'react'
import type { ImportResult } from '../db/importFeed'
import { XIcon } from '../app/icons'
import { importFile, syncFeedFromUrl } from './syncFeed'

type Props = { onClose: () => void }

function summary(r: ImportResult): string {
  const parts = [`${r.added} added`, `${r.updated} updated`]
  if (r.removed) parts.push(`${r.removed} removed`)
  if (r.kept) parts.push(`${r.kept} kept (you'd marked them done)`)
  return parts.join(', ')
}

export function ImportDialog({ onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [tab, setTab] = useState<'link' | 'file'>('link')
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  async function run(task: () => Promise<ImportResult>) {
    setBusy(true)
    setError(null)
    setDone(null)
    try {
      setDone(summary(await task()))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog ref={ref} className="modal import" onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}>
      <div className="modal-body">
        <header className="modal-header">
          <h2>Import a calendar</h2>
          <button className="icon-btn" onClick={() => ref.current?.close()} aria-label="Close"><XIcon /></button>
        </header>

        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'link'} className={tab === 'link' ? 'active' : ''}
            onClick={() => setTab('link')}>Canvas link</button>
          <button role="tab" aria-selected={tab === 'file'} className={tab === 'file' ? 'active' : ''}
            onClick={() => setTab('file')}>Upload .ics file</button>
        </div>

        {tab === 'link' ? (
          <form onSubmit={(e) => { e.preventDefault(); if (url.trim()) run(() => syncFeedFromUrl(url)) }}>
            <label className="field">
              <span>Calendar feed link</span>
              <input type="url" required placeholder="https://yourschool.instructure.com/feeds/calendars/user_….ics"
                value={url} onChange={(e) => setUrl(e.target.value)} autoFocus spellCheck={false} />
            </label>
            <p className="hint">
              In Canvas, open <strong>Calendar</strong> and click <strong>Calendar Feed</strong> (bottom right). Copy
              the link. Treat it like a password: it's only saved in this browser.
            </p>
            <button className="primary-btn" disabled={busy || !url.trim()}>{busy ? 'Importing…' : 'Import'}</button>
          </form>
        ) : (
          <div>
            <label className="field file-drop">
              <span>Choose a .ics file</span>
              <input type="file" accept=".ics,text/calendar" disabled={busy}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) run(() => importFile(f)) }} />
            </label>
            <p className="hint">Works with any calendar export: Canvas, Google Calendar, Outlook, and more.</p>
          </div>
        )}

        {error && <p className="alert error" role="alert">{error}</p>}
        {done && <p className="alert ok" role="status">Imported: {done}.</p>}
      </div>
    </dialog>
  )
}
