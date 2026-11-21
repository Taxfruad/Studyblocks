export type CommitmentType = 'class' | 'work' | 'other'

/** A change to one week of a weekly commitment, keyed by that week's original date. */
export type Exception =
  | { skip: true }
  | {
      /** Moved to another day. */
      date?: string
      startTime: string
      endTime: string
    }

/**
 * Something the student has to be at. Times are local wall-clock ("16:00"), so a
 * 4 pm shift stays at 4 pm across daylight-saving changes.
 */
export type Commitment = {
  id: string
  title: string
  type: CommitmentType
  courseId?: string
  /** One-time: the day. Weekly: the first day it can happen. `YYYY-MM-DD`. */
  date: string
  /** `HH:mm`, local */
  startTime: string
  /** `HH:mm`, local, after startTime (same day) */
  endTime: string
  /** Days are 0 = Sunday … 6 = Saturday. `until` is inclusive. */
  weekly?: { days: number[]; until?: string }
  exceptions?: Record<string, Exception>
}

/** One concrete time a commitment happens. */
export type Occurrence = {
  /** `${commitmentId}::${originalDate}` */
  id: string
  commitmentId: string
  /** The date the rule puts it on (the key for exceptions). */
  originalDate: string
  /** The date it actually happens (differs if this week was moved). */
  date: string
  title: string
  type: CommitmentType
  courseId?: string
  /** ISO instants */
  start: string
  end: string
  recurring: boolean
}
