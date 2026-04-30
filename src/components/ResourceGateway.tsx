'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store/useStore'
import { RESOURCES } from '@/lib/constants'

export default function ResourceGateway() {
  const { expandedPanel, togglePanel } = useStore()
  const isExpanded = expandedPanel === 'resource'

  return (
    <div
      className="glass rounded-2xl cursor-pointer transition-all duration-300 select-none overflow-hidden"
      style={{ minWidth: isExpanded ? 290 : 160 }}
      onClick={() => togglePanel('resource')}
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
              <span className="text-2xl">🔗</span>
              <div>
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-widest">
                  링크
                </div>
                <div className="flex gap-1 mt-1">
                  {RESOURCES.slice(0, 5).map((r) => (
                    <span key={r.id} className="text-sm">
                      {r.icon}
                    </span>
                  ))}
                </div>
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
            {/* Clickable header */}
            <div
              className="cursor-pointer mb-4"
              onClick={() => togglePanel('resource')}
            >
              <div className="text-xs text-slate-400 uppercase tracking-widest mb-0.5">
                리소스 게이트웨이
              </div>
              <div className="text-base font-bold text-white">외부 링크</div>
            </div>

            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
              {RESOURCES.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 active:scale-[0.98]"
                  style={{
                    background: `${resource.color}12`,
                    border: `1px solid ${resource.color}28`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${resource.color}22`
                    e.currentTarget.style.borderColor = `${resource.color}50`
                    e.currentTarget.style.transform = 'scale(1.015)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `${resource.color}12`
                    e.currentTarget.style.borderColor = `${resource.color}28`
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <span className="text-xl flex-shrink-0">{resource.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white">{resource.name}</div>
                    <div className="text-xs text-slate-400 truncate">{resource.description}</div>
                  </div>
                  <svg
                    className="w-3 h-3 flex-shrink-0 text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
