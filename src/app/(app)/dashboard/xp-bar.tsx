'use client'

import { useState } from 'react'
import { useGamification } from '@/app/(app)/gamification-context'
import { getLevelInfo, XP_ACTIONS, LEVELS } from '@/lib/levels'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function XpBar() {
  const { totalXP, streak } = useGamification()
  const [expanded, setExpanded] = useState(false)
  const { current, next, xpInLevel, xpForLevel, progressPercent } = getLevelInfo(totalXP)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Compact bar — tappable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50/50 transition-colors"
      >
        {/* Level badge */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-olive-600 flex items-center justify-center">
          <span className="text-lg leading-none">{current.emoji}</span>
        </div>

        {/* XP progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-800">{current.name}</span>
            <span className="text-[10px] text-slate-400">
              {next ? `${xpInLevel}/${xpForLevel} XP` : `${totalXP} XP`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-olive-500"
              initial={false}
              animate={{ width: `${progressPercent}%` }}
              transition={{ type: 'spring', damping: 20, stiffness: 120 }}
            />
          </div>
          {next && (
            <p className="text-[10px] text-slate-400 mt-1">
              Ancora {xpForLevel - xpInLevel} XP per <span className="font-semibold text-slate-500">{next.emoji} {next.name}</span>
            </p>
          )}
        </div>

        {/* Streak + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          {streak > 0 && (
            <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-full">
              <span className="text-xs leading-none">🔥</span>
              <span className="text-[11px] font-bold">{streak}</span>
            </div>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-slate-100 pt-3">
              {/* Current level description */}
              <div className="bg-olive-50 rounded-xl px-4 py-3 mb-4">
                <p className="text-sm font-bold text-olive-800">{current.emoji} {current.name}</p>
                <p className="text-xs text-olive-600 mt-0.5">{current.description}</p>
                <p className="text-xs text-olive-500 mt-1">Totale: {totalXP} XP</p>
              </div>

              {/* How to earn XP */}
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Come guadagnare XP
              </p>
              <div className="grid grid-cols-2 gap-1.5 mb-4">
                {XP_ACTIONS.map((a) => (
                  <div key={a.action} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-sm">{a.emoji}</span>
                    <div>
                      <p className="text-[11px] font-medium text-slate-700">{a.action}</p>
                      <p className="text-[10px] font-bold text-olive-600">+{a.xp} XP</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Level roadmap */}
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Livelli
              </p>
              <div className="flex flex-col gap-1">
                {LEVELS.map((lvl) => {
                  const reached = totalXP >= lvl.minXP
                  const isCurrent = lvl.level === current.level
                  return (
                    <div
                      key={lvl.level}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs ${
                        isCurrent
                          ? 'bg-olive-100 text-olive-800 font-bold'
                          : reached
                            ? 'text-slate-600'
                            : 'text-slate-400'
                      }`}
                    >
                      <span className={`text-base ${reached ? '' : 'grayscale opacity-50'}`}>{lvl.emoji}</span>
                      <span className="flex-1">{lvl.name}</span>
                      <span className="text-[10px] font-medium">{lvl.minXP} XP</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
