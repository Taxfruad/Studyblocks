import { describe, expect, it } from 'vitest'
import { DEFAULT_STUDY_SETTINGS, normalizeStudySettings } from './types'

describe('normalizeStudySettings', () => {
  it('fills in defaults for missing or junk values', () => {
    expect(normalizeStudySettings(undefined)).toEqual(DEFAULT_STUDY_SETTINGS)
    expect(normalizeStudySettings({ bufferMinutes: 'abc', weekday: { start: '25:00', end: '22:00' } })).toEqual(
      DEFAULT_STUDY_SETTINGS,
    )
  })

  it('rejects a study window that ends before it starts', () => {
    expect(normalizeStudySettings({ weekend: { start: '20:00', end: '09:00' } }).weekend).toEqual(DEFAULT_STUDY_SETTINGS.weekend)
  })

  it('rounds to 15 minutes, clamps, and keeps max chunk ≥ min chunk', () => {
    const s = normalizeStudySettings({ bufferMinutes: 7, dailyLimitMinutes: 9999, chunkMinMinutes: 90, chunkMaxMinutes: 45 })
    expect(s.bufferMinutes).toBe(0)
    expect(s.dailyLimitMinutes).toBe(960)
    expect(s.chunkMinMinutes).toBe(90)
    expect(s.chunkMaxMinutes).toBe(90)
  })
})
