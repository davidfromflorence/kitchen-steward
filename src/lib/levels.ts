export interface LevelInfo {
  level: number
  name: string
  emoji: string
  description: string
  minXP: number
}

export const LEVELS: LevelInfo[] = [
  { level: 1, name: 'Principiante', emoji: '🌱', description: 'Hai appena iniziato il tuo percorso anti-spreco', minXP: 0 },
  { level: 2, name: 'Apprendista', emoji: '🌿', description: 'Stai imparando a gestire il frigo', minXP: 100 },
  { level: 3, name: 'Cuoco Attento', emoji: '🍳', description: 'Sai cosa hai e cosa cucinare', minXP: 200 },
  { level: 4, name: 'Risparmiatore', emoji: '💰', description: 'Stai risparmiando cibo e denaro', minXP: 300 },
  { level: 5, name: 'Eco Warrior', emoji: '🌍', description: 'Il pianeta ti ringrazia', minXP: 500 },
  { level: 6, name: 'Chef Sostenibile', emoji: '👨‍🍳', description: 'Cucini con intelligenza e zero sprechi', minXP: 750 },
  { level: 7, name: 'Maestro del Frigo', emoji: '🏆', description: 'Nulla scade sotto la tua supervisione', minXP: 1000 },
  { level: 8, name: 'Guardiano del Cibo', emoji: '🛡️', description: 'La tua famiglia mangia meglio grazie a te', minXP: 1500 },
  { level: 9, name: 'Leggenda Anti-Spreco', emoji: '⭐', description: 'Sei un esempio per tutti', minXP: 2000 },
  { level: 10, name: 'Kitchen Steward', emoji: '👑', description: 'Hai raggiunto il livello massimo!', minXP: 3000 },
]

export const XP_ACTIONS = [
  { action: 'Login giornaliero', xp: 10, emoji: '📅' },
  { action: 'Usa un prodotto', xp: 5, emoji: '🍽️' },
  { action: 'Usa prima della scadenza', xp: 15, emoji: '🏆' },
  { action: 'Registra un pasto', xp: 10, emoji: '🍝' },
  { action: 'Quiz corretto', xp: 20, emoji: '🧠' },
  { action: 'Leggi una flashcard', xp: 5, emoji: '📖' },
  { action: 'Scopri un fatto', xp: 5, emoji: '💡' },
]

export function getLevelInfo(totalXP: number): {
  current: LevelInfo
  next: LevelInfo | null
  xpInLevel: number
  xpForLevel: number
  progressPercent: number
} {
  let current = LEVELS[0]
  let next: LevelInfo | null = LEVELS[1]

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].minXP) {
      current = LEVELS[i]
      next = i < LEVELS.length - 1 ? LEVELS[i + 1] : null
      break
    }
  }

  const xpInLevel = totalXP - current.minXP
  const xpForLevel = next ? next.minXP - current.minXP : 1
  const progressPercent = next ? Math.min((xpInLevel / xpForLevel) * 100, 100) : 100

  return { current, next, xpInLevel, xpForLevel, progressPercent }
}
