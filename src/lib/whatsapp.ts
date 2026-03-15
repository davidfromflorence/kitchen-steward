/**
 * WhatsApp / Twilio helper utilities for Kitchen Steward.
 */

// ---------------------------------------------------------------------------
// Phone number helpers
// ---------------------------------------------------------------------------

/** Strip the "whatsapp:" prefix that Twilio adds to the From field. */
export function parseWhatsAppNumber(from: string): string {
  return from.replace(/^whatsapp:/, '')
}

// ---------------------------------------------------------------------------
// TwiML helpers
// ---------------------------------------------------------------------------

/** Wrap a plain-text reply in a Twilio MessagingResponse XML envelope. */
export function buildTwiMLResponse(message: string): string {
  // Escape XML special characters in the message body
  const escaped = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Response><Message>${escaped}</Message></Response>`
}

// ---------------------------------------------------------------------------
// Formatting helpers (Italian, WhatsApp-friendly)
// ---------------------------------------------------------------------------

interface InventoryItem {
  name: string
  quantity: number
  unit: string
  category?: string
  expiry_date?: string | null
}

/** Format a list of inventory items for display in WhatsApp. */
export function formatInventoryList(items: InventoryItem[]): string {
  if (items.length === 0) {
    return 'Il tuo frigo è vuoto! �っぽ\nAggiungi qualcosa scrivendomi la lista della spesa.'
  }

  const categoryEmojis: Record<string, string> = {
    Protein: '🥩',
    Vegetable: '🥬',
    Fruit: '🍎',
    Dairy: '🧀',
    Carbohydrate: '🍞',
    Condiment: '🧂',
    General: '📦',
  }

  const grouped: Record<string, string[]> = {}

  for (const item of items) {
    const cat = item.category || 'General'
    if (!grouped[cat]) grouped[cat] = []

    let line = `  • ${item.quantity} ${item.unit} ${item.name}`
    if (item.expiry_date) {
      const days = Math.ceil(
        (new Date(item.expiry_date).getTime() - Date.now()) / 86_400_000
      )
      if (days <= 0) {
        line += ' ⚠️ SCADUTO'
      } else if (days <= 2) {
        line += ` ⚠️ scade tra ${days}g`
      } else {
        line += ` (${days}g)`
      }
    }
    grouped[cat].push(line)
  }

  const sections = Object.entries(grouped).map(([cat, lines]) => {
    const emoji = categoryEmojis[cat] || '📦'
    return `${emoji} *${cat}*\n${lines.join('\n')}`
  })

  return `🧊 *Il tuo frigo*\n\n${sections.join('\n\n')}`
}

interface AddedItem {
  name: string
  qty: number
  unit: string
  estimated_expiry_days?: number
}

/** Format a confirmation message for newly added items. */
export function formatAddedItems(items: AddedItem[]): string {
  if (items.length === 0) {
    return 'Non sono riuscito a riconoscere nessun prodotto. Riprova!'
  }

  const lines = items.map((i) => {
    let line = `  ✅ ${i.qty} ${i.unit} ${i.name}`
    if (i.estimated_expiry_days) {
      line += ` (scade tra ${i.estimated_expiry_days} giorni)`
    }
    return line
  })

  return `Ho aggiunto al tuo frigo:\n${lines.join('\n')}`
}
