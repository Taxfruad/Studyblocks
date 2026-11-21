import { describe, expect, it } from 'vitest'
import { localInstant } from './expand'
import { sortByNextUp } from './order'
import type { Commitment } from './types'

const now = localInstant('2026-11-20', '12:00') // Friday noon

const c = (id: string, extra: Partial<Commitment>): Commitment => ({
  id, title: id, type: 'class', date: '2026-11-16', startTime: '09:00', endTime: '10:00', ...extra,
})

describe('sortByNextUp', () => {
  it('orders commitments by when they next happen, finished ones last', () => {
    const list = [
      c('next-week', { date: '2026-11-27' }),
      c('monday-weekly', { weekly: { days: [1] } }), // next: Mon Nov 23 9:00
      c('this-afternoon', { date: '2026-11-20', startTime: '15:00', endTime: '16:00' }),
      c('happening-now', { date: '2026-11-20', startTime: '11:30', endTime: '13:00' }),
      c('finished', { date: '2026-11-18' }),
      c('saturday-weekly', { weekly: { days: [6] }, startTime: '10:00', endTime: '16:00' }), // Sat Nov 21
      c('ended-series', { weekly: { days: [2], until: '2026-11-17' } }),
    ]
    expect(sortByNextUp(list, now).map((x) => x.commitment.id)).toEqual([
      'happening-now', 'this-afternoon', 'saturday-weekly', 'monday-weekly', 'next-week',
      'finished', 'ended-series',
    ])
  })

  it('skips weeks that were deleted when finding the next one', () => {
    const skipped = c('skipped', { weekly: { days: [6] }, exceptions: { '2026-11-21': { skip: true } } })
    const [entry] = sortByNextUp([skipped], now)
    expect(entry.next?.date).toBe('2026-11-28')
  })
})
