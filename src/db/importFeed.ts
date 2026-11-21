import type { ParsedItem } from '../import/types'
import { itemId, type CalendarItem, type Course, type StudyBlocksDB } from './db'
import { nextCourseColor } from './colors'

export type ImportResult = {
  added: number
  updated: number
  /** Deleted because they vanished from the feed. */
  removed: number
  /** Vanished from the feed but kept because the student marked them done or edited them. */
  kept: number
}

/**
 * Merges a freshly parsed feed into the database. Feed-owned fields are refreshed;
 * student-owned fields (done, edits, course colors) are never overwritten.
 */
export async function importFeed(
  db: StudyBlocksDB,
  feedId: string,
  parsed: ParsedItem[],
): Promise<ImportResult> {
  // Last occurrence of a uid wins.
  const incoming = new Map<string, ParsedItem>()
  for (const p of parsed) incoming.set(itemId(feedId, p.uid), p)

  return db.transaction('rw', db.items, db.courses, async () => {
    const courseIds = await ensureCourses(db, [...incoming.values()])
    const existing = new Map(
      (await db.items.where('feedId').equals(feedId).toArray()).map((i) => [i.id, i]),
    )
    const result: ImportResult = { added: 0, updated: 0, removed: 0, kept: 0 }
    const toPut: CalendarItem[] = []

    for (const [id, p] of incoming) {
      const { courseName, ...fields } = p
      const fromFeed = {
        ...fields,
        id,
        feedId,
        courseId: courseName ? courseIds.get(courseName) : undefined,
      }
      const old = existing.get(id)
      if (!old) {
        toPut.push({ ...fromFeed, done: false, userEdited: false, removedFromSource: false })
        result.added++
      } else {
        const base = old.userEdited ? old : { ...fromFeed, courseId: fromFeed.courseId ?? old.courseId }
        toPut.push({
          ...base,
          done: old.done,
          userEdited: old.userEdited,
          removedFromSource: false,
        })
        result.updated++
      }
    }

    const toDelete: string[] = []
    for (const old of existing.values()) {
      if (incoming.has(old.id)) continue
      if (old.done || old.userEdited) {
        toPut.push({ ...old, removedFromSource: true })
        result.kept++
      } else {
        toDelete.push(old.id)
        result.removed++
      }
    }

    await db.items.bulkPut(toPut)
    await db.items.bulkDelete(toDelete)
    return result
  })
}

/** Returns course name → id, creating any courses that don't exist yet. */
async function ensureCourses(db: StudyBlocksDB, items: ParsedItem[]): Promise<Map<string, string>> {
  const all = await db.courses.toArray()
  const ids = new Map(all.map((c) => [c.name, c.id]))
  let count = all.length
  const created: Course[] = []
  for (const { courseName } of items) {
    if (!courseName || ids.has(courseName)) continue
    const course = { id: crypto.randomUUID(), name: courseName, color: nextCourseColor(count++) }
    created.push(course)
    ids.set(courseName, course.id)
  }
  if (created.length) await db.courses.bulkAdd(created)
  return ids
}
