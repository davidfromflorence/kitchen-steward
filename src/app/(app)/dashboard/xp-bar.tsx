'use client'

import { useGamification } from '@/app/(app)/gamification-context'
import { motion } from 'framer-motion'

export default function XpBar() {
  const { totalXP, level, xpToNextLevel, progressPercent, streak } =
    useGamification()

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 px-4 py-3">
      {/* Level badge */}
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-olive-600 flex items-center justify-center">
        <span className="text-white text-[11px] font-bold leading-none">
          {level}
        </span>
      </div>

      {/* XP progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-slate-700">Livello {level}</span>
          <span className="text-[10px] text-slate-400">{totalXP % 100}/{xpToNextLevel + (totalXP % 100)} XP</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-olive-500"
            initial={false}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: 'spring', damping: 20, stiffness: 120 }}
          />
        </div>
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="flex-shrink-0 flex items-center gap-1 bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full">
          <span className="text-sm leading-none">🔥</span>
          <span className="text-xs font-bold">{streak}</span>
        </div>
      )}
    </div>
  )
}
