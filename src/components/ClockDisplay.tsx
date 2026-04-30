'use client'

import { useState, useEffect } from 'react'
import { formatSiderealTime, getLocalSiderealTime, formatJulianDate } from '@/lib/astronomy'

export default function ClockDisplay() {
  const [kst, setKst] = useState('')
  const [lst, setLst] = useState('')
  const [jd, setJd] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setKst(
        now.toLocaleTimeString('ko-KR', {
          timeZone: 'Asia/Seoul',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }),
      )
      setLst(formatSiderealTime(getLocalSiderealTime(now)))
      setJd(formatJulianDate(now))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="text-right">
      <div className="text-2xl font-mono font-bold tracking-widest glow-text text-blue-200">
        {kst || '──:──:──'}
      </div>
      <div className="text-xs text-slate-400 font-mono mt-0.5 space-x-3">
        <span>LST {lst || '──ʰ──ᵐ──ˢ'}</span>
        <span>JD {jd || '─────────'}</span>
      </div>
      <div className="text-xs text-slate-500 mt-0.5">전북과학고 천문대 · KST</div>
    </div>
  )
}
