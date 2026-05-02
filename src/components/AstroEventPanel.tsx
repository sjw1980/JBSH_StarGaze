'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store/useStore'

interface AstroEventItem {
  locdate: string
  seq: string
  astroEvent: string
  astroTime: string
  astroTitle: string
}

/** YYYYMMDD → M/D(요) 형식 */
function formatDate(locdate: string): string {
  const s = locdate.replace(/\s/g, '')
  if (s.length < 8) return locdate.trim()
  const m = parseInt(s.slice(4, 6), 10)
  const d = parseInt(s.slice(6, 8), 10)
  const y = parseInt(s.slice(0, 4), 10)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const dow = days[new Date(y, m - 1, d).getDay()]
  return `${m}/${String(d).padStart(2, '0')}(${dow})`
}

/** 오늘 기준으로 이미 지난 항목은 흐리게 */
function isPast(locdate: string): boolean {
  const s = locdate.replace(/\s/g, '')
  if (s.length < 8) return false
  const today = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const todayStr = `${today.getUTCFullYear()}${String(today.getUTCMonth() + 1).padStart(2, '0')}${String(today.getUTCDate()).padStart(2, '0')}`
  return s < todayStr
}

export default function AstroEventPanel() {
  const { expandedPanel, togglePanel } = useStore()
  const isExpanded = expandedPanel === 'astro'

  const [items, setItems] = useState<AstroEventItem[]>([])
  const [loading, setLoading] = useState(false)
  const [monthLabel, setMonthLabel] = useState('')
  const [showAll, setShowAll] = useState(false)

  // 패널 닫힐 때 showAll 초기화
  useEffect(() => {
    if (!isExpanded) setShowAll(false)
  }, [isExpanded])

  useEffect(() => {
    setLoading(true)
    fetch('/api/astro-events')
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items ?? [])
        if (data.year && data.month) {
          setMonthLabel(`${data.year}년 ${parseInt(data.month, 10)}월`)
        }
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const PREVIEW_COUNT = 5
  const visibleItems = showAll ? items : items.slice(0, PREVIEW_COUNT)
  const hasMore = items.length > PREVIEW_COUNT

  const TEXT_LIMIT = 22
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const toggleItem = (key: string) =>
    setExpandedItems((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  // 오늘 이후 가장 가까운 이벤트
  const nextEvent = items.find((it) => !isPast(it.locdate))

  return (
    <div
      className="glass rounded-2xl cursor-pointer transition-all duration-300 select-none overflow-hidden"
      style={{ width: isExpanded ? 300 : 160 }}
      onClick={() => togglePanel('astro')}
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
              <span className="text-2xl">🌠</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-widest">
                  천문
                </div>
                {loading ? (
                  <div className="text-xs text-slate-400 mt-0.5">로딩 중…</div>
                ) : nextEvent ? (
                  <div className="text-sm font-bold text-white mt-0.5 truncate">
                    {formatDate(nextEvent.locdate)}{' '}
                    <span className="text-xs font-normal text-slate-300">
                      {nextEvent.astroEvent}
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 mt-0.5">이번 달 일정 없음</div>
                )}
              </div>
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
            <div className="mb-4">
              <div className="text-xs text-slate-400 uppercase tracking-widest mb-0.5">
                천문현상
              </div>
              <div className="text-base font-bold text-white">
                {monthLabel || '이번 달'} 천문 일정
              </div>
            </div>

            {/* Event list */}
            {loading ? (
              <div className="text-xs text-slate-400 py-4 text-center">로딩 중…</div>
            ) : items.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">데이터 없음</div>
            ) : (
              <>
                <div
                  className="space-y-1.5 pr-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {visibleItems.map((item, idx) => {
                    const past = isPast(item.locdate)
                    const isTitle = !!item.astroTitle
                    const itemKey = `${item.locdate}-${item.seq}-${idx}`
                    const isLong = item.astroEvent.length > TEXT_LIMIT
                    const isItemExpanded = expandedItems.has(itemKey)
                    const displayText =
                      isLong && !isItemExpanded
                        ? item.astroEvent.slice(0, TEXT_LIMIT) + '…'
                        : item.astroEvent
                    return (
                      <div
                        key={itemKey}
                        className={`rounded-lg px-3 py-2 transition-opacity ${past ? 'opacity-35' : ''} ${isLong ? 'cursor-pointer' : ''}`}
                        style={{
                          background: isTitle
                            ? 'rgba(250,204,21,0.08)'
                            : 'rgba(255,255,255,0.04)',
                          border: isTitle
                            ? '1px solid rgba(250,204,21,0.22)'
                            : '1px solid rgba(255,255,255,0.06)',
                        }}
                        onClick={isLong ? (e) => { e.stopPropagation(); toggleItem(itemKey) } : undefined}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-slate-400 whitespace-nowrap mt-0.5 w-16 shrink-0">
                            {formatDate(item.locdate)}
                          </span>
                          <div className="flex-1 min-w-0">
                            {isTitle && (
                              <div className="text-xs font-semibold text-yellow-300 leading-tight mb-0.5">
                                {item.astroTitle}
                              </div>
                            )}
                            <div className="text-xs text-white leading-snug break-words">
                              {displayText}
                              {isLong && (
                                <span className="ml-1 text-slate-500">
                                  {isItemExpanded ? '▲' : '▼'}
                                </span>
                              )}
                            </div>
                            {item.astroTime && (
                              <div className="text-xs text-slate-500 mt-0.5">
                                {item.astroTime}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* 더 보기 / 접기 */}
                {hasMore && (
                  <button
                    className="mt-2 w-full text-xs text-slate-400 hover:text-slate-200 transition-colors py-1.5 rounded-lg cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowAll((v) => !v)
                    }}
                  >
                    {showAll
                      ? '▲ 접기'
                      : `▼ 더 보기 (${items.length - PREVIEW_COUNT}개)`}
                  </button>
                )}
              </>
            )}

            {/* Source note */}
            <div className="mt-3 text-xs text-slate-600 text-right">
              출처: 한국천문연구원
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
