/**
 * Starting guesses for how long an assignment takes, from its title. Checked in order,
 * so "Final project" counts as a project (6 h), not a final exam.
 */
const RULES: [RegExp, number][] = [
  [/\bproject\b/i, 360],
  [/\b(exam|test|midterm|final)\b/i, 240],
  [/\b(essay|paper)\b/i, 240],
  [/\bquiz(zes)?\b/i, 60],
  [/\b(discussion|reading|peer review)\b/i, 60],
  [/\b(lab|problem set|homework|hw)\b/i, 120],
]

export const FALLBACK_ESTIMATE = 120

/** Minutes. */
export function defaultEstimate(title: string): number {
  for (const [pattern, minutes] of RULES) if (pattern.test(title)) return minutes
  return FALLBACK_ESTIMATE
}
