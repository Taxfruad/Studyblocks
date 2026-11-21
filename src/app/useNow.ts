import { useEffect, useState } from 'react'

/** The current time, refreshed every few minutes so "upcoming" stays accurate. */
export function useNow(intervalMs = 5 * 60_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
