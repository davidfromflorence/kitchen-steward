'use client'

import { Award, Check, Lock, Flame, TrendingUp } from 'lucide-react'

interface Badge {
  id: string
  name: string
  description: string
  emoji: string
  unlocked: boolean
  progress: { current: number; target: number; unit: string }
}

interface BadgesClientProps {
  badges: Badge[]
  totalUnlocked: number
  totalBadges: number
  streakDays: number
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function BadgesClient({
  badges,
  totalUnlocked,
  totalBadges,
  streakDays,
}: BadgesClientProps) {
  const progressPct = Math.round((totalUnlocked / totalBadges) * 100)

  // Sort: unlocked first, then locked
  const sorted = [...badges].sort((a, b) => {
    if (a.unlocked === b.unlocked) return 0
    return a.unlocked ? -1 : 1
  })

  // Find most recently unlocked badge for celebration
  // (Use the last unlocked badge in original order as "recent")
  const unlockedBadges = badges.filter((b) => b.unlocked)
  const recentBadge = unlockedBadges.length > 0 ? unlockedBadges[unlockedBadges.length - 1] : null

  // Streak day dots: fill up to streakDays % 7
  const streakInWeek = streakDays % 7 || (streakDays > 0 ? 7 : 0)

  // Next streak milestone
  const nextMilestone = streakDays < 7 ? 7 : streakDays < 10 ? 10 : streakDays < 30 ? 30 : 100
  const daysToNext = nextMilestone - streakDays

  return (
    <div className="flex flex-col gap-6 animate-in py-8 max-w-4xl mx-auto px-6 pb-12">
      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Award className="w-8 h-8 text-olive-600" />
          Achievements
        </h1>
        <p className="text-slate-500 mt-1">
          Track your kitchen milestones and earn badges
        </p>
      </div>

      {/* ── Progress Bar ── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-700">Overall Progress</span>
          <span className="text-sm font-bold text-olive-600">
            {totalUnlocked} / {totalBadges} Unlocked
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-olive-600 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {totalBadges - totalUnlocked === 0
            ? 'Incredible! You have unlocked every badge!'
            : `${totalBadges - totalUnlocked} more to go. Keep it up!`}
        </p>
      </div>

      {/* ── Recent Achievement Celebration ── */}
      {recentBadge && (
        <div className="bg-olive-50 border border-olive-200 rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-olive-600 flex items-center justify-center shrink-0">
              <Check className="w-7 h-7 text-white" strokeWidth={3} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-olive-600 uppercase tracking-wider">
                Achievement Unlocked!
              </p>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                {recentBadge.emoji} {recentBadge.name}
              </h3>
              <p className="text-sm text-slate-600">{recentBadge.description}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-olive-200">
            <div className="text-center">
              <p className="text-lg font-bold text-slate-800">{totalUnlocked}</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Badges Earned
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-800">{streakDays}d</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Days Active
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-800">{Math.round(totalUnlocked * 1.2)} kg</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Waste Prevented
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Streak Tracker ── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
            <Flame className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Current Streak</h2>
            <p className="text-xs text-slate-400">Days without expired items</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-3xl font-black text-slate-900">{streakDays}</p>
            <p className="text-xs font-semibold text-slate-400">days</p>
          </div>
        </div>

        {/* Day dots row */}
        <div className="flex items-center justify-between gap-2 mb-4">
          {DAY_LABELS.map((label, i) => {
            const active = i < streakInWeek
            return (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    active
                      ? 'bg-olive-600 shadow-sm'
                      : 'bg-slate-100 border-2 border-dashed border-slate-200'
                  }`}
                >
                  {active && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                </div>
                <span
                  className={`text-[10px] font-semibold ${
                    active ? 'text-olive-600' : 'text-slate-300'
                  }`}
                >
                  {label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Motivational text */}
        <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-4 py-3">
          <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">
            {streakDays === 0
              ? 'Start your streak by keeping items fresh today!'
              : daysToNext <= 0
                ? 'Amazing streak! You are a kitchen master!'
                : `Keep going! ${daysToNext} more day${daysToNext !== 1 ? 's' : ''} to unlock the ${nextMilestone}-Day Streak`}
          </p>
        </div>
      </div>

      {/* ── Badges Grid ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">Your Badges</h2>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
            {totalUnlocked} / {totalBadges}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sorted.map((badge) => (
            <div
              key={badge.id}
              className={`relative rounded-2xl p-5 flex flex-col items-center text-center transition-all ${
                badge.unlocked
                  ? 'bg-white border-2 border-olive-200 shadow-sm'
                  : 'bg-slate-50 border-2 border-dashed border-slate-200'
              }`}
            >
              {/* Unlock indicator */}
              {badge.unlocked && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-olive-600 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              )}
              {!badge.unlocked && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                  <Lock className="w-2.5 h-2.5 text-slate-400" />
                </div>
              )}

              {/* Emoji */}
              <span
                className={`text-4xl mb-3 ${
                  badge.unlocked ? '' : 'grayscale opacity-40'
                }`}
              >
                {badge.emoji}
              </span>

              {/* Name */}
              <h3
                className={`text-sm font-bold mb-1 ${
                  badge.unlocked ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                {badge.name}
              </h3>

              {/* Description */}
              <p
                className={`text-xs leading-snug mb-3 ${
                  badge.unlocked ? 'text-slate-500' : 'text-slate-300'
                }`}
              >
                {badge.description}
              </p>

              {/* Progress */}
              {badge.unlocked ? (
                <span className="text-[10px] font-bold text-olive-600 bg-olive-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Completed
                </span>
              ) : (
                <div className="w-full mt-auto">
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                    <div
                      className="h-full bg-olive-400 rounded-full transition-all"
                      style={{
                        width: `${Math.round(
                          (badge.progress.current / badge.progress.target) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400">
                    {badge.progress.current} / {badge.progress.target} {badge.progress.unit}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
