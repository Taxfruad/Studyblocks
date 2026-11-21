import { describe, expect, it } from 'vitest'
import { expandCommitments, localInstant } from './expand'
import type { Commitment } from './types'

const shift: Commitment = {
  id: 'w',
  title: 'Work',
  type: 'work',
  date: '2026-11-16', // a Monday
  startTime: '16:00',
  endTime: '21:00',
  weekly: { days: [2, 4] }, // Tue, Thu
}

const dates = (cs: Commitment[], from: string, to: string) =>
  expandCommitments(cs, from, to).map((o) => o.date)

describe('expandCommitments', () => {
  it('includes a one-time item only when it is in range', () => {
    const c: Commitment = { id: 'a', title: 'Dentist', type: 'other', date: '2026-11-20', startTime: '09:00', endTime: '10:00' }
    const [occ] = expandCommitments([c], '2026-11-16', '2026-11-22')
    expect(occ).toMatchObject({ id: 'a::2026-11-20', date: '2026-11-20', recurring: false })
    expect(occ.start).toBe(localInstant('2026-11-20', '09:00').toISOString())
    expect(occ.end).toBe(localInstant('2026-11-20', '10:00').toISOString())
    expect(expandCommitments([c], '2026-11-21', '2026-11-30')).toEqual([])
  })

  it('repeats weekly on the chosen days', () => {
    expect(dates([shift], '2026-11-16', '2026-11-29')).toEqual([
      '2026-11-17', '2026-11-19', '2026-11-24', '2026-11-26',
    ])
  })

  it('never starts before the first date and stops at "until"', () => {
    const c = { ...shift, date: '2026-11-19', weekly: { days: [2, 4], until: '2026-11-25' } }
    expect(dates([c], '2026-11-01', '2026-12-31')).toEqual(['2026-11-19', '2026-11-24'])
  })

  it('skips a week that was deleted', () => {
    const c = { ...shift, exceptions: { '2026-11-19': { skip: true as const } } }
    expect(dates([c], '2026-11-16', '2026-11-22')).toEqual(['2026-11-17'])
  })

  it('applies changed times for one week', () => {
    const c = { ...shift, exceptions: { '2026-11-19': { startTime: '17:00', endTime: '22:00' } } }
    const occ = expandCommitments([c], '2026-11-19', '2026-11-19')[0]
    expect(occ.start).toBe(localInstant('2026-11-19', '17:00').toISOString())
    expect(occ.originalDate).toBe('2026-11-19')
  })

  it('moves one week to another day', () => {
    const c = { ...shift, exceptions: { '2026-11-19': { date: '2026-11-20', startTime: '10:00', endTime: '15:00' } } }
    expect(dates([c], '2026-11-16', '2026-11-22')).toEqual(['2026-11-17', '2026-11-20'])
    // Found even when only the new day is in range.
    const [moved] = expandCommitments([c], '2026-11-20', '2026-11-20')
    expect(moved).toMatchObject({ id: 'w::2026-11-19', originalDate: '2026-11-19', date: '2026-11-20' })
    // And not shown when only the original day is in range.
    expect(dates([c], '2026-11-19', '2026-11-19')).toEqual([])
  })

  it('keeps local wall-clock time across a daylight-saving change', () => {
    // US DST ends Sunday 2026-11-01.
    const c = { ...shift, date: '2026-10-26' }
    const occs = expandCommitments([c], '2026-10-27', '2026-11-05')
    expect(occs).toHaveLength(4)
    for (const o of occs) expect(new Date(o.start).getHours()).toBe(16)
  })

  it('sorts occurrences from several commitments by start', () => {
    const early: Commitment = { id: 'e', title: 'Class', type: 'class', date: '2026-11-17', startTime: '09:00', endTime: '10:00' }
    const out = expandCommitments([shift, early], '2026-11-17', '2026-11-17')
    expect(out.map((o) => o.commitmentId)).toEqual(['e', 'w'])
  })
})
