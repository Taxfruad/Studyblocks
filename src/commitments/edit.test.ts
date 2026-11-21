import { describe, expect, it } from 'vitest'
import { deleteOccurrence, moveOccurrence, validateTimes } from './edit'
import { expandCommitments, localInstant } from './expand'
import { buildTestShift } from './testShift'
import type { Commitment } from './types'

const shift: Commitment = {
  id: 'w', title: 'Work', type: 'work', date: '2026-11-16',
  startTime: '16:00', endTime: '21:00', weekly: { days: [2, 4] },
}
const occOn = (c: Commitment, day: string) => expandCommitments([c], day, day)[0]
const at = (day: string, t: string) => localInstant(day, t)

describe('validateTimes', () => {
  it('accepts a same-day range', () => {
    expect(validateTimes(at('2026-11-17', '09:00'), at('2026-11-17', '10:00'))).toBeNull()
  })
  it('rejects overnight, empty and backwards ranges', () => {
    expect(validateTimes(at('2026-11-17', '22:00'), at('2026-11-18', '01:00'))).toMatch(/same day/)
    expect(validateTimes(at('2026-11-17', '09:00'), at('2026-11-17', '09:00'))).toMatch(/after/)
    expect(validateTimes(at('2026-11-17', '10:00'), at('2026-11-17', '09:00'))).toMatch(/after/)
  })
  it('allows ending exactly at midnight', () => {
    expect(validateTimes(at('2026-11-17', '22:00'), at('2026-11-18', '00:00'))).toBeNull()
  })
})

describe('moveOccurrence', () => {
  it('moves a one-time commitment', () => {
    const c: Commitment = { id: 'a', title: 'Dentist', type: 'other', date: '2026-11-20', startTime: '09:00', endTime: '10:00' }
    const moved = moveOccurrence(c, occOn(c, '2026-11-20'), at('2026-11-21', '13:00'), at('2026-11-21', '14:30'), 'one')
    expect(moved).toMatchObject({ date: '2026-11-21', startTime: '13:00', endTime: '14:30' })
  })

  it('moves just one week of a series', () => {
    const moved = moveOccurrence(shift, occOn(shift, '2026-11-19'), at('2026-11-20', '10:00'), at('2026-11-20', '15:00'), 'one')
    expect(moved.startTime).toBe('16:00')
    expect(moved.weekly).toEqual(shift.weekly)
    expect(moved.exceptions?.['2026-11-19']).toEqual({ date: '2026-11-20', startTime: '10:00', endTime: '15:00' })
  })

  it('moving a week back onto its own day keeps no date override', () => {
    const moved = moveOccurrence(shift, occOn(shift, '2026-11-19'), at('2026-11-19', '17:00'), at('2026-11-19', '22:00'), 'one')
    expect(moved.exceptions?.['2026-11-19']).toEqual({ startTime: '17:00', endTime: '22:00' })
  })

  it('changes the times of every week', () => {
    const moved = moveOccurrence(shift, occOn(shift, '2026-11-19'), at('2026-11-19', '15:00'), at('2026-11-19', '20:00'), 'all')
    expect(moved).toMatchObject({ startTime: '15:00', endTime: '20:00', weekly: { days: [2, 4] } })
  })

  it('moving every week to another weekday replaces only that weekday', () => {
    const withException = { ...shift, exceptions: { '2026-11-24': { skip: true as const } } }
    const moved = moveOccurrence(withException, occOn(shift, '2026-11-17'), at('2026-11-18', '16:00'), at('2026-11-18', '21:00'), 'all')
    expect(moved.weekly?.days).toEqual([3, 4]) // Wed, Thu
    expect(moved.exceptions).toEqual(withException.exceptions)
  })
})

describe('deleteOccurrence', () => {
  it('skips one week of a series', () => {
    const out = deleteOccurrence(shift, '2026-11-19', 'one')
    expect(out?.exceptions?.['2026-11-19']).toEqual({ skip: true })
    expect(out?.weekly).toEqual(shift.weekly)
  })

  it('deletes the whole series', () => {
    expect(deleteOccurrence(shift, '2026-11-19', 'all')).toBeNull()
  })

  it('deletes a one-time commitment', () => {
    const c: Commitment = { id: 'a', title: 'x', type: 'other', date: '2026-11-20', startTime: '09:00', endTime: '10:00' }
    expect(deleteOccurrence(c, '2026-11-20', 'one')).toBeNull()
  })
})

describe('buildTestShift', () => {
  it('makes a Tue/Thu 4–9 pm and a Sat 10 am–4 pm shift starting this week', () => {
    const [weekday, saturday] = buildTestShift(new Date(2026, 10, 20, 12)) // Fri Nov 20
    expect(weekday).toMatchObject({ type: 'work', startTime: '16:00', endTime: '21:00', weekly: { days: [2, 4] }, date: '2026-11-16' })
    expect(saturday).toMatchObject({ type: 'work', startTime: '10:00', endTime: '16:00', weekly: { days: [6] }, date: '2026-11-16' })
    expect(weekday.title).toBe('Work (test shift)')
    expect(weekday.id).not.toBe(saturday.id)
  })
})
