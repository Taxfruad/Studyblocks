import type { Course } from '../db/db'
import type { CommitmentType } from './types'

export const TYPE_LABELS: Record<CommitmentType, string> = { class: 'Class', work: 'Work', other: 'Other' }

/** Muted solid colors for commitment blocks. A linked course's color wins. */
export const TYPE_COLORS: Record<CommitmentType, string> = {
  class: '#6c8ebf',
  work: '#b9824f',
  other: '#7f8794',
}

export function commitmentColor(c: { type: CommitmentType; courseId?: string }, courses: Course[]): string {
  const course = c.courseId ? courses.find((x) => x.id === c.courseId) : undefined
  return course?.color ?? TYPE_COLORS[c.type]
}
