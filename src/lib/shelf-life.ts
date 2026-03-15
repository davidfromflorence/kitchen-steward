/**
 * Estimated shelf life in days by food category and storage zone.
 * Used to auto-adjust expiry dates when items are moved between zones.
 */

type Zone = 'fridge' | 'freezer' | 'pantry'

// Days of shelf life per category per zone
const SHELF_LIFE: Record<string, Record<Zone, number>> = {
  // Proteins
  Protein: { fridge: 3, freezer: 90, pantry: 1 },
  // Dairy
  Dairy: { fridge: 7, freezer: 60, pantry: 1 },
  // Vegetables
  Vegetable: { fridge: 7, freezer: 120, pantry: 3 },
  // Fruits
  Fruit: { fridge: 7, freezer: 120, pantry: 4 },
  // Carbs (bread, pasta, rice)
  Carbohydrate: { fridge: 7, freezer: 180, pantry: 30 },
  // Condiments (oils, sauces, spices)
  Condiment: { fridge: 60, freezer: 180, pantry: 90 },
  // General / unknown
  General: { fridge: 7, freezer: 90, pantry: 14 },
  // Frozen items
  Frozen: { fridge: 3, freezer: 180, pantry: 1 },
}

/**
 * Get the estimated shelf life in days for a category in a zone.
 */
export function getShelfLifeDays(category: string, zone: Zone): number {
  const entry = SHELF_LIFE[category] || SHELF_LIFE['General']
  return entry[zone]
}

/**
 * Calculate a new expiry date based on category and target zone.
 * Starts from today.
 */
export function calculateExpiryDate(category: string, zone: Zone): string {
  const days = getShelfLifeDays(category, zone)
  const date = new Date(Date.now() + days * 86_400_000)
  return date.toISOString().split('T')[0]
}

/**
 * Map a kitchen zone name to the Zone type.
 */
export function normalizeZone(zone: string): Zone {
  const l = zone.toLowerCase()
  if (l === 'freezer') return 'freezer'
  if (l === 'pantry') return 'pantry'
  return 'fridge'
}
