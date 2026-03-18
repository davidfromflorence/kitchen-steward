import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! })

export async function POST(request: Request) {
  const { receipt, shoppingList } = await request.json()

  const prompt = `L'utente aveva una lista della spesa e ha comprato dei prodotti. Confronta lo scontrino con la lista.

LISTA DELLA SPESA (cosa doveva comprare):
${(shoppingList as string[]).map((n: string) => `- ${n}`).join('\n')}

COSA HA COMPRATO (dallo scontrino/testo):
${receipt}

COMPITO: per ogni prodotto nella lista della spesa, determina se è stato comprato o no. Usa matching intelligente:
- "Latte UHT Conad" nello scontrino corrisponde a "Latte" nella lista
- "Mozzarella di bufala" corrisponde a "Mozzarella"
- Ignora prodotti nello scontrino che NON erano nella lista

Rispondi SOLO con JSON:
{
  "matched": ["nome esatto dalla lista che è stato comprato", ...],
  "missing": ["nome esatto dalla lista che manca", ...],
  "message": "Messaggio breve e simpatico in italiano. Se ha preso tutto: 'Perfetto, hai preso tutto! 🎉'. Se manca qualcosa: 'Quasi tutto! Ti manca solo...' o 'Hai dimenticato qualcosa 😅'"
}

Solo JSON, no markdown.`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })

    const raw = response.text?.replace(/```json\n?|\n?```/g, '').trim() || '{}'
    const data = JSON.parse(raw)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Receipt check error:', error)
    return NextResponse.json(
      { matched: [], missing: shoppingList, message: 'Errore nella verifica.' },
      { status: 500 }
    )
  }
}
