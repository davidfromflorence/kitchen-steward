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
    ? `You are a kitchen inventory assistant. Analyze this receipt/photo and extract all FOOD items purchased.

IMPORTANT RULES:
- IGNORE non-food items (bags, discounts, totals, VAT, loyalty cards, etc.)
- Use CLEAN Italian names: "Latte" not "LATTE PS UHT 1LT", "Pollo" not "PETT.POLL.SENZA OSSO"
- Use REALISTIC units and quantities:
  * Milk, juice, oil: use "litri" or "ml" (e.g. 1 litri, 500 ml). NEVER "pz" for liquids.
  * Meat, cheese, vegetables sold by weight: use "kg" or "g" (e.g. 0.5 kg, 300 g)
  * Eggs, bread, packaged items: use "pz" with actual count (e.g. 6 pz for eggs)
  * Pasta, rice, cookies in boxes: use "g" with weight from receipt (e.g. 500 g)
- Read the weight/volume from the receipt description when visible (e.g. "1LT" = 1 litri, "500G" = 500 g)
- If the receipt shows a price-per-kg line, use that to calculate the actual weight purchased

Return ONLY a JSON array:
- action: "add"
- name: clean Italian name (capitalize first letter only)
- qty: number (realistic quantity with correct unit)
- unit: one of "pz", "kg", "g", "litri", "ml"
- estimated_expiry_days: integer (typical shelf life)
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
