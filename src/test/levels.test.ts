import { describe, it, expect } from 'vitest'
import { getLevelInfo, LEVELS } from '@/lib/levels'

describe('getLevelInfo', () => {
  it('returns Principiante at 0 XP', () => {
    const info = getLevelInfo(0)
    expect(info.current.name).toBe('Principiante')
    expect(info.current.level).toBe(1)
    expect(info.next?.name).toBe('Apprendista')
  })

  it('returns Apprendista at 100 XP', () => {
    const info = getLevelInfo(100)
    expect(info.current.name).toBe('Apprendista')
    expect(info.next?.name).toBe('Cuoco Attento')
  })

  it('returns Apprendista at 150 XP with 50% progress', () => {
    const info = getLevelInfo(150)
    expect(info.current.name).toBe('Apprendista')
    expect(info.xpInLevel).toBe(50)
    expect(info.xpForLevel).toBe(100)
    expect(info.progressPercent).toBe(50)
  })

  it('returns Kitchen Steward at 3000+ XP with no next level', () => {
    const info = getLevelInfo(5000)
    expect(info.current.name).toBe('Kitchen Steward')
    expect(info.next).toBeNull()
    expect(info.progressPercent).toBe(100)
  })

  it('handles exact level boundaries', () => {
    for (const level of LEVELS) {
      const info = getLevelInfo(level.minXP)
      expect(info.current.level).toBe(level.level)
    }
  })

  it('returns correct progress at boundary - 1', () => {
    const info = getLevelInfo(99)
    expect(info.current.name).toBe('Principiante')
    expect(info.xpInLevel).toBe(99)
  })
})
