'use client'

import { useState, useEffect } from 'react'
import { getHouseholdActivity } from '@/app/actions/activity'
import { Clock } from 'lucide-react'

const ACTION_CONFIG: Record<string, { emoji: string; verb: string }> = {
  item_added: { emoji: '➕', verb: 'ha aggiunto' },
  item_used: { emoji: '🍽️', verb: 'ha usato' },
  item_used_before_expiry: { emoji: '🏆', verb: 'ha salvato' },
  item_wasted: { emoji: '🗑️', verb: 'ha sprecato' },
  item_deleted: { emoji: '❌', verb: 'ha rimosso' },
  meal_logged: { emoji: '🍝', verb: 'ha mangiato' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ora'
  if (mins < 60) return `${mins}m fa`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h fa`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ieri'
  return `${days}g fa`
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Array<{
    id: string
    action: string
    item_name: string | null
    item_quantity: number | null
    item_unit: string | null
    xp_earned: number
    created_at: string
    user_name: string
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHouseholdActivity(10).then((data) => {
      setActivities(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 bg-slate-100 rounded" />
          <div className="h-3 w-full bg-slate-50 rounded" />
          <div className="h-3 w-3/4 bg-slate-50 rounded" />
        </div>
      </div>
    )
  }

  if (activities.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
        <Clock className="w-4 h-4 text-slate-400" />
        <h2 className="text-base font-bold text-slate-800">Attività recenti</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {activities.map((a) => {
          const config = ACTION_CONFIG[a.action] || { emoji: '📋', verb: 'ha fatto' }
          const qty = a.item_quantity && a.item_unit
            ? `${a.item_quantity} ${a.item_unit} `
            : ''
          return (
            <div key={a.id} className="flex items-start gap-3 px-5 py-3">
              <span className="text-base mt-0.5">{config.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-800">{a.user_name}</span>{' '}
                  {config.verb} {qty}{a.item_name ? <span className="font-medium">{a.item_name}</span> : ''}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {timeAgo(a.created_at)}
                  {a.xp_earned > 0 && <span className="ml-2 text-olive-600 font-semibold">+{a.xp_earned} XP</span>}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
