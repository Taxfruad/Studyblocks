import Dexie, { type EntityTable } from 'dexie'
import type { Commitment } from '../commitments/types'
import type { ParsedItem } from '../import/types'

/** A calendar source: a Canvas feed URL or an uploaded .ics file. Lives only in this browser. */
export type Feed = {
  id: string
  label: string
  /** Missing for uploaded files. */
  url?: string
  lastSyncedAt?: string
  lastError?: string
}

export type Course = {
  id: string
  name: string
  color: string
}

export type CalendarItem = Omit<ParsedItem, 'courseName'> & {
  /** `${feedId}|${uid}` */
  id: string
  feedId: string
  courseId?: string
  /** Set by the student. Never overwritten by a re-import. */
  done: boolean
  /** The student changed this item; re-imports leave its content alone. */
  userEdited: boolean
  /** The item disappeared from its feed but was kept because the student touched it. */
  removedFromSource: boolean
}

/** Small key/value store for per-student settings. */
export type Setting = { key: string; value: unknown }

export class StudyBlocksDB extends Dexie {
  declare feeds: EntityTable<Feed, 'id'>
  declare courses: EntityTable<Course, 'id'>
  declare items: EntityTable<CalendarItem, 'id'>
  declare commitments: EntityTable<Commitment, 'id'>
  declare settings: EntityTable<Setting, 'key'>

  constructor(name = 'studyblocks') {
    super(name)
    this.version(1).stores({
      feeds: 'id',
      courses: 'id, &name',
      items: 'id, feedId, courseId, kind, start',
    })
    // Milestone 2: commitments (classes, shifts, …) and settings.
    this.version(2).stores({
      commitments: 'id',
      settings: 'key',
    })
  }
}

export const db = new StudyBlocksDB()

export function itemId(feedId: string, uid: string): string {
  return `${feedId}|${uid}`
}
