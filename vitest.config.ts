import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // A zone with daylight saving, so date tests behave the same on every machine.
    env: { TZ: 'America/Denver' },
    include: ['src/**/*.test.ts', 'server/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
  },
})
