const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

const attempts = new Map<string, { count: number; resetAt: number }>();

/**
 * In-memory sliding-window limiter for auth endpoints. Single-process only —
 * fine for this app's single-container deployment, not for multi-instance.
 */
export function checkRateLimit(
  key: string,
  { maxAttempts = MAX_ATTEMPTS, windowMs = WINDOW_MS } = {},
) {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false };
  }

  entry.count += 1;
  return { allowed: true };
}
