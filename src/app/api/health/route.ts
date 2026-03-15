import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Check env vars exist (don't leak values)
  const envCheck = {
    SUPABASE_URL: url ? `set (${url.substring(0, 30)}...)` : 'MISSING',
    ANON_KEY: anonKey ? `set (${anonKey.substring(0, 20)}...)` : 'MISSING',
    SERVICE_ROLE: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'MISSING',
  }

  // Test actual auth connection
  let authTest = 'not tested'
  if (url && anonKey) {
    try {
      const supabase = createClient(url, anonKey)
      const { error } = await supabase.auth.signInWithPassword({
        email: 'health-check-nonexistent@test.com',
        password: 'test',
      })
      // We expect "Invalid login credentials" — that proves auth is reachable
      authTest = error ? `auth reachable (${error.message})` : 'unexpected success'
    } catch (e) {
      authTest = `connection failed: ${e}`
    }
  }

  return NextResponse.json({ envCheck, authTest })
}
