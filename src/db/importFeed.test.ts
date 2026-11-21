import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { ParsedItem } from '../import/types'
import { StudyBlocksDB } from './db'
import { importFeed } from './importFeed'

let db: StudyBlocksDB
let n = 0

beforeEach(async () => {
  db = new StudyBlocksDB(`test-${n++}`)
  await db.open()
})

afterEach(async () => {
  await db.delete()
})

const lab: ParsedItem = {
  uid: 'event-assignment-1',
  kind: 'assignment',
  title: 'Lab 7',
  courseName: 'CS 210',
  start: '2026-12-05',
  allDay: true,
}
const quiz: ParsedItem = {
  uid: 'event-assignment-2',
  kind: 'assignment',
  title: 'Quiz 3',
  courseName: 'MATH 120',
  start: '2026-12-04T06:59:00.000Z',
  allDay: false,
}
const review: ParsedItem = {
  uid: 'event-calendar-event-3',
  kind: 'event',
  title: 'Review session',
  courseName: 'CS 210',
  start: '2026-12-03T17:00:00.000Z',
  end: '2026-12-03T18:00:00.000Z',
  allDay: false,
}

describe('importFeed', () => {
  it('adds everything on first import and creates courses with distinct colors', async () => {
    const result = await importFeed(db, 'feed-a', [lab, quiz, review])
    expect(result).toEqual({ added: 3, updated: 0, removed: 0, kept: 0 })

    const items = await db.items.toArray()
    expect(items).toHaveLength(3)
    expect(items.every((i) => i.done === false && i.removedFromSource === false)).toBe(true)

    const courses = await db.courses.toArray()
    expect(courses.map((c) => c.name).sort()).toEqual(['CS 210', 'MATH 120'])
    expect(courses[0].color).not.toBe(courses[1].color)

    const cs = courses.find((c) => c.name === 'CS 210')!
    const labRow = await db.items.get('feed-a|event-assignment-1')
    expect(labRow?.courseId).toBe(cs.id)
  })

  it('does not duplicate on re-import', async () => {
    await importFeed(db, 'feed-a', [lab, quiz, review])
    const result = await importFeed(db, 'feed-a', [lab, quiz, review])
    expect(result).toEqual({ added: 0, updated: 3, removed: 0, kept: 0 })
    expect(await db.items.count()).toBe(3)
    expect(await db.courses.count()).toBe(2)
  })

  it('keeps "done" when Canvas changes the title', async () => {
    await importFeed(db, 'feed-a', [lab])
    await db.items.update('feed-a|event-assignment-1', { done: true })
    await importFeed(db, 'feed-a', [{ ...lab, title: 'Lab 7 (updated)' }])
    const row = await db.items.get('feed-a|event-assignment-1')
    expect(row?.title).toBe('Lab 7 (updated)')
    expect(row?.done).toBe(true)
  })

  it('does not overwrite items the student edited', async () => {
    await importFeed(db, 'feed-a', [lab])
    await db.items.update('feed-a|event-assignment-1', { title: 'My lab', userEdited: true })
    await importFeed(db, 'feed-a', [{ ...lab, title: 'Lab 7 (updated)' }])
    expect((await db.items.get('feed-a|event-assignment-1'))?.title).toBe('My lab')
  })

  it('deletes vanished items, but keeps done ones flagged as removed', async () => {
    await importFeed(db, 'feed-a', [lab, quiz, review])
    await db.items.update('feed-a|event-assignment-2', { done: true })

    const result = await importFeed(db, 'feed-a', [lab])
    expect(result).toEqual({ added: 0, updated: 1, removed: 1, kept: 1 })

    expect(await db.items.get('feed-a|event-calendar-event-3')).toBeUndefined()
    const kept = await db.items.get('feed-a|event-assignment-2')
    expect(kept?.removedFromSource).toBe(true)

    // If it comes back, the flag clears.
    await importFeed(db, 'feed-a', [lab, quiz])
    expect((await db.items.get('feed-a|event-assignment-2'))?.removedFromSource).toBe(false)
  })

  it('keeps a course color the student picked', async () => {
    await importFeed(db, 'feed-a', [lab])
    const cs = (await db.courses.where('name').equals('CS 210').first())!
    await db.courses.update(cs.id, { color: '#123456' })
    await importFeed(db, 'feed-a', [lab, review])
    expect((await db.courses.get(cs.id))?.color).toBe('#123456')
  })

  it('leaves other feeds alone', async () => {
    await importFeed(db, 'feed-a', [lab])
    await importFeed(db, 'feed-b', [quiz])
    await importFeed(db, 'feed-b', [])
    expect(await db.items.get('feed-a|event-assignment-1')).toBeDefined()
    expect(await db.items.where('feedId').equals('feed-b').count()).toBe(0)
    // Courses are shared across feeds.
    expect(await db.courses.count()).toBe(2)
  })

  it('collapses duplicate uids inside one import', async () => {
    const result = await importFeed(db, 'feed-a', [lab, { ...lab, title: 'Lab 7 v2' }])
    expect(result.added).toBe(1)
    expect((await db.items.get('feed-a|event-assignment-1'))?.title).toBe('Lab 7 v2')
  })
})

describe('study data on re-import (milestone 3)', () => {
  it('keeps the student’s time estimate', async () => {
    await importFeed(db, 'feed-a', [lab])
    await db.items.update('feed-a|event-assignment-1', { estimateMinutes: 45 })
    await importFeed(db, 'feed-a', [{ ...lab, title: 'Lab 7 (updated)' }])
    expect((await db.items.get('feed-a|event-assignment-1'))?.estimateMinutes).toBe(45)
  })

  it('deletes study blocks of items that were deleted', async () => {
    await importFeed(db, 'feed-a', [lab, quiz])
    await db.studyBlocks.bulkAdd([
      { id: 's1', itemId: 'feed-a|event-assignment-1', start: '2026-12-01T17:00:00.000Z', end: '2026-12-01T18:00:00.000Z', pinned: false },
      { id: 's2', itemId: 'feed-a|event-assignment-2', start: '2026-12-01T19:00:00.000Z', end: '2026-12-01T20:00:00.000Z', pinned: true },
    ])
    await importFeed(db, 'feed-a', [quiz])
    expect((await db.studyBlocks.toArray()).map((b) => b.id)).toEqual(['s2'])
  })
})
