import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! })

export async function POST(request: Request) {
  const { text, audioBase64, imageBase64, mimeType } = await request.json()

  const parts: Array<
    { text: string } | { inlineData: { data: string; mimeType: string } }
  > = []

  // Attach audio or image if provided
  if (audioBase64 && mimeType) {
    parts.push({ inlineData: { data: audioBase64, mimeType } })
  }
  if (imageBase64 && mimeType) {
    parts.push({ inlineData: { data: imageBase64, mimeType } })
  }

  const isReceipt = !!imageBase64

  const prompt = isReceipt
    ? `You are a kitchen inventory assistant. Analyze this receipt/photo and extract all grocery items purchased.
For each item, estimate how many days until it expires based on typical shelf life.
Return ONLY a JSON array of objects with these fields:
- action: "add"
- name: item name (in the language visible on the receipt, or Italian if unclear)
- qty: number (quantity purchased)
- unit: one of "pz", "kg", "g", "litri", "ml", "scatole"
- estimated_expiry_days: integer (estimate based on typical shelf life for this product)
- category: one of "Protein", "Vegetable", "Fruit", "Dairy", "Carbohydrate", "Condiment", "General"

Return ONLY valid JSON, no markdown.`
    : `You are a kitchen inventory assistant. Extract grocery items from the following input.
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

    const raw =
      response.text?.replace(/```json\n?|\n?```/g, '').trim() || '[]'
    const items = JSON.parse(raw)

    return NextResponse.json({ items })
  } catch (error) {
    console.error('AI extract error:', error)
    return NextResponse.json(
      { error: 'Failed to extract items' },
      { status: 500 }
    )
  }
}
