/**
 * Canvas writes the course at the end of each title in square brackets,
 * e.g. "Lab 7 [CS 210 Fall 2026]". Only the last bracket is the course.
 */
export function splitCanvasTitle(summary: string): { title: string; courseName?: string } {
  const match = /^(.*\S)\s*\[([^[\]]+)\]\s*$/.exec(summary.trim())
  if (!match) return { title: summary.trim() }
  return { title: match[1].trim(), courseName: match[2].trim() }
}

/** Canvas assignment UIDs look like "event-assignment-1234". */
export function isCanvasAssignmentUid(uid: string): boolean {
  return uid.startsWith('event-assignment-')
}
