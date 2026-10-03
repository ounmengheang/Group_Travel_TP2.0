import { useEffect, useState } from 'react'

// "2d 23h left" style countdown, refreshed every 30 seconds.
export function useTimeLeft(deadlineAt) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])
  if (!deadlineAt) return null
  const minutes = Math.max(0, Math.round((deadlineAt - now) / 60000))
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  if (days) return `${days}d ${hours}h left`
  return `${hours}h ${minutes % 60}m left`
}
