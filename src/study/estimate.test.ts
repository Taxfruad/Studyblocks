import { describe, expect, it } from 'vitest'
import { defaultEstimate } from './estimate'

describe('defaultEstimate', () => {
  it.each([
    ['Quiz 5', 60],
    ['Midterm exam', 240],
    ['Final Exam Review', 240],
    ['Unit 3 test', 240],
    ['Project 10: Final project', 360],
    ['Final project', 360],
    ['Essay draft: Argument', 240],
    ['Research paper', 240],
    ['Lab 9: Recursion', 120],
    ['Problem Set 7', 120],
    ['Homework 4', 120],
    ['Discussion post week 3', 60],
    ['Reading response', 60],
    ['Peer review', 60],
    ['Something else', 120],
  ])('%s → %i min', (title, minutes) => {
    expect(defaultEstimate(title)).toBe(minutes)
  })

  it('does not match words inside other words', () => {
    expect(defaultEstimate('Contest prep')).toBe(120) // "test" inside "Contest"
    expect(defaultEstimate('Collaboration')).toBe(120) // "lab" inside a word
  })
})
