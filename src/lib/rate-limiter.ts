/**
 * Simple in-memory rate limiter.
 * Works per-IP. Resets on cold starts (acceptable for our use case).
 * Max: 20 requests per 60-second window.
 */

interface RateEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateEntry>()

const MAX_REQUESTS = 20
const WINDOW_MS = 60_000 // 1 minute

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.resetAt) {
    // New window
    const resetAt = now + WINDOW_MS
    store.set(ip, { count: 1, resetAt })
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt }
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count += 1
  return { allowed: true, remaining: MAX_REQUESTS - entry.count, resetAt: entry.resetAt }
}

// Cleanup old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}, 5 * 60_000)
