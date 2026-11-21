import type { StudyBlocksDB } from './db'

/** Warn when commitments are closer together than this many minutes. 0 turns warnings off. */
export const DEFAULT_MIN_GAP = 10
const MIN_GAP_KEY = 'minGapMinutes'

export function normalizeMinGap(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return DEFAULT_MIN_GAP
  return Math.min(Math.round(n), 240)
}

export async function getMinGap(db: StudyBlocksDB): Promise<number> {
  const row = await db.settings.get(MIN_GAP_KEY)
  return row === undefined ? DEFAULT_MIN_GAP : normalizeMinGap(row.value)
}

export async function setMinGap(db: StudyBlocksDB, minutes: number): Promise<void> {
  await db.settings.put({ key: MIN_GAP_KEY, value: normalizeMinGap(minutes) })
}
