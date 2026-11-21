/** Muted colors that read well on both the dark and light themes. */
export const COURSE_COLORS = [
  '#8b7cf6', // violet
  '#4fa3d1', // blue
  '#5fb88a', // green
  '#e0a84f', // amber
  '#e06c75', // rose
  '#56b6c2', // teal
  '#c678dd', // orchid
  '#d19a66', // clay
]

export function nextCourseColor(existingCount: number): string {
  return COURSE_COLORS[existingCount % COURSE_COLORS.length]
}
