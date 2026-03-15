'use client'

import { useGamification } from '@/app/(app)/gamification-context'
import { motion } from 'framer-motion'

export default function XpBar() {
  const { totalXP, level, xpToNextLevel, progressPercent, streak } =
    useGamification()

  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-2.5">
      {/* Level badge */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-olive-600 flex items-center justify-center">
        <span className="text-white text-xs font-bold leading-none">
          Lv.{level}
        </span>
      </div>

      {/* XP progress bar */}
      <div className="flex-1 min-w-0">
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-olive-600"
            initial={false}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: 'spring', damping: 20, stiffness: 120 }}
          />
        </div>
        <p className="text-[11px] text-slate-400 font-medium mt-1">
          {totalXP % 100}/{xpToNextLevel} XP
        </p>
      </div>

      {/* Streak */}
      <div
        className={`flex-shrink-0 flex items-center gap-1 text-sm font-bold ${
          streak > 0 ? 'text-amber-500' : 'text-slate-300'
        }`}
      >
        <span className={streak > 0 ? '' : 'grayscale opacity-40'}>
          🔥
        </span>
        <span>{streak}d</span>
      </div>
    </div>
  )
}
