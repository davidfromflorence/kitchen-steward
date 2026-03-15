import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const envCheck = {
    SUPABASE_URL: url ? `set (${url.substring(0, 30)}...)` : 'MISSING',
    ANON_KEY: anonKey ? `set (${anonKey.substring(0, 20)}...)` : 'MISSING',
    SERVICE_ROLE: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'MISSING',
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? `set (${process.env.GOOGLE_API_KEY.substring(0, 8)}...)` : 'MISSING',
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? 'set' : 'MISSING',
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? 'set' : 'MISSING',
    TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER ? 'set' : 'MISSING',
    CRON_SECRET: process.env.CRON_SECRET ? 'set' : 'MISSING',
  }

  // Test Supabase
  let authTest = 'not tested'
  if (url && anonKey) {
    try {
      const supabase = createClient(url, anonKey)
      const { error } = await supabase.auth.signInWithPassword({
        email: 'health-check-nonexistent@test.com',
        password: 'test',
      })
      authTest = error ? `auth reachable (${error.message})` : 'unexpected success'
    } catch (e) {
      authTest = `connection failed: ${e}`
    }
  }

  // Test Gemini
  let geminiTest = 'not tested'
  if (process.env.GOOGLE_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY })
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: 'Rispondi solo: OK' }] }],
      })
      geminiTest = result.text?.trim() ? `working (${result.text.trim().substring(0, 20)})` : 'empty response'
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      geminiTest = `FAILED: ${msg.substring(0, 150)}`
    }
  }

  return NextResponse.json({ envCheck, authTest, geminiTest })
}
