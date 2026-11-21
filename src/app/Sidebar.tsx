import { useState } from 'react'
import type { Course, Feed } from '../db/db'
import { db } from '../db/db'
import { removeFeed, resyncFeed } from '../import/syncFeed'
import { CalendarIcon, ListIcon, LogoIcon, MoonIcon, PlusIcon, RefreshIcon, SunIcon, XIcon } from './icons'
import { relativeTime } from './relativeTime'
import type { Theme } from './useTheme'

export type View = 'calendar' | 'assignments'

type Props = {
  view: View
  onView: (v: View) => void
  feeds: Feed[]
  courses: Course[]
  theme: Theme
  onToggleTheme: () => void
  onImport: () => void
  open: boolean
}

export function Sidebar({ view, onView, feeds, courses, theme, onToggleTheme, onImport, open }: Props) {
  const [syncing, setSyncing] = useState<string | null>(null)

  async function resync(feed: Feed) {
    setSyncing(feed.id)
    try {
      await resyncFeed(feed)
    } catch {
      // The error is saved on the feed and shown below it.
    } finally {
      setSyncing(null)
    }
  }

  async function remove(feed: Feed) {
    if (confirm(`Remove “${feed.label}” and everything imported from it?`)) await removeFeed(feed.id)
  }

  return (
    <aside className={`sidebar${open ? ' is-open' : ''}`} aria-label="Sidebar">
      <div className="brand">
        <LogoIcon />
        <span>StudyBlocks</span>
      </div>

      <nav className="nav">
        <button className={view === 'calendar' ? 'active' : ''} onClick={() => onView('calendar')}>
          <CalendarIcon /> Calendar
        </button>
        <button className={view === 'assignments' ? 'active' : ''} onClick={() => onView('assignments')}>
          <ListIcon /> Assignments
        </button>
      </nav>

      <section className="side-section">
        <header>
          <h2>Calendars</h2>
          <button className="icon-btn" onClick={onImport} title="Import calendar" aria-label="Import calendar">
            <PlusIcon size={14} />
          </button>
        </header>
        {feeds.length === 0 && <p className="muted small">Nothing imported yet.</p>}
        <ul>
          {feeds.map((f) => (
            <li key={f.id} className="feed">
              <div className="feed-row">
                <span className="feed-label" title={f.label}>{f.label}</span>
                {(f.url || f.id === 'sample') && (
                  <button className={`icon-btn${syncing === f.id ? ' spinning' : ''}`} onClick={() => resync(f)}
                    title="Sync now" aria-label={`Sync ${f.label}`} disabled={syncing === f.id}>
                    <RefreshIcon />
                  </button>
                )}
                <button className="icon-btn" onClick={() => remove(f)} title="Remove" aria-label={`Remove ${f.label}`}>
                  <XIcon />
                </button>
              </div>
              {f.lastError ? (
                <p className="feed-error small">{f.lastError}</p>
              ) : (
                f.lastSyncedAt && <p className="muted small">Synced {relativeTime(f.lastSyncedAt)}</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      {courses.length > 0 && (
        <section className="side-section">
          <header><h2>Courses</h2></header>
          <ul>
            {courses.map((c) => (
              <li key={c.id} className="course">
                <label className="swatch" style={{ background: c.color }} title="Change color">
                  <input type="color" value={c.color} aria-label={`Color for ${c.name}`}
                    onChange={(e) => db.courses.update(c.id, { color: e.target.value })} />
                </label>
                <span title={c.name}>{c.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="side-footer">
        <button className="ghost-btn" onClick={onToggleTheme}>
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          {theme === 'dark' ? 'Light theme' : 'Dark theme'}
        </button>
      </footer>
    </aside>
  )
}
