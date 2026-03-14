import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! })

export async function POST(request: Request) {
  const { ingredients } = await request.json()

  const prompt = `You are a zero-waste chef. Given these ingredients (with days until expiry), suggest 2 recipes that prioritize using items expiring soonest.

Ingredients:
${ingredients.map((i: { name: string; daysLeft: number }) => `- ${i.name} (${i.daysLeft} days left)`).join('\n')}

Return ONLY a JSON object with this structure:
{
  "recipes": [
    {
      "title": "Recipe Name",
      "quick_steps": ["Step 1", "Step 2", "Step 3"],
      "prep_time_minutes": 20,
      "zero_waste_reason": "Uses the salmon expiring tomorrow"
    }
  ]
}

Return ONLY valid JSON, no markdown.`

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
