import { addDays, localDateKey } from '../calendar/dates'
import { expandCommitments } from '../commitments/expand'
import { db } from '../db/db'
import { getStudySettings } from '../db/settings'
import { planStudy, type PlanResult } from './plan'
import { PLAN_HORIZON_DAYS } from './types'

export type PlanSummary = PlanResult & { minutes: number }

/** Runs the planner on everything saved in this browser and stores the result. */
export async function planMyStudyTime(now = new Date()): Promise<PlanSummary> {
  const [items, commitments, blocks, settings] = await Promise.all([
    db.items.toArray(),
    db.commitments.toArray(),
    db.studyBlocks.toArray(),
    getStudySettings(db),
  ])
  const today = localDateKey(now)
  const occurrences = expandCommitments(commitments, today, addDays(today, PLAN_HORIZON_DAYS))
  const result = planStudy({ items, occurrences, blocks, settings, now })
  await db.transaction('rw', db.studyBlocks, async () => {
    await db.studyBlocks.bulkDelete(result.remove)
    await db.studyBlocks.bulkAdd(result.add)
  })
  const minutes = result.add.reduce((s, b) => s + (Date.parse(b.end) - Date.parse(b.start)) / 60000, 0)
  return { ...result, minutes }
}

export function formatMinutes(m: number): string {
  const h = Math.floor(m / 60)
  const r = Math.round(m % 60)
  if (h === 0) return `${r} min`
  return r === 0 ? `${h} h` : `${h} h ${r} min`
}

export function summarize(s: PlanSummary): string {
  const planned = s.add.length === 0 ? 'Nothing new to plan' : `Planned ${s.add.length} block${s.add.length === 1 ? '' : 's'} (${formatMinutes(s.minutes)})`
  if (s.wontFit.length === 0) return `${planned}.`
  return `${planned}. ${s.wontFit.length} assignment${s.wontFit.length === 1 ? " won't" : "s won't"} fit. See Schedule.`
}
