import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'
import { StudyBlocksDB } from './db'
import { DEFAULT_MIN_GAP, getMinGap, normalizeMinGap, setMinGap } from './settings'

describe('database upgrade', () => {
  it('keeps milestone 1 data when upgrading to version 2', async () => {
    const name = 'upgrade-test'
    const v1 = new Dexie(name)
    v1.version(1).stores({ feeds: 'id', courses: 'id, &name', items: 'id, feedId, courseId, kind, start' })
    await v1.table('items').add({ id: 'f|1', feedId: 'f', title: 'Lab', kind: 'assignment' })
    v1.close()

    const db = new StudyBlocksDB(name)
    await db.open()
    expect(await db.items.get('f|1')).toMatchObject({ title: 'Lab' })
    expect(await db.commitments.count()).toBe(0)
    await db.delete()
  })
})

describe('min gap setting', () => {
  it('defaults to 10 and saves changes', async () => {
    const db = new StudyBlocksDB('settings-test')
    expect(await getMinGap(db)).toBe(DEFAULT_MIN_GAP)
    await setMinGap(db, 0)
    expect(await getMinGap(db)).toBe(0)
    await db.delete()
  })

  it('cleans up bad values', () => {
    expect(normalizeMinGap('abc')).toBe(DEFAULT_MIN_GAP)
    expect(normalizeMinGap(-5)).toBe(DEFAULT_MIN_GAP)
    expect(normalizeMinGap(7.6)).toBe(8)
    expect(normalizeMinGap(9999)).toBe(240)
  })
})

describe('study settings', () => {
  it('defaults, saves, and cleans up', async () => {
    const { getStudySettings, setStudySettings } = await import('./settings')
    const { DEFAULT_STUDY_SETTINGS } = await import('../study/types')
    const db = new StudyBlocksDB('study-settings-test')
    expect(await getStudySettings(db)).toEqual(DEFAULT_STUDY_SETTINGS)
    await setStudySettings(db, { ...DEFAULT_STUDY_SETTINGS, bufferMinutes: 30 })
    expect((await getStudySettings(db)).bufferMinutes).toBe(30)
    await db.delete()
  })
})
