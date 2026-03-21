'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { loadGamification, saveGamification } from '@/app/actions/gamification'

/* ── Types ────────────────────────────────────────────── */

interface GamificationState {
  totalXP: number
  streak: number
  lastLoginDate: string
  completedActions: string[]
  savedItems: string[]
}

interface GamificationContextValue {
  totalXP: number
  streak: number
  lastLoginDate: string
  completedActions: string[]
  savedItems: string[]
  level: number
  xpToNextLevel: number
  progressPercent: number
  awardXP: (event: string, xp: number, dedupeKey?: string) => boolean
  hasCompleted: (dedupeKey: string) => boolean
  toggleSaved: (key: string) => void
  isSaved: (key: string) => boolean
}

/* ── Constants ────────────────────────────────────────── */

const STORAGE_KEY = 'ks-gamification'
const XP_PER_LEVEL = 100

const defaultState: GamificationState = {
  totalXP: 0,
  streak: 0,
  lastLoginDate: '',
  completedActions: [],
  savedItems: [],
}

/* ── Helpers ──────────────────────────────────────────── */

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

function loadState(): GamificationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        totalXP: parsed.totalXP ?? 0,
        streak: parsed.streak ?? 0,
        lastLoginDate: parsed.lastLoginDate ?? '',
        completedActions: Array.isArray(parsed.completedActions) ? parsed.completedActions : [],
        savedItems: Array.isArray(parsed.savedItems) ? parsed.savedItems : [],
      }
    }
  } catch {
    // corrupted data — start fresh
  }
  return { ...defaultState }
}

function saveState(state: GamificationState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

/** One-time migration from old localStorage keys */
function migrateOldData(state: GamificationState): GamificationState {
  let migrated = false
  const next = { ...state, completedActions: [...state.completedActions] }

  try {
    const oldScore = localStorage.getItem('ks-knowledge-score')
    const oldFacts = localStorage.getItem('ks-read-facts')
    const oldCards = localStorage.getItem('ks-read-cards')

    if (oldScore) {
      next.totalXP += parseInt(oldScore, 10) || 0
      migrated = true
    }

    if (oldFacts) {
      const ids: number[] = JSON.parse(oldFacts)
      for (const id of ids) {
        const key = `fact_read:${id}`
        if (!next.completedActions.includes(key)) {
          next.completedActions.push(key)
        }
      }
      migrated = true
    }

    if (oldCards) {
      const ids: number[] = JSON.parse(oldCards)
      for (const id of ids) {
        const key = `card_read:${id}`
        if (!next.completedActions.includes(key)) {
          next.completedActions.push(key)
        }
      }
      migrated = true
    }

    if (migrated) {
      localStorage.removeItem('ks-knowledge-score')
      localStorage.removeItem('ks-read-facts')
      localStorage.removeItem('ks-read-cards')
    }
  } catch {
    // migration failed — not critical
  }

  return migrated ? next : state
}

/** Check daily login and update streak */
function processDailyLogin(state: GamificationState): GamificationState {
  const today = todayString()
  if (state.lastLoginDate === today) return state

  const next = { ...state, completedActions: [...state.completedActions] }
  next.lastLoginDate = today

  // Calculate streak
  if (state.lastLoginDate) {
    const lastDate = new Date(state.lastLoginDate + 'T00:00:00')
    const todayDate = new Date(today + 'T00:00:00')
    const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      next.streak = state.streak + 1
    } else if (diffDays > 1) {
      next.streak = 1
    }
  } else {
    next.streak = 1
  }

  // Award daily login XP
  const loginKey = `daily_login:${today}`
  if (!next.completedActions.includes(loginKey)) {
    next.completedActions.push(loginKey)
    next.totalXP += 10
  }

  return next
}

/* ── Context ──────────────────────────────────────────── */

const GamificationContext = createContext<GamificationContextValue | null>(null)

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GamificationState>(defaultState)
  const [mounted, setMounted] = useState(false)
  const dbSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced save to Supabase
  const syncToDB = useCallback((s: GamificationState) => {
    if (dbSaveTimer.current) clearTimeout(dbSaveTimer.current)
    dbSaveTimer.current = setTimeout(() => {
      saveGamification({
        totalXP: s.totalXP,
        streak: s.streak,
        lastLoginDate: s.lastLoginDate,
        completedActions: s.completedActions,
        savedItems: s.savedItems,
      }).catch(() => {}) // silent fail — localStorage is the fallback
    }, 3000)
  }, [])

  // Initialize on mount: load from localStorage, then merge with DB
  useEffect(() => {
    let current = loadState()
    current = migrateOldData(current)
    current = processDailyLogin(current)
    saveState(current)
    setState(current)
    setMounted(true)

    // Async: load from DB and merge (DB wins if it has more XP)
    loadGamification().then((dbState) => {
      if (!dbState) {
        // No DB record yet — save current local state to DB
        syncToDB(current)
        return
      }
      // Merge: take the higher XP, union of completed actions and saved items
      const merged: GamificationState = {
        totalXP: Math.max(current.totalXP, dbState.totalXP),
        streak: Math.max(current.streak, dbState.streak),
        lastLoginDate: current.lastLoginDate || dbState.lastLoginDate,
        completedActions: [...new Set([...current.completedActions, ...dbState.completedActions])],
        savedItems: [...new Set([...current.savedItems, ...dbState.savedItems])],
      }
      saveState(merged)
      setState(merged)
      syncToDB(merged)
    }).catch(() => {}) // DB unavailable — localStorage only
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const awardXP = useCallback(
    (event: string, xp: number, dedupeKey?: string): boolean => {
      let awarded = false

      setState((prev) => {
        if (dedupeKey && prev.completedActions.includes(dedupeKey)) {
          return prev
        }

        const next: GamificationState = {
          ...prev,
          totalXP: prev.totalXP + xp,
          completedActions: dedupeKey
            ? [...prev.completedActions, dedupeKey]
            : prev.completedActions,
        }
        saveState(next)
        syncToDB(next)
        awarded = true
        return next
      })

      return awarded
    },
    [syncToDB],
  )

  const hasCompleted = useCallback(
    (dedupeKey: string): boolean => {
      return state.completedActions.includes(dedupeKey)
    },
    [state.completedActions],
  )

  const toggleSaved = useCallback(
    (key: string) => {
      setState((prev) => {
        const next = { ...prev }
        if (prev.savedItems.includes(key)) {
          next.savedItems = prev.savedItems.filter((k) => k !== key)
        } else {
          next.savedItems = [...prev.savedItems, key]
        }
        saveState(next)
        syncToDB(next)
        return next
      })
    },
    [syncToDB],
  )

  const isSaved = useCallback(
    (key: string): boolean => {
      return state.savedItems.includes(key)
    },
    [state.savedItems],
  )

  // Compute derived values — return zeros until mounted to avoid hydration mismatch
  const totalXP = mounted ? state.totalXP : 0
  const level = Math.floor(totalXP / XP_PER_LEVEL) + 1
  const xpToNextLevel = XP_PER_LEVEL - (totalXP % XP_PER_LEVEL)
  const progressPercent = totalXP % XP_PER_LEVEL

  const value: GamificationContextValue = {
    totalXP,
    streak: mounted ? state.streak : 0,
    lastLoginDate: mounted ? state.lastLoginDate : '',
    completedActions: mounted ? state.completedActions : [],
    savedItems: mounted ? state.savedItems : [],
    level,
    xpToNextLevel,
    progressPercent,
    awardXP,
    hasCompleted,
    toggleSaved,
    isSaved,
  }

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  )
}

export function useGamification(): GamificationContextValue {
  const ctx = useContext(GamificationContext)
  if (!ctx) {
    throw new Error('useGamification must be used within a GamificationProvider')
  }
  return ctx
}
