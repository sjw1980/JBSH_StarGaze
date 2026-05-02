'use client'

import { useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useStore } from '@/store/useStore'
import { getMoonPhase } from '@/lib/astronomy'
import ObservationPanel from '@/components/ObservationPanel'
import WeatherTimeline from '@/components/WeatherTimeline'
import ResourceGateway from '@/components/ResourceGateway'
import ClockDisplay from '@/components/ClockDisplay'
import AstroEventPanel from '@/components/AstroEventPanel'

// Three.js canvas must be client-only (no SSR)
const StarCanvas = dynamic(() => import('@/components/StarCanvas'), { ssr: false })

export default function Home() {
  const {
    setWeatherData,
    setForecastData,
    setMoonPhase,
    setWeatherLoading,
    setWeatherError,
  } = useStore()

  const fetchAll = useCallback(async () => {
    setWeatherLoading(true)
    try {
      const [wRes, fRes] = await Promise.all([
        fetch('/api/weather'),
        fetch('/api/forecast'),
      ])

      if (wRes.ok) {
        const w = await wRes.json()
        if (!w.error) {
          setWeatherData(w)
          // KMA getLunPhInfo 기반 달 위상 우선 사용, 없으면 astronomy-engine 로컬 계산
          if (typeof w.moonPhase === 'number') {
            setMoonPhase(w.moonPhase)
          } else {
            const phase = await getMoonPhase()
            setMoonPhase(phase)
          }
        }
      }

      if (fRes.ok) {
        const f = await fRes.json()
        if (!f.error) setForecastData(f)
      }

      setWeatherError(null)
    } catch (e) {
      setWeatherError(String(e))
    } finally {
      setWeatherLoading(false)
    }
  }, [setWeatherData, setForecastData, setMoonPhase, setWeatherLoading, setWeatherError])

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [fetchAll])

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      {/* ── Three.js Starfield ───────────────────────────── */}
      <StarCanvas />

      {/* ── Horizon gradient fade ───────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[1] pointer-events-none"
        style={{
          height: '28%',
          background:
            'linear-gradient(to top, #020817 0%, rgba(2,8,23,0.85) 40%, transparent 100%)',
        }}
      />

      {/* ── UI Overlay ──────────────────────────────────── */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <header className="flex items-start justify-between px-6 pt-6 pb-2">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl drop-shadow-lg">🌌</span>
              <div>
                <h1 className="text-xl font-bold text-white tracking-wide leading-none">
                  별바라기
                </h1>
                <p className="text-xs text-slate-500 tracking-[0.2em] uppercase mt-0.5">
                  JBSH StarGaze
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-2 pl-[52px]">
              전북과학고등학교 실시간 천문 관측 대시보드
            </p>
          </div>
          <ClockDisplay />
        </header>

        {/* Drag hint */}
        <div className="flex justify-center items-center mt-2">
          <span className="text-xs text-slate-600 tracking-widest select-none">
            ← 드래그하여 천구 탐색 →
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* ── Bottom panels ───────────────────────────── */}
        <div className="flex items-end gap-3 px-6 pb-6 overflow-x-auto pb-safe shrink-0">
          <div className="shrink-0"><AstroEventPanel /></div>
          <div className="shrink-0"><ObservationPanel /></div>
          <div className="shrink-0"><WeatherTimeline /></div>
          <div className="shrink-0"><ResourceGateway /></div>
        </div>
      </div>
    </main>
  )
}
