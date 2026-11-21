export function relativeTime(iso: string, now = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000)
  const fmt = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  const abs = Math.abs(seconds)
  if (abs < 60) return 'just now'
  if (abs < 3600) return fmt.format(Math.round(seconds / 60), 'minute')
  if (abs < 86400) return fmt.format(Math.round(seconds / 3600), 'hour')
  return fmt.format(Math.round(seconds / 86400), 'day')
}
