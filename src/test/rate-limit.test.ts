import { describe, it, expect } from 'vitest'
import { rateLimit } from '@/lib/rate-limit'

describe('rateLimit', () => {
  it('allows requests within limit', () => {
    const key = `test-${Date.now()}-allow`
    const result = rateLimit(key, { limit: 5, windowMs: 1000 })
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('blocks requests over limit', () => {
    const key = `test-${Date.now()}-block`
    for (let i = 0; i < 3; i++) {
      rateLimit(key, { limit: 3, windowMs: 10000 })
    }
    const result = rateLimit(key, { limit: 3, windowMs: 10000 })
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('tracks remaining correctly', () => {
    const key = `test-${Date.now()}-remaining`
    expect(rateLimit(key, { limit: 3, windowMs: 10000 }).remaining).toBe(2)
    expect(rateLimit(key, { limit: 3, windowMs: 10000 }).remaining).toBe(1)
    expect(rateLimit(key, { limit: 3, windowMs: 10000 }).remaining).toBe(0)
  })

  it('uses different counters for different keys', () => {
    const key1 = `test-${Date.now()}-a`
    const key2 = `test-${Date.now()}-b`
    rateLimit(key1, { limit: 1, windowMs: 10000 })
    const result = rateLimit(key2, { limit: 1, windowMs: 10000 })
    expect(result.success).toBe(true)
  })
})
