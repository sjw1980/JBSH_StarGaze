'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useStore } from '@/store/useStore'

function formatHour(unix: number) {
  return (
    new Date(unix * 1000).toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      hour12: false,
    }) + '시'
  )
}

export default function WeatherTimeline() {
  const { expandedPanel, togglePanel, forecastData, isWeatherLoading } = useStore()
  const isExpanded = expandedPanel === 'weather'

  const hasAlert = forecastData.some(
    (f) => f.pop > 0.5 || f.rain || f.snow || f.windSpeed > 10,
  )

  const chartData = forecastData.map((f) => ({
    time: formatHour(f.dt),
    '기온(°C)': Math.round(f.temp * 10) / 10,
    '운량(%)': f.clouds,
    '강수확률(%)': Math.round(f.pop * 100),
  }))

  return (
    <div
      className={`glass rounded-2xl cursor-pointer transition-all duration-300 select-none overflow-hidden${hasAlert ? ' alert-flash' : ''}`}
      style={{ minWidth: isExpanded ? 500 : 190 }}
      onClick={() => togglePanel('weather')}
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
              <span className="text-2xl">🌡️</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-widest">
                  예보
                </div>
                {isWeatherLoading ? (
                  <div className="text-xs text-slate-400 mt-0.5">로딩 중…</div>
                ) : forecastData.length > 0 ? (
                  <div className="text-sm font-bold text-white mt-0.5">
                    {forecastData[0].temp.toFixed(1)}°C
                    <span className="text-xs text-slate-400 font-normal ml-1.5">
                      운량 {forecastData[0].clouds}%
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 mt-0.5">API 키 필요</div>
                )}
              </div>
              {hasAlert && (
                <span className="text-red-400 text-lg animate-pulse">⚠️</span>
              )}
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
            {/* Clickable header to collapse */}
            <div onClick={() => togglePanel('weather')} className="cursor-pointer mb-4">
              <div className="text-xs text-slate-400 uppercase tracking-widest mb-0.5">
                24시간 기상 예보
              </div>
              <div className="flex items-center justify-between">
                <div className="text-base font-bold text-white">시간별 날씨 타임라인</div>
                {hasAlert && (
                  <div
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-red-400"
                    style={{
                      background: 'rgba(239,68,68,0.12)',
                      border: '1px solid rgba(239,68,68,0.35)',
                    }}
                  >
                    <span className="animate-pulse">⚠️</span>
                    <span>관측 방해 요소 감지</span>
                  </div>
                )}
              </div>
            </div>

            {forecastData.length > 0 ? (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{ width: '100%', height: 180 }}
              >
                <ResponsiveContainer>
                  <AreaChart
                    data={chartData}
                    margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
                  >
                    <defs>
                      <linearGradient id="gTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gCloud" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gRain" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="time"
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickLine={false}
                    />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(2,8,23,0.92)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '10px',
                        color: '#e2e8f0',
                        fontSize: '12px',
                      }}
                      cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                    />
                    <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '11px' }} />
                    <Area
                      type="monotone"
                      dataKey="기온(°C)"
                      stroke="#60a5fa"
                      strokeWidth={2}
                      fill="url(#gTemp)"
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="운량(%)"
                      stroke="#94a3b8"
                      strokeWidth={1.5}
                      fill="url(#gCloud)"
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="강수확률(%)"
                      stroke="#818cf8"
                      strokeWidth={1.5}
                      fill="url(#gRain)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-5 text-slate-500">
                <div className="text-2xl mb-2">🔑</div>
                <div className="text-sm">
                  OpenWeatherMap API 키를
                  <br />
                  <code className="text-xs text-slate-400">.env.local</code>에 설정하세요
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
