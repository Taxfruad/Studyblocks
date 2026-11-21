import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState } from 'react'
import { AssignmentList } from '../assignments/AssignmentList'
import { addDays, localDateKey } from '../calendar/dates'
import { CalendarView, type CommitmentChange } from '../calendar/CalendarView'
import { CommitmentForm, type FormInitial } from '../commitments/CommitmentForm'
import { CONFLICT_WINDOW_DAYS, findConflicts } from '../commitments/conflicts'
import { ConflictsView } from '../commitments/ConflictsView'
import { deleteOccurrence, moveOccurrence, validateTimes, type Scope } from '../commitments/edit'
import { expandCommitments } from '../commitments/expand'
import { ScopePrompt } from '../commitments/ScopePrompt'
import { buildTestShift } from '../commitments/testShift'
import type { Commitment } from '../commitments/types'
import { db } from '../db/db'
import { getMinGap } from '../db/settings'
import { ImportDialog } from '../import/ImportDialog'
import { loadSample } from '../import/syncFeed'
import { MenuIcon } from './icons'
import { ItemDetail } from './ItemDetail'
import { Sidebar, type View } from './Sidebar'
import { useNow } from './useNow'
import { useTheme } from './useTheme'
import './theme.css'

type FormState = { commitmentId?: string; occurrenceId?: string; initial?: FormInitial }
type PendingScope = { title: string; apply: (scope: Scope) => void; cancel?: () => void }

const pad = (n: number) => String(n).padStart(2, '0')
const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

async function saveCommitment(c: Commitment | null, id: string) {
  if (c) await db.commitments.put(c)
  else await db.commitments.delete(id)
}

export default function App() {
  const [theme, toggleTheme] = useTheme()
  const now = useNow()
  const [view, setView] = useState<View>('calendar')
  const [importing, setImporting] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [form, setForm] = useState<FormState | null>(null)
  const [pending, setPending] = useState<PendingScope | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [focus, setFocus] = useState<{ date: string; nonce: number }>()

  const feeds = useLiveQuery(() => db.feeds.toArray(), [])
  const courses = useLiveQuery(() => db.courses.orderBy('name').toArray(), [])
  const items = useLiveQuery(() => db.items.toArray(), [])
  const commitments = useLiveQuery(() => db.commitments.toArray(), [])
  const minGap = useLiveQuery(() => getMinGap(db), [])

  useEffect(() => {
    if (!notice) return
    const id = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(id)
  }, [notice])

  const conflicts = useMemo(() => {
    if (!items || !commitments || minGap === undefined) return []
    const today = localDateKey(now)
    const occs = expandCommitments(commitments, today, addDays(today, CONFLICT_WINDOW_DAYS))
    return findConflicts(occs, items, { now, minGapMinutes: minGap })
  }, [items, commitments, minGap, now])

  if (!feeds || !courses || !items || !commitments || minGap === undefined) return <div className="loading" />

  const selectedItem = selected ? items.find((i) => i.id === selected) : undefined
  const editing = form?.commitmentId ? commitments.find((c) => c.id === form.commitmentId) : undefined
  const isEmpty = feeds.length === 0 && commitments.length === 0
  const redCount = conflicts.filter((c) => c.kind !== 'tight').length
  const amberCount = conflicts.length - redCount

  function go(v: View) {
    setView(v)
    setMenuOpen(false)
  }

  function changeCommitment(change: CommitmentChange) {
    const c = commitments!.find((x) => x.id === change.commitmentId)
    const occ = c && expandCommitments([c], addDays(localDateKey(change.start), -8), addDays(localDateKey(change.start), 8))
      .find((o) => o.id === change.occurrenceId)
    if (!c || !occ) return change.revert()
    const problem = validateTimes(change.start, change.end)
    if (problem) {
      change.revert()
      setNotice(problem)
      return
    }
    const apply = (scope: Scope) => void saveCommitment(moveOccurrence(c, occ, change.start, change.end, scope), c.id)
    if (!c.weekly) return apply('one')
    setPending({ title: `Move “${c.title}”?`, apply, cancel: change.revert })
  }

  function deleteFromForm(c: Commitment, occurrenceId?: string) {
    const originalDate = occurrenceId?.split('::')[1]
    if (!c.weekly || !originalDate) return void saveCommitment(null, c.id)
    setPending({
      title: `Delete “${c.title}”?`,
      apply: (scope) => void saveCommitment(deleteOccurrence(c, originalDate, scope), c.id),
    })
  }

  async function loadTestShift() {
    await db.commitments.bulkAdd(buildTestShift(new Date()))
    setNotice('Added a test work shift: Tue/Thu 4–9 pm and Sat 10 am–4 pm.')
    go('calendar')
  }

  return (
    <div className="shell">
      <Sidebar
        view={view}
        onView={go}
        feeds={feeds}
        courses={courses}
        commitments={commitments}
        now={now}
        conflictCount={redCount}
        warningCount={amberCount}
        onAddCommitment={() => { setForm({ initial: { date: localDateKey(new Date()) } }); setMenuOpen(false) }}
        onEditCommitment={(id) => { setForm({ commitmentId: id }); setMenuOpen(false) }}
        onLoadTestShift={() => void loadTestShift()}
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
          {redCount > 0 && <button className="badge red" onClick={() => go('conflicts')}>{redCount}</button>}
        </div>

        {isEmpty && view !== 'conflicts' ? (
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
          <CalendarView
            items={items}
            courses={courses}
            commitments={commitments}
            now={now}
            minGap={minGap}
            focus={focus}
            onSelectItem={setSelected}
            onSelectCommitment={(commitmentId, occurrenceId) => setForm({ commitmentId, occurrenceId })}
            onCreateRange={(start, end) => {
              const problem = validateTimes(start, end)
              if (problem) return setNotice(problem)
              setForm({ initial: { date: localDateKey(start), startTime: hhmm(start), endTime: hhmm(end) === '00:00' ? '24:00' : hhmm(end) } })
            }}
            onChangeCommitment={changeCommitment}
          />
        ) : view === 'assignments' ? (
          <AssignmentList items={items} courses={courses} onSelect={setSelected} />
        ) : (
          <ConflictsView
            conflicts={conflicts}
            minGap={minGap}
            onJump={(date) => { setFocus({ date, nonce: Date.now() }); go('calendar') }}
          />
        )}
      </main>

      {notice && <div className="toast" role="status">{notice}</div>}
      {importing && <ImportDialog onClose={() => setImporting(false)} />}
      {selectedItem && (
        <ItemDetail
          item={selectedItem}
          course={courses.find((c) => c.id === selectedItem.courseId)}
          onClose={() => setSelected(null)}
        />
      )}
      {form && (
        <CommitmentForm
          key={form.commitmentId ?? 'new'}
          commitment={editing}
          initial={form.initial}
          courses={courses}
          onSave={(c) => void db.commitments.put(c)}
          onDelete={editing ? () => deleteFromForm(editing, form.occurrenceId) : undefined}
          onClose={() => setForm(null)}
        />
      )}
      {pending && (
        <ScopePrompt
          title={pending.title}
          onChoose={(scope) => {
            if (scope) pending.apply(scope)
            else pending.cancel?.()
            setPending(null)
          }}
        />
      )}
    </div>
  )
}
