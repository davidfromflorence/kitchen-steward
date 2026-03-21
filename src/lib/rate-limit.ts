const requests = new Map<string, { count: number; resetTime: number }>()

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of requests) {
    if (now > value.resetTime) requests.delete(key)
  }
}, 60_000)

export function rateLimit(
  key: string,
  { limit = 30, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): { success: boolean; remaining: number } {
  const now = Date.now()
  const record = requests.get(key)

  if (!record || now > record.resetTime) {
    requests.set(key, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: limit - 1 }
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0 }
  }

  record.count++
  return { success: true, remaining: limit - record.count }
}
