import { useEffect, useState } from 'react'

// Live countdown to a deadline, e.g. "2d 23h 59m 41s". Returns null when there is no deadline.
export function useTimeLeft(deadlineAt) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  if (!deadlineAt) return null
  const seconds = Math.max(0, Math.round((deadlineAt - now) / 1000))
  const pad = (n) => String(n).padStart(2, '0')
  const days = Math.floor(seconds / 86400)
  const clock = `${pad(Math.floor((seconds % 86400) / 3600))}h ${pad(Math.floor((seconds % 3600) / 60))}m ${pad(seconds % 60)}s`
  return days ? `${days}d ${clock}` : clock
}
