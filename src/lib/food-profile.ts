export interface FoodProfile {
  weight: number | null        // kg
  portionSize: PortionSize     // how much you typically eat
  activityLevel: ActivityLevel
  dietNotes: string            // free-text: allergies, preferences, habits
}

export type PortionSize = 'piccola' | 'normale' | 'grande' | 'abbondante'
export type ActivityLevel = 'sedentario' | 'moderato' | 'attivo' | 'molto_attivo'

export const PORTION_LABELS: Record<PortionSize, string> = {
  piccola: 'Mangio poco',
  normale: 'Porzioni normali',
  grande: 'Mangio tanto',
  abbondante: 'Mangio tantissimo',
}

export const PORTION_EMOJI: Record<PortionSize, string> = {
  piccola: '🍽️',
  normale: '🍛',
  grande: '🍝',
  abbondante: '🥘',
}

export const PORTION_MULTIPLIER: Record<PortionSize, number> = {
  piccola: 0.65,
  normale: 1.0,
  grande: 1.35,
  abbondante: 1.7,
}

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentario: 'Sedentario',
  moderato: 'Moderato',
  attivo: 'Attivo',
  molto_attivo: 'Molto attivo',
}

export const ACTIVITY_EMOJI: Record<ActivityLevel, string> = {
  sedentario: '🛋️',
  moderato: '🚶',
  attivo: '🏃',
  molto_attivo: '💪',
}

export const DEFAULT_PROFILE: FoodProfile = {
  weight: null,
  portionSize: 'normale',
  activityLevel: 'moderato',
  dietNotes: '',
}

const STORAGE_KEY = 'ks-food-profile'

export function loadFoodProfile(): FoodProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        weight: parsed.weight ?? null,
        portionSize: parsed.portionSize ?? 'normale',
        activityLevel: parsed.activityLevel ?? 'moderato',
        dietNotes: parsed.dietNotes ?? '',
      }
    }
  } catch {
    // corrupted
  }
  return { ...DEFAULT_PROFILE }
}

export function saveFoodProfile(profile: FoodProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

/** Build a text description for the AI prompt */
export function profileToPromptText(profile: FoodProfile): string {
  const parts: string[] = []

  const multiplier = PORTION_MULTIPLIER[profile.portionSize]
  if (multiplier !== 1) {
    parts.push(`Porzione abituale: ${PORTION_LABELS[profile.portionSize].toLowerCase()} (moltiplicatore ${multiplier}x rispetto a porzione standard)`)
  }

  if (profile.weight) {
    parts.push(`Peso: ${profile.weight}kg`)
  }

  parts.push(`Attività: ${ACTIVITY_LABELS[profile.activityLevel].toLowerCase()}`)

  if (profile.dietNotes.trim()) {
    parts.push(`Note: ${profile.dietNotes.trim()}`)
  }

  return parts.join('. ')
}
