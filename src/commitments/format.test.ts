import { describe, expect, it } from 'vitest'
import { describeCommitment } from './format'

describe('describeCommitment', () => {
  it('lists weekly days Monday-first', () => {
    const text = describeCommitment({
      id: 'a', title: 'x', type: 'work', date: '2026-11-16', startTime: '16:00', endTime: '21:00',
      weekly: { days: [0, 4, 2] },
    })
    expect(text.startsWith('Tue, Thu, Sun · ')).toBe(true)
    expect(text).toMatch(/4:00\s?PM – 9:00\s?PM/)
  })

  it('shows the date for one-time commitments', () => {
    const text = describeCommitment({ id: 'b', title: 'x', type: 'other', date: '2026-11-20', startTime: '09:00', endTime: '10:00' })
    expect(text).toMatch(/Nov 20/)
  })
})
