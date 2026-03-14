'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Flame,
  Leaf,
  DollarSign,
  Trophy,
  TrendingUp,
  Star,
  Package,
  ChevronRight,
  BarChart3,
} from 'lucide-react'

interface Stats {
  streak: number
  carbonSaved: number
  totalSavings: number
  currentUserRank: number
  totalMembers: number
  savedItems: number
  totalItems: number
}

interface Member {
  id: string
  name: string
  score: number
  isCurrentUser: boolean
}

interface MonthlyDataPoint {
  month: string
  wasteSaved: number
  savings: number
}

interface CategorySlice {
  name: string
  percentage: number
}

interface Badge {
  label: string
  icon: string
  unlocked: boolean
}

interface AnalyticsClientProps {
  stats: Stats
  members: Member[]
  monthlyData: MonthlyDataPoint[]
  categoryBreakdown: CategorySlice[]
  badges: Badge[]
}

const ROLE_LABELS = [
  'MASTER CHEF',
  'ECO WARRIOR',
  'COMPOST KING',
  'WASTE WATCHER',
  'GREEN ROOKIE',
  'KITCHEN HERO',
]

const RANK_COLORS = [
  'text-amber-500',   // gold
  'text-slate-400',   // silver
  'text-amber-700',   // bronze
]

const RANK_BG = [
  'bg-amber-50',
  'bg-slate-50',
  'bg-amber-50/50',
]

const CATEGORY_COLORS = ['#65a30d', '#84cc16', '#a3e635', '#d9f99d']

function BadgeIcon({ icon, className }: { icon: string; className?: string }) {
  switch (icon) {
    case 'flame':
      return <Flame className={className} />
    case 'dollar':
      return <DollarSign className={className} />
    case 'leaf':
      return <Leaf className={className} />
    case 'trophy':
      return <Trophy className={className} />
    case 'star':
      return <Star className={className} />
    case 'package':
      return <Package className={className} />
    default:
      return <Star className={className} />
  }
}

export default function AnalyticsClient({
  stats,
  members,
  monthlyData,
  categoryBreakdown,
  badges,
}: AnalyticsClientProps) {
  const [chartPeriod] = useState<'6m' | '12m'>('6m')

  const maxWaste = Math.max(...monthlyData.map((d) => d.wasteSaved), 1)
  const maxSavings = Math.max(...monthlyData.map((d) => d.savings), 1)
  const latestSavings = monthlyData[monthlyData.length - 1]?.savings ?? 0
  const latestMonth = monthlyData[monthlyData.length - 1]?.month ?? ''

  // Projected annual savings
  const avgMonthlySavings =
    monthlyData.reduce((sum, d) => sum + d.savings, 0) / (monthlyData.length || 1)
  const annualProjected = Math.round(avgMonthlySavings * 12)

  // SVG line chart points for savings
  const chartWidth = 280
  const chartHeight = 120
  const chartPadding = 20
  const usableWidth = chartWidth - chartPadding * 2
  const usableHeight = chartHeight - chartPadding * 2

  const savingsPoints = monthlyData.map((d, i) => {
    const x = chartPadding + (i / Math.max(monthlyData.length - 1, 1)) * usableWidth
    const y = chartPadding + usableHeight - (d.savings / maxSavings) * usableHeight
    return { x, y }
  })
  const polylineStr = savingsPoints.map((p) => `${p.x},${p.y}`).join(' ')
  const gradientPath =
    `M${savingsPoints[0]?.x ?? chartPadding},${chartHeight - chartPadding} ` +
    savingsPoints.map((p) => `L${p.x},${p.y}`).join(' ') +
    ` L${savingsPoints[savingsPoints.length - 1]?.x ?? chartWidth - chartPadding},${chartHeight - chartPadding} Z`

  // Donut chart calculations
  const donutSize = 140
  const donutRadius = 52
  const donutStroke = 18
  const circumference = 2 * Math.PI * donutRadius
  let donutOffset = 0
  const avgWaste =
    categoryBreakdown.length > 0
      ? Math.round(categoryBreakdown.reduce((s, c) => s + c.percentage, 0) / categoryBreakdown.length)
      : 32

  // Milestone progress dots for streak
  const streakMilestone = 30
  const streakProgress = Math.min(stats.streak / streakMilestone, 1)
  const streakDots = 10

  return (
    <div className="flex flex-col gap-6 animate-in py-8 max-w-4xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">
            Your household eco-impact at a glance
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-olive-600 bg-olive-50 px-3 py-1.5 rounded-full">
          <BarChart3 className="w-3.5 h-3.5" />
          LIVE DATA
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          ROW 1: Stat Cards
          ══════════════════════════════════════════════ */}
      <div className="flex gap-4 overflow-x-auto pb-2 sm:pb-0 sm:grid sm:grid-cols-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {/* Zero-Waste Streak */}
        <div className="min-w-[200px] sm:min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl">🔥</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              Active
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">{stats.streak}</p>
            <p className="text-sm font-medium text-slate-500">Days Streak</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              MILESTONE: {streakMilestone} DAYS
            </p>
            <div className="flex gap-1">
              {Array.from({ length: streakDots }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i < Math.ceil(streakProgress * streakDots)
                      ? 'bg-olive-500'
                      : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Carbon Saved */}
        <div className="min-w-[200px] sm:min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl">🌿</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              +12%
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">{stats.carbonSaved} <span className="text-lg font-semibold text-slate-400">kg</span></p>
            <p className="text-sm font-medium text-slate-500">Carbon Saved</p>
          </div>
          <p className="text-xs text-slate-400">
            Equivalent to {Math.max(1, Math.round(stats.carbonSaved / 25))} trees planted
          </p>
        </div>

        {/* Total Savings */}
        <div className="min-w-[200px] sm:min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl">💰</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              +${Math.round(avgMonthlySavings)}
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">${stats.totalSavings.toLocaleString()}</p>
            <p className="text-sm font-medium text-slate-500">Total Savings</p>
          </div>
          <p className="text-xs text-slate-400">
            Annual projected: ${annualProjected.toLocaleString()}
          </p>
        </div>

        {/* Current Ranking */}
        <div className="min-w-[200px] sm:min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl">🏆</span>
            <span className="text-xs font-bold text-olive-600 bg-olive-50 px-2 py-0.5 rounded-full">
              in Family
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">#{stats.currentUserRank}</p>
            <p className="text-sm font-medium text-slate-500">Current Ranking</p>
          </div>
          <div className="flex -space-x-2">
            {members.slice(0, 3).map((m, i) => (
              <div
                key={m.id}
                className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold ${
                  i === 0
                    ? 'bg-amber-100 text-amber-700'
                    : i === 1
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-orange-100 text-orange-700'
                }`}
              >
                {m.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {members.length > 3 && (
              <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                +{members.length - 3}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          ROW 2: Charts
          ══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Food Waste Saved — Bar Chart */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-slate-800">Monthly Food Waste Saved</h2>
            <span className="text-[10px] font-bold text-olive-600 bg-olive-50 px-2.5 py-1 rounded-full">
              Last 6 Months
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            Amount of weight prevented from landfills
          </p>

          <div className="flex items-end gap-3 h-36">
            {monthlyData.map((d, i) => {
              const heightPct = (d.wasteSaved / maxWaste) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-500">
                    {d.wasteSaved}
                  </span>
                  <div className="w-full flex flex-col justify-end h-24">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-olive-600 to-olive-400 transition-all duration-500"
                      style={{ height: `${heightPct}%`, minHeight: '4px' }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-400">
                    {d.month}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Total saved this period</p>
              <p className="text-lg font-bold text-slate-800">
                {monthlyData.reduce((s, d) => s + d.wasteSaved, 0)} items
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" />
              +18% vs prior
            </div>
          </div>
        </div>

        {/* Financial Savings Trend — Line Chart */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-slate-800">Financial Savings Trend</h2>
            <div className="text-right">
              <p className="text-xl font-bold text-slate-900">${latestSavings}</p>
              <p className="text-[10px] text-slate-400 font-medium">Total {latestMonth}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Money saved by reducing food waste
          </p>

          <div className="relative">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#65a30d" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#65a30d" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 1, 2, 3].map((i) => {
                const y = chartPadding + (i / 3) * usableHeight
                return (
                  <line
                    key={i}
                    x1={chartPadding}
                    y1={y}
                    x2={chartWidth - chartPadding}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                )
              })}

              {/* Gradient fill */}
              {savingsPoints.length > 1 && (
                <path d={gradientPath} fill="url(#savingsGradient)" />
              )}

              {/* Line */}
              {savingsPoints.length > 1 && (
                <polyline
                  points={polylineStr}
                  fill="none"
                  stroke="#65a30d"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points */}
              {savingsPoints.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="3.5"
                  fill="white"
                  stroke="#65a30d"
                  strokeWidth="2"
                />
              ))}

              {/* Month labels */}
              {monthlyData.map((d, i) => {
                const x = chartPadding + (i / Math.max(monthlyData.length - 1, 1)) * usableWidth
                return (
                  <text
                    key={i}
                    x={x}
                    y={chartHeight - 4}
                    textAnchor="middle"
                    className="fill-slate-400 text-[9px] font-medium"
                  >
                    {d.month}
                  </text>
                )
              })}
            </svg>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">6-month total</p>
              <p className="text-lg font-bold text-slate-800">
                ${monthlyData.reduce((s, d) => s + d.savings, 0).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" />
              Trending up
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          ROW 3: Leaderboard + Category Breakdown
          ══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Family Eco-Warrior Leaderboard */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Family Eco-Warrior</h2>
            <p className="text-xs text-slate-400 mt-0.5">Ranked by sustainability points</p>
          </div>

          <div className="divide-y divide-slate-100">
            {members.map((member, i) => (
              <div
                key={member.id}
                className={`px-6 py-4 flex items-center gap-3 transition-colors ${
                  member.isCurrentUser ? 'bg-olive-50/60' : ''
                }`}
              >
                {/* Rank */}
                <span
                  className={`text-lg font-bold w-7 text-center ${
                    i < 3 ? (RANK_COLORS[i] ?? 'text-slate-400') : 'text-slate-300'
                  }`}
                >
                  {i + 1}
                </span>

                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    i < 3 ? (RANK_BG[i] ?? 'bg-slate-50') : 'bg-slate-100'
                  } ${i < 3 ? (RANK_COLORS[i] ?? 'text-slate-500') : 'text-slate-500'}`}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>

                {/* Name + Role */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 truncate">
                      {member.name}
                    </span>
                    {member.isCurrentUser && (
                      <span className="text-[10px] font-bold text-olive-600 bg-olive-100 px-1.5 py-0.5 rounded">
                        YOU
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      i === 0
                        ? 'text-amber-500'
                        : i === 1
                          ? 'text-slate-400'
                          : i === 2
                            ? 'text-amber-700'
                            : 'text-slate-300'
                    }`}
                  >
                    {ROLE_LABELS[i] ?? 'TEAM MEMBER'}
                  </span>
                </div>

                {/* Points */}
                <span className="text-sm font-bold text-slate-700">
                  {member.score.toLocaleString()} <span className="text-[10px] font-medium text-slate-400">pts</span>
                </span>
              </div>
            ))}

            {members.length === 0 && (
              <div className="px-6 py-8 text-center text-slate-400 text-sm">
                No household members yet
              </div>
            )}
          </div>
        </div>

        {/* Top Wasted Categories Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-1">Top Wasted Categories</h2>
          <p className="text-xs text-slate-400 mb-6">Breakdown of most wasted food types</p>

          <div className="flex items-start gap-6">
            {/* Donut Chart */}
            <div className="relative shrink-0">
              <svg
                width={donutSize}
                height={donutSize}
                viewBox={`0 0 ${donutSize} ${donutSize}`}
              >
                {categoryBreakdown.map((slice, i) => {
                  const sliceLength = (slice.percentage / 100) * circumference
                  const gapLength = circumference - sliceLength
                  const rotation = (donutOffset / 100) * 360 - 90
                  const currentOffset = donutOffset
                  donutOffset += slice.percentage

                  return (
                    <circle
                      key={i}
                      cx={donutSize / 2}
                      cy={donutSize / 2}
                      r={donutRadius}
                      fill="none"
                      stroke={CATEGORY_COLORS[i] ?? '#e2e8f0'}
                      strokeWidth={donutStroke}
                      strokeDasharray={`${sliceLength} ${gapLength}`}
                      strokeDashoffset={0}
                      transform={`rotate(${rotation} ${donutSize / 2} ${donutSize / 2})`}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  )
                })}
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-slate-800">{avgWaste}%</span>
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                  AVG WASTE
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-3 flex-1 pt-2">
              {categoryBreakdown.map((slice, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[i] ?? '#e2e8f0' }}
                  />
                  <span className="text-sm text-slate-600 flex-1">{slice.name}</span>
                  <span className="text-sm font-bold text-slate-800">{slice.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tip box */}
          <div className="mt-6 bg-olive-50 rounded-xl p-4 border border-olive-100">
            <p className="text-xs text-olive-700 leading-relaxed">
              <span className="font-bold">Tip:</span>{' '}
              {categoryBreakdown[0]
                ? `You're tracking ${categoryBreakdown[0].name} as your top category. Try the "Smoothie Saver" recipes to use items before they expire!`
                : 'Start adding items to your fridge to get personalized waste-reduction tips.'}
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          ROW 4: Milestone Badges
          ══════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Milestone Badges Unlocked</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {badges.filter((b) => b.unlocked).length} of {badges.length} earned
            </p>
          </div>
          <Link
            href="/analytics"
            className="flex items-center gap-1 text-sm font-semibold text-olive-600 hover:underline"
          >
            View All Achievements
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
          {badges.map((badge, i) => (
            <div
              key={i}
              className={`min-w-[130px] flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                badge.unlocked
                  ? 'bg-olive-50 border-olive-200 shadow-sm'
                  : 'bg-slate-50 border-slate-200 opacity-50'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center ${
                  badge.unlocked
                    ? 'bg-olive-100'
                    : 'bg-slate-200'
                }`}
              >
                <BadgeIcon
                  icon={badge.icon}
                  className={`w-5 h-5 ${
                    badge.unlocked ? 'text-olive-600' : 'text-slate-400'
                  }`}
                />
              </div>
              <span
                className={`text-xs font-semibold text-center leading-tight ${
                  badge.unlocked ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {badge.label}
              </span>
              {badge.unlocked && (
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  EARNED
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
