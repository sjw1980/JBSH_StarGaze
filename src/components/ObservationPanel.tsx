'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store/useStore'
import {
  getObservationStatus,
  getWindDirection,
  formatSunTime,
  getMoonPhaseName,
} from '@/lib/astronomy'
import { OBSERVATORY } from '@/lib/constants'
import MoonPhase from './MoonPhase'

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="text-sm font-semibold text-white leading-tight">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function ObservationPanel() {
  const { expandedPanel, togglePanel, weatherData, isWeatherLoading, moonPhase } = useStore()
  const isExpanded = expandedPanel === 'observation'

  const status = weatherData
    ? getObservationStatus(weatherData.clouds, weatherData.visibility)
    : null

  const hasAlert =
    !!weatherData && !!(weatherData.rain || weatherData.snow || weatherData.windSpeed > 10)

  return (
    <div
      className={`glass rounded-2xl cursor-pointer transition-all duration-300 select-none overflow-hidden${hasAlert ? ' alert-flash' : ''}`}
      style={{ minWidth: isExpanded ? 330 : 190 }}
      onClick={() => togglePanel('observation')}
    >
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.div
            key="min"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="p-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔭</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-widest">
                  관측
                </div>
                {isWeatherLoading ? (
                  <div className="text-xs text-slate-400 mt-0.5">로딩 중…</div>
                ) : status ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="inline-block w-2 h-2 rounded-full pulse-dot"
                      style={{ background: status.color }}
                    />
                    <span className="text-sm font-bold" style={{ color: status.color }}>
                      {status.status}
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 mt-0.5">API 키 필요</div>
                )}
              </div>
              <MoonPhase phase={moonPhase} size={32} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="exp"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className="p-5"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-widest mb-0.5">
                  관측 데이터
                </div>
                <div className="text-base font-bold text-white">전북과학고 천문대</div>
                <div className="text-xs text-slate-500 mt-0.5 leading-tight">
                  {OBSERVATORY.address}
                </div>
              </div>
              <MoonPhase phase={moonPhase} size={48} />
            </div>

            {/* Status badge */}
            {status && (
              <div
                className="rounded-xl p-3 mb-4 flex items-center gap-2.5"
                style={{
                  background: `${status.color}18`,
                  border: `1px solid ${status.color}35`,
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 pulse-dot"
                  style={{ background: status.color }}
                />
                <div>
                  <div className="text-sm font-bold" style={{ color: status.color }}>
                    관측 {status.status}
                  </div>
                  <div className="text-xs text-slate-400">{status.description}</div>
                </div>
              </div>
            )}

            {weatherData ? (
              <>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <StatCard
                    label="기온"
                    value={`${weatherData.temp.toFixed(1)}°C`}
                    sub={`체감 ${weatherData.feelsLike.toFixed(1)}°C`}
                  />
                  <StatCard label="습도" value={`${weatherData.humidity}%`} />
                  <StatCard
                    label="풍향 / 풍속"
                    value={`${getWindDirection(weatherData.windDeg)} ${weatherData.windSpeed.toFixed(1)} m/s`}
                  />
                  <StatCard label="운량" value={`${weatherData.clouds}%`} />
                  <StatCard
                    label="시정"
                    value={`${(weatherData.visibility / 1000).toFixed(1)} km`}
                  />
                  <StatCard label="현황" value={weatherData.description} />
                </div>

                {/* Moon + sun times */}
                <div
                  className="flex items-center gap-3 pt-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <MoonPhase phase={moonPhase} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-400">달 위상</div>
                    <div className="text-sm font-medium text-white">{getMoonPhaseName(moonPhase)}</div>
                    <div className="text-xs text-slate-500">{(moonPhase * 100).toFixed(0)}%</div>
                  </div>
                  <div className="text-right text-xs text-slate-400 space-y-0.5">
                    <div>🌅 일출 {formatSunTime(weatherData.sunrise)}</div>
                    <div>🌇 일몰 {formatSunTime(weatherData.sunset)}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-5 text-slate-500">
                <div className="text-2xl mb-2">🔑</div>
                <div className="text-sm leading-relaxed">
                  공공데이터포털 API 키를
                  <br />
                  <code className="text-xs text-slate-400">.env</code>에 설정하세요
                  <br />
                  <code className="text-xs text-slate-400">OPEN_API_KEY=인증키</code>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
