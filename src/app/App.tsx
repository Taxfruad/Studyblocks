import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { AssignmentList } from '../assignments/AssignmentList'
import { CalendarView } from '../calendar/CalendarView'
import { db } from '../db/db'
import { ImportDialog } from '../import/ImportDialog'
import { loadSample } from '../import/syncFeed'
import { MenuIcon } from './icons'
import { ItemDetail } from './ItemDetail'
import { Sidebar, type View } from './Sidebar'
import { useTheme } from './useTheme'
import './theme.css'

export default function App() {
  const [theme, toggleTheme] = useTheme()
  const [view, setView] = useState<View>('calendar')
  const [importing, setImporting] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const feeds = useLiveQuery(() => db.feeds.toArray(), [])
  const courses = useLiveQuery(() => db.courses.orderBy('name').toArray(), [])
  const items = useLiveQuery(() => db.items.toArray(), [])

  if (!feeds || !courses || !items) return <div className="loading" />

  const selectedItem = selected ? items.find((i) => i.id === selected) : undefined
  const isEmpty = feeds.length === 0

  return (
    <div className="shell">
      <Sidebar
        view={view}
        onView={(v) => { setView(v); setMenuOpen(false) }}
        feeds={feeds}
        courses={courses}
        theme={theme}
        onToggleTheme={toggleTheme}
        onImport={() => { setImporting(true); setMenuOpen(false) }}
        open={menuOpen}
      />
      {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}

      <main className="main">
        <div className="mobile-bar">
          <button className="icon-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu"><MenuIcon /></button>
          <span>StudyBlocks</span>
        </div>

        {isEmpty ? (
          <div className="empty">
            <h1>Your semester, in one quiet place.</h1>
            <p className="muted">
              Bring in your Canvas calendar to see every assignment and class event on one calendar.
            </p>
            <div className="empty-actions">
              <button className="primary-btn" onClick={() => setImporting(true)}>Import Canvas calendar</button>
              <button className="ghost-btn" onClick={() => loadSample()}>Try sample data</button>
            </div>
          </div>
        ) : view === 'calendar' ? (
          <CalendarView items={items} courses={courses} onSelect={setSelected} />
        ) : (
          <AssignmentList items={items} courses={courses} onSelect={setSelected} />
        )}
      </main>

      {importing && <ImportDialog onClose={() => setImporting(false)} />}
      {selectedItem && (
        <ItemDetail
          item={selectedItem}
          course={courses.find((c) => c.id === selectedItem.courseId)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
