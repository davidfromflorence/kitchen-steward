import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! })

export async function POST(request: Request) {
  const { inventory, budget, days, people } = await request.json()

  const fridgeList = (inventory || [])
    .map((i: { name: string; quantity: number; unit: string; expiry_date: string | null }) => {
      const exp = i.expiry_date ? ` (scade: ${i.expiry_date})` : ''
      return `- ${i.quantity} ${i.unit} ${i.name}${exp}`
    })
    .join('\n') || 'Frigo vuoto'

  const prompt = `Sei un assistente della spesa italiano esperto. La famiglia ha ${people} persone e deve pianificare ${days} giorni di pasti con un budget di €${budget}.

CONTENUTO FRIGO ATTUALE:
${fridgeList}

COMPITO: genera una lista della spesa SMART che:
1. Completa ciò che manca per preparare pasti equilibrati per ${days} giorni
2. Sfrutta al massimo ciò che è già nel frigo
3. NON include ciò che c'è già in quantità sufficiente
4. Stima il prezzo di ogni prodotto (prezzi italiani realistici da supermercato)
5. Resta entro il budget di €${budget}
6. Raggruppa per REPARTO del supermercato (come li troveresti al negozio)

REPARTI da usare (esattamente questi nomi):
- Frutta e Verdura
- Macelleria e Pescheria
- Latticini e Uova
- Pane e Panetteria
- Pasta, Riso e Cereali
- Scatolame e Conserve
- Surgelati
- Bevande
- Condimenti e Spezie
- Snack e Dolci

Per ogni prodotto indica: nome, quantità suggerita, prezzo stimato.

Rispondi SOLO con JSON valido:
{
  "aisles": [
    {
      "name": "Frutta e Verdura",
      "emoji": "🥬",
      "items": [
        {"name": "Zucchine", "qty": "500g", "price": 1.50, "reason": "Per frittata e contorni"}
      ]
    }
  ],
  "total_estimated": 45.50,
  "meals_enabled": ["Pasta al pomodoro", "Frittata di verdure", "Insalata di riso"],
  "savings_tip": "Comprando questi ingredienti eviti di sprecare le zucchine e i pomodori che scadono tra 2 giorni"
}

Solo JSON, no markdown, no backtick.`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })

    const raw = response.text?.replace(/```json\n?|\n?```/g, '').trim() || '{}'
    const data = JSON.parse(raw)
    return NextResponse.json(data)
  } catch (error) {
    console.error('AI shopping error:', error)
    return NextResponse.json({ error: 'Failed to generate shopping list' }, { status: 500 })
  }
}
