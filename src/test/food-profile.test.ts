import { describe, it, expect } from 'vitest'
import {
  PORTION_MULTIPLIER,
  profileToPromptText,
  DEFAULT_PROFILE,
  type FoodProfile,
} from '@/lib/food-profile'

describe('PORTION_MULTIPLIER', () => {
  it('piccola is less than 1', () => {
    expect(PORTION_MULTIPLIER.piccola).toBeLessThan(1)
  })

  it('normale is exactly 1', () => {
    expect(PORTION_MULTIPLIER.normale).toBe(1)
  })

  it('grande is more than 1', () => {
    expect(PORTION_MULTIPLIER.grande).toBeGreaterThan(1)
  })

  it('abbondante is more than grande', () => {
    expect(PORTION_MULTIPLIER.abbondante).toBeGreaterThan(PORTION_MULTIPLIER.grande)
  })
})

describe('profileToPromptText', () => {
  it('returns minimal text for default profile', () => {
    const text = profileToPromptText(DEFAULT_PROFILE)
    expect(text).toContain('moderato')
    expect(text).not.toContain('moltiplicatore')
  })

  it('includes multiplier for non-normal portion', () => {
    const profile: FoodProfile = { ...DEFAULT_PROFILE, portionSize: 'piccola' }
    const text = profileToPromptText(profile)
    expect(text).toContain('0.65')
  })

  it('includes weight when set', () => {
    const profile: FoodProfile = { ...DEFAULT_PROFILE, weight: 75 }
    const text = profileToPromptText(profile)
    expect(text).toContain('75kg')
  })

  it('includes diet notes when set', () => {
    const profile: FoodProfile = { ...DEFAULT_PROFILE, dietNotes: 'intollerante al lattosio' }
    const text = profileToPromptText(profile)
    expect(text).toContain('intollerante al lattosio')
  })
})
