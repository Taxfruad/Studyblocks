/** A planned (or hand-placed) chunk of study time for one assignment. */
export type StudyBlock = {
  id: string
  /** The assignment (CalendarItem.id). */
  itemId: string
  /** ISO instants */
  start: string
  end: string
  /** The student moved it; the planner leaves it alone. */
  pinned: boolean
}

export type StudyWindow = { start: string; end: string } // local "HH:mm"

export type StudySettings = {
  weekday: StudyWindow
  weekend: StudyWindow
  dailyLimitMinutes: number
  bufferMinutes: number
  chunkMinMinutes: number
  chunkMaxMinutes: number
}

export const DEFAULT_STUDY_SETTINGS: StudySettings = {
  weekday: { start: '09:00', end: '22:00' },
  weekend: { start: '10:00', end: '22:00' },
  dailyLimitMinutes: 240,
  bufferMinutes: 15,
  chunkMinMinutes: 30,
  chunkMaxMinutes: 120,
}

/** How far ahead the planner fills in study time. Matches the conflict window. */
export const PLAN_HORIZON_DAYS = 56

const isTime = (v: unknown): v is string => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v)

function window(v: unknown, fallback: StudyWindow): StudyWindow {
  const w = v as Partial<StudyWindow> | undefined
  if (!w || !isTime(w.start) || !isTime(w.end) || w.end <= w.start) return fallback
  return { start: w.start, end: w.end }
}

function minutesIn(v: unknown, fallback: number, lo: number, hi: number): number {
  const n = Number(v)
  if (!Number.isFinite(n)) return fallback
  return Math.min(hi, Math.max(lo, Math.round(n / 15) * 15))
}

/** Cleans up saved or typed settings so the planner can always trust them. */
export function normalizeStudySettings(v: unknown): StudySettings {
  const s = (v ?? {}) as Partial<Record<keyof StudySettings, unknown>>
  const d = DEFAULT_STUDY_SETTINGS
  const chunkMinMinutes = minutesIn(s.chunkMinMinutes, d.chunkMinMinutes, 15, 240)
  return {
    weekday: window(s.weekday, d.weekday),
    weekend: window(s.weekend, d.weekend),
    dailyLimitMinutes: minutesIn(s.dailyLimitMinutes, d.dailyLimitMinutes, 0, 16 * 60),
    bufferMinutes: minutesIn(s.bufferMinutes, d.bufferMinutes, 0, 120),
    chunkMinMinutes,
    chunkMaxMinutes: Math.max(chunkMinMinutes, minutesIn(s.chunkMaxMinutes, d.chunkMaxMinutes, 15, 480)),
  }
}
