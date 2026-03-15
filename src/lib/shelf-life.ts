/**
 * Realistic shelf life estimates for Italian households.
 * Used to set expiry dates when items are added or moved between zones.
 */

export type Zone = 'fridge' | 'freezer' | 'pantry'

interface ShelfLife {
  fridge: number
  freezer: number
  pantry: number
}

// Shelf life in days by food category + zone
// These are conservative but realistic estimates for typical Italian groceries
const CATEGORY_SHELF_LIFE: Record<string, ShelfLife> = {
  Protein:      { fridge: 4,   freezer: 120, pantry: 1   },
  Dairy:        { fridge: 10,  freezer: 60,  pantry: 1   },
  Vegetable:    { fridge: 10,  freezer: 180, pantry: 5   },
  Fruit:        { fridge: 10,  freezer: 180, pantry: 5   },
  Carbohydrate: { fridge: 14,  freezer: 180, pantry: 60  },
  Condiment:    { fridge: 90,  freezer: 365, pantry: 180 },
  General:      { fridge: 14,  freezer: 180, pantry: 30  },
  Frozen:       { fridge: 3,   freezer: 180, pantry: 1   },
}

// Override shelf life for specific items (case-insensitive match)
// These take priority over category-level estimates
const ITEM_SHELF_LIFE: Array<{ keywords: string[]; life: ShelfLife }> = [
  // Fresh meat & fish (short fridge life)
  { keywords: ['pollo', 'chicken', 'petto di pollo', 'cosce'],      life: { fridge: 3,   freezer: 120, pantry: 0 } },
  { keywords: ['manzo', 'beef', 'bistecca', 'vitello'],             life: { fridge: 4,   freezer: 120, pantry: 0 } },
  { keywords: ['maiale', 'pork', 'salsiccia', 'salsicce'],          life: { fridge: 3,   freezer: 90,  pantry: 0 } },
  { keywords: ['pesce', 'fish', 'salmone', 'orata', 'branzino'],    life: { fridge: 2,   freezer: 90,  pantry: 0 } },
  { keywords: ['gamberi', 'shrimp', 'calamari', 'cozze', 'vongole'],life: { fridge: 2,   freezer: 90,  pantry: 0 } },
  { keywords: ['prosciutto', 'salame', 'bresaola', 'speck'],        life: { fridge: 14,  freezer: 60,  pantry: 0 } },

  // Canned / preserved (long pantry life)
  { keywords: ['tonno', 'tuna'],                                     life: { fridge: 5,   freezer: 120, pantry: 730 } },
  { keywords: ['alici', 'acciughe', 'anchov'],                       life: { fridge: 30,  freezer: 120, pantry: 365 } },
  { keywords: ['pelati', 'pomodori pelati', 'passata'],              life: { fridge: 7,   freezer: 180, pantry: 365 } },
  { keywords: ['fagioli', 'ceci', 'lenticchie', 'legumi'],          life: { fridge: 5,   freezer: 180, pantry: 365 } },
  { keywords: ['conserva', 'sottoli', 'sottolio', 'sottaceti'],     life: { fridge: 30,  freezer: 180, pantry: 365 } },

  // Dairy
  { keywords: ['latte', 'milk'],                                     life: { fridge: 7,   freezer: 30,  pantry: 0 } },
  { keywords: ['yogurt'],                                            life: { fridge: 14,  freezer: 30,  pantry: 0 } },
  { keywords: ['burro', 'butter'],                                   life: { fridge: 30,  freezer: 120, pantry: 0 } },
  { keywords: ['mozzarella'],                                        life: { fridge: 7,   freezer: 30,  pantry: 0 } },
  { keywords: ['parmigiano', 'grana', 'pecorino'],                   life: { fridge: 60,  freezer: 180, pantry: 30 } },
  { keywords: ['ricotta'],                                           life: { fridge: 5,   freezer: 30,  pantry: 0 } },
  { keywords: ['formaggio', 'cheese', 'provolone', 'fontina'],      life: { fridge: 21,  freezer: 60,  pantry: 0 } },
  { keywords: ['uova', 'uovo', 'eggs'],                              life: { fridge: 28,  freezer: 120, pantry: 7 } },
  { keywords: ['panna', 'cream'],                                    life: { fridge: 10,  freezer: 60,  pantry: 0 } },

  // Produce
  { keywords: ['insalata', 'lattuga', 'rucola', 'spinaci'],         life: { fridge: 5,   freezer: 30,  pantry: 1 } },
  { keywords: ['pomodoro', 'pomodori', 'tomato'],                    life: { fridge: 7,   freezer: 60,  pantry: 4 } },
  { keywords: ['carota', 'carote'],                                  life: { fridge: 21,  freezer: 180, pantry: 7 } },
  { keywords: ['patata', 'patate', 'potato'],                        life: { fridge: 21,  freezer: 180, pantry: 30 } },
  { keywords: ['cipolla', 'cipolle', 'onion'],                       life: { fridge: 30,  freezer: 180, pantry: 30 } },
  { keywords: ['aglio', 'garlic'],                                   life: { fridge: 30,  freezer: 180, pantry: 60 } },
  { keywords: ['zucchina', 'zucchine'],                              life: { fridge: 7,   freezer: 90,  pantry: 3 } },
  { keywords: ['peperone', 'peperoni', 'pepper'],                    life: { fridge: 10,  freezer: 90,  pantry: 3 } },
  { keywords: ['melanzana', 'melanzane'],                            life: { fridge: 7,   freezer: 90,  pantry: 3 } },
  { keywords: ['fungh', 'mushroom'],                                 life: { fridge: 5,   freezer: 90,  pantry: 1 } },
  { keywords: ['banana', 'banane'],                                  life: { fridge: 7,   freezer: 30,  pantry: 5 } },
  { keywords: ['mela', 'mele', 'apple'],                             life: { fridge: 30,  freezer: 120, pantry: 10 } },
  { keywords: ['arancia', 'arance', 'orange'],                       life: { fridge: 21,  freezer: 90,  pantry: 7 } },
  { keywords: ['limone', 'limoni', 'lemon'],                         life: { fridge: 28,  freezer: 90,  pantry: 7 } },
  { keywords: ['fragola', 'fragole', 'strawberr'],                  life: { fridge: 5,   freezer: 90,  pantry: 1 } },
  { keywords: ['avocado'],                                           life: { fridge: 5,   freezer: 60,  pantry: 4 } },
  { keywords: ['basilico', 'prezzemolo', 'erbe', 'herbs'],          life: { fridge: 7,   freezer: 90,  pantry: 2 } },

  // Carbs
  { keywords: ['pane', 'bread'],                                     life: { fridge: 7,   freezer: 90,  pantry: 3 } },
  { keywords: ['pasta'],                                             life: { fridge: 5,   freezer: 180, pantry: 730 } },
  { keywords: ['riso', 'rice'],                                      life: { fridge: 5,   freezer: 180, pantry: 365 } },
  { keywords: ['farina', 'flour'],                                   life: { fridge: 180, freezer: 365, pantry: 180 } },
  { keywords: ['cereali', 'muesli', 'cornflakes'],                  life: { fridge: 30,  freezer: 180, pantry: 120 } },
  { keywords: ['cracker', 'grissini', 'fette biscottate'],          life: { fridge: 30,  freezer: 180, pantry: 90 } },

  // Condiments & pantry staples
  { keywords: ['olio', 'oil'],                                       life: { fridge: 365, freezer: 365, pantry: 365 } },
  { keywords: ['aceto', 'vinegar'],                                  life: { fridge: 365, freezer: 365, pantry: 365 } },
  { keywords: ['sale', 'salt'],                                      life: { fridge: 365, freezer: 365, pantry: 3650 } },
  { keywords: ['zucchero', 'sugar'],                                 life: { fridge: 365, freezer: 365, pantry: 730 } },
  { keywords: ['miele', 'honey'],                                    life: { fridge: 365, freezer: 365, pantry: 730 } },
  { keywords: ['salsa', 'ketchup', 'maionese', 'mayo', 'senape'],   life: { fridge: 60,  freezer: 180, pantry: 180 } },
  { keywords: ['caffè', 'caffe', 'coffee'],                          life: { fridge: 60,  freezer: 180, pantry: 60 } },
  { keywords: ['tè', 'tea'],                                         life: { fridge: 365, freezer: 365, pantry: 365 } },
  { keywords: ['cioccolat', 'chocolate', 'nutella'],                 life: { fridge: 180, freezer: 365, pantry: 180 } },
  { keywords: ['marmellata', 'jam', 'confettura'],                   life: { fridge: 90,  freezer: 365, pantry: 365 } },
  { keywords: ['biscott', 'cookie'],                                 life: { fridge: 30,  freezer: 90,  pantry: 60 } },

  // Beverages
  { keywords: ['succo', 'juice'],                                    life: { fridge: 7,   freezer: 60,  pantry: 180 } },
  { keywords: ['birra', 'beer'],                                     life: { fridge: 180, freezer: 180, pantry: 180 } },
  { keywords: ['vino', 'wine'],                                      life: { fridge: 5,   freezer: 30,  pantry: 365 } },
  { keywords: ['acqua', 'water'],                                    life: { fridge: 365, freezer: 365, pantry: 365 } },
]

/**
 * Look up shelf life for a specific item name, falling back to category.
 */
export function getShelfLifeDays(itemName: string, category: string, zone: Zone): number {
  const nameLower = itemName.toLowerCase()

  // Try item-specific match first
  for (const entry of ITEM_SHELF_LIFE) {
    for (const kw of entry.keywords) {
      if (nameLower.includes(kw)) {
        return entry.life[zone]
      }
    }
  }

  // Fall back to category
  const catEntry = CATEGORY_SHELF_LIFE[category] || CATEGORY_SHELF_LIFE['General']
  return catEntry[zone]
}

/**
 * Calculate expiry date for an item based on its name, category, and zone.
 */
export function calculateExpiryDate(itemName: string, category: string, zone: Zone): string {
  const days = getShelfLifeDays(itemName, category, zone)
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

/**
 * Determine the default zone for an item based on its category.
 */
export function defaultZone(category: string): Zone {
  const cat = category.toLowerCase()
  if (cat === 'frozen') return 'freezer'
  if (['carbohydrate', 'condiment'].includes(cat)) return 'pantry'
  return 'fridge'
}
