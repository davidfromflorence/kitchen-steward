import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! })

export async function POST(request: Request) {
  const { ingredients, params } = await request.json()

  const cookingTime = params?.cookingTime || 'any'
  const ingredientCount = params?.ingredientCount || '5'
  const servings = params?.servings || '2'
  const diets = params?.diets || []

  const timeConstraint = cookingTime !== 'any' ? `Tempo massimo: ${cookingTime} minuti.` : ''
  const dietConstraint = diets.length > 0 ? `Dieta: ${diets.join(', ')}.` : ''

  const prompt = `Sei uno chef anti-spreco italiano. Dati questi ingredienti (con giorni alla scadenza), suggerisci 3 ricette DIVERSE che usino prioritariamente quelli in scadenza.

Ingredienti disponibili:
${ingredients.map((i: { name: string; daysLeft: number }) => `- ${i.name} (${i.daysLeft} giorni)`).join('\n')}

Parametri:
- Porzioni: ${servings}
- Max ingredienti per ricetta: ${ingredientCount}
${timeConstraint}
${dietConstraint}

Le 3 ricette devono essere diverse per tipo (es: un primo, un secondo, uno sfizioso) e difficoltà.

IMPORTANTE per i passaggi di preparazione (quick_steps):
- Scrivi ogni step come se l'utente non avesse esperienza in cucina.
- Specifica temperature esatte del fornello/forno, tempi precisi, e segnali visivi (es. "quando i bordi diventano dorati").
- Indica quantità precise (es. "2 cucchiai di olio extravergine", non "un filo d'olio").
- Numera ogni step chiaramente.

Per ogni ricetta, includi 1-2 link a risorse esterne REALI e pertinenti (YouTube italiano, GialloZafferano, Fatto in Casa da Benedetta, etc.) che mostrino tecniche simili o la stessa ricetta. I link devono essere URL reali e verificabili a pagine che esistono davvero su quei siti.

Rispondi SOLO con un JSON valido:
{
  "recipes": [
    {
      "title": "Nome ricetta in italiano",
      "emoji": "🍝",
      "description": "Una frase che descrive il piatto e perché è anti-spreco",
      "prep_time_minutes": 20,
      "difficulty": "Facile|Media|Avanzata",
      "ingredients": ["200g pasta", "2 uova", "100g pancetta"],
      "quick_steps": ["1. Descrizione dettagliata con tempi e quantità precise", "2. ..."],
      "eco_impact_kg": 0.8,
      "zero_waste_reason": "Usa le uova che scadono domani",
      "useful_links": [
        {"label": "Video tutorial", "url": "https://..."},
        {"label": "Ricetta completa", "url": "https://..."}
      ]
    }
  ]
}

3 ricette. JSON valido, no markdown, no backtick.`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })

    const raw = response.text?.replace(/```json\n?|\n?```/g, '').trim() || '{}'
    const data = JSON.parse(raw)

    return NextResponse.json(data)
  } catch (error) {
    console.error('AI recipe error:', error)
    return NextResponse.json({ error: 'Failed to generate recipes' }, { status: 500 })
  }
}
