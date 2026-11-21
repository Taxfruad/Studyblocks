import { describe, expect, it } from 'vitest'
import { parseIcs } from './parseIcs'
import { buildSampleIcs } from './sample'

describe('buildSampleIcs', () => {
  it('produces a Canvas-shaped feed that parses into assignments, events and 3 courses', () => {
    const today = new Date(2026, 10, 20, 9, 0)
    const items = parseIcs(buildSampleIcs(today), today)
    expect(items.filter((i) => i.kind === 'assignment')).toHaveLength(8)
    expect(items.filter((i) => i.kind === 'event')).toHaveLength(2)
    expect(new Set(items.map((i) => i.courseName)).size).toBe(3)
    expect(items.find((i) => i.uid === 'event-assignment-s3')).toMatchObject({ allDay: true, start: '2026-11-24' })
  })
})
