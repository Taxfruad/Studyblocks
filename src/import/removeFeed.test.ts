import { afterEach, describe, expect, it } from 'vitest'
import { StudyBlocksDB } from '../db/db'
import { importFeed } from '../db/importFeed'
import { removeFeed } from './syncFeed'

const database = new StudyBlocksDB('remove-feed-test')
afterEach(() => database.delete())

describe('removeFeed', () => {
  it('removes the feed’s items, their study blocks, and unused courses', async () => {
    await importFeed(database, 'a', [{ uid: '1', kind: 'assignment', title: 'Lab', courseName: 'CS', start: '2026-12-05', allDay: true }])
    await importFeed(database, 'b', [{ uid: '2', kind: 'assignment', title: 'Essay', courseName: 'ENG', start: '2026-12-06', allDay: true }])
    await database.studyBlocks.bulkAdd([
      { id: 'x', itemId: 'a|1', start: '2026-12-01T17:00:00.000Z', end: '2026-12-01T18:00:00.000Z', pinned: false },
      { id: 'y', itemId: 'b|2', start: '2026-12-01T19:00:00.000Z', end: '2026-12-01T20:00:00.000Z', pinned: false },
    ])
    await removeFeed('a', database)
    expect((await database.items.toArray()).map((i) => i.id)).toEqual(['b|2'])
    expect((await database.studyBlocks.toArray()).map((b) => b.id)).toEqual(['y'])
    expect((await database.courses.toArray()).map((c) => c.name)).toEqual(['ENG'])
  })
})
