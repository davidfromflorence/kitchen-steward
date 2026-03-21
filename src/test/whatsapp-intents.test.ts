import { describe, it, expect } from 'vitest'

// Extract the intent detection function for testing
// We'll replicate it here since it's not exported
type FastIntent =
  | { type: 'greeting' }
  | { type: 'show_fridge' }
  | { type: 'show_expiring' }
  | { type: 'show_shopping' }
  | { type: 'help' }
  | { type: 'delete'; item: string }
  | { type: 'ate_out' }
  | { type: 'ai_needed' }

function detectFastIntent(msg: string): FastIntent {
  const l = msg.toLowerCase().trim()

  if (['ciao', 'hey', 'hi', 'hello', 'buongiorno', 'buonasera', 'salve', 'ehi'].includes(l)) {
    return { type: 'greeting' }
  }

  if (/^[1-3]$/.test(l)) return { type: 'ai_needed' }

  if (['lista', 'frigo', 'fridge'].includes(l)) return { type: 'show_fridge' }
  if (['scadenze', 'scade', 'expiring'].includes(l)) return { type: 'show_expiring' }
  if (['spesa', 'shopping', 'lista spesa'].includes(l)) return { type: 'show_shopping' }
  if (['aiuto', 'help', '?'].includes(l)) return { type: 'help' }

  if (/mangiato?\s+fuori|ho\s+(pranzato|cenato)\s+fuori|(siamo|sono)\s+\w*\s*(andat[oi]|uscit[oi]).*mangiare|ristorante|pizzeria|mangiato?\s+(al|in)\s+/i.test(l)) {
    return { type: 'ate_out' }
  }
  if (['fuori', 'mangiato fuori', 'ho mangiato fuori', 'pranzato fuori', 'cenato fuori'].includes(l)) {
    return { type: 'ate_out' }
  }

  if (/cosa (c'è|c'e|abbiamo|hai|c è).*frig/i.test(l)) return { type: 'show_fridge' }
  if (/mostr.*frig|fammi.*frig|vedi.*frig|apri.*frig/i.test(l)) return { type: 'show_fridge' }
  if (/cosa.*scad|sta.*per.*scad|scadenz/i.test(l)) return { type: 'show_expiring' }
  if (/elimina\s+(.+)/i.test(l)) return { type: 'delete', item: l.replace(/elimina\s+/i, '').trim() }
  if (/togli\s+(.+)/i.test(l)) return { type: 'delete', item: l.replace(/togli\s+/i, '').trim() }
  if (/rimuovi\s+(.+)/i.test(l)) return { type: 'delete', item: l.replace(/rimuovi\s+/i, '').trim() }
  if (/finit[oa]\s+(il |la |lo |l'|i |le |gli )?(.+)/i.test(l)) {
    const m = l.match(/finit[oa]\s+(?:il |la |lo |l'|i |le |gli )?(.+)/i)
    return { type: 'delete', item: m?.[1]?.trim() || '' }
  }

  return { type: 'ai_needed' }
}

describe('WhatsApp intent detection', () => {
  describe('greetings', () => {
    it.each(['ciao', 'hey', 'hi', 'hello', 'buongiorno', 'buonasera', 'salve', 'ehi'])(
      '"%s" → greeting',
      (msg) => expect(detectFastIntent(msg).type).toBe('greeting')
    )
  })

  describe('show fridge', () => {
    it.each([
      'frigo',
      'lista',
      "cosa c'è nel frigo",
      "cosa c'è nel frigo?",
      'cosa abbiamo nel frigo',
      'mostrami il frigo',
      'fammi vedere il frigo',
      'apri il frigo',
    ])('"%s" → show_fridge', (msg) => {
      expect(detectFastIntent(msg).type).toBe('show_fridge')
    })
  })

  describe('expiring', () => {
    it.each([
      'scadenze',
      'scade',
      'cosa scade',
      'cosa sta per scadere',
      'scadenze?',
    ])('"%s" → show_expiring', (msg) => {
      expect(detectFastIntent(msg).type).toBe('show_expiring')
    })
  })

  describe('shopping', () => {
    it.each(['spesa', 'shopping', 'lista spesa'])(
      '"%s" → show_shopping',
      (msg) => expect(detectFastIntent(msg).type).toBe('show_shopping')
    )
  })

  describe('help', () => {
    it.each(['aiuto', 'help', '?'])(
      '"%s" → help',
      (msg) => expect(detectFastIntent(msg).type).toBe('help')
    )
  })

  describe('delete', () => {
    it('elimina latte', () => {
      const intent = detectFastIntent('elimina latte')
      expect(intent.type).toBe('delete')
      if (intent.type === 'delete') expect(intent.item).toBe('latte')
    })

    it('togli il pane', () => {
      const intent = detectFastIntent('togli il pane')
      expect(intent.type).toBe('delete')
      if (intent.type === 'delete') expect(intent.item).toBe('il pane')
    })

    it('finito il latte', () => {
      const intent = detectFastIntent('finito il latte')
      expect(intent.type).toBe('delete')
      if (intent.type === 'delete') expect(intent.item).toBe('latte')
    })

    it('finita la mozzarella', () => {
      const intent = detectFastIntent('finita la mozzarella')
      expect(intent.type).toBe('delete')
      if (intent.type === 'delete') expect(intent.item).toBe('mozzarella')
    })

    it('rimuovi uova', () => {
      const intent = detectFastIntent('rimuovi uova')
      expect(intent.type).toBe('delete')
      if (intent.type === 'delete') expect(intent.item).toBe('uova')
    })
  })

  describe('ate out', () => {
    it.each([
      'ho mangiato fuori',
      'mangiato fuori',
      'fuori',
      'pranzato fuori',
      'cenato fuori',
      'ho pranzato fuori',
      'ho cenato fuori',
      'siamo andati a mangiare fuori',
      'ristorante',
      'pizzeria',
    ])('"%s" → ate_out', (msg) => {
      expect(detectFastIntent(msg).type).toBe('ate_out')
    })
  })

  describe('numbered replies go to AI', () => {
    it.each(['1', '2', '3'])(
      '"%s" → ai_needed (needs conversation context)',
      (msg) => expect(detectFastIntent(msg).type).toBe('ai_needed')
    )
  })

  describe('complex messages go to AI', () => {
    it.each([
      'ho mangiato pasta al pesto',
      'cosa cucino stasera?',
      'suggeriscimi una ricetta',
      'ho comprato pollo e uova',
      'pianifica i pasti della settimana',
    ])('"%s" → ai_needed', (msg) => {
      expect(detectFastIntent(msg).type).toBe('ai_needed')
    })
  })
})
