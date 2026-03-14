import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! })

export async function POST(request: Request) {
  const { text, audioBase64, mimeType } = await request.json()

  const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = []

  if (audioBase64 && mimeType) {
    parts.push({ inlineData: { data: audioBase64, mimeType } })
  }

  const prompt = `You are a kitchen inventory assistant. Extract grocery items from the following input.
Return ONLY a JSON array of objects with these fields:
- action: "add" or "remove"
- name: item name in Italian
- qty: number
- unit: one of "pz", "kg", "g", "litri", "ml", "scatole"
- estimated_expiry_days: integer
- category: one of "Protein", "Vegetable", "Fruit", "Dairy", "Carbohydrate", "Condiment", "General"

Input: ${text || '(see audio)'}

Return ONLY valid JSON, no markdown.`

  parts.push({ text: prompt })

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts }],
    })

    const raw = response.text?.replace(/```json\n?|\n?```/g, '').trim() || '[]'
    const items = JSON.parse(raw)

    return NextResponse.json({ items })
  } catch (error) {
    console.error('AI extract error:', error)
    return NextResponse.json({ error: 'Failed to extract items' }, { status: 500 })
  }
}
