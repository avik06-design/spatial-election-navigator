/**
 * @module rateLimit
 * Client-side rate limiter using an in-memory Map.
 * Prevents abuse of the Gemini API by limiting requests per user.
 */

/** @type {Map<string, number[]>} userId → array of request timestamps */
const requestLog = new Map();

/** Maximum allowed requests within the time window */
const MAX_REQUESTS = 10;

/** Time window in milliseconds (1 minute) */
const WINDOW_MS = 60_000;

/**
 * Checks whether a user has exceeded the rate limit.
 * Tracks timestamps per userId and prunes expired entries on each call.
 *
 * @param {string} [userId='default'] - Unique identifier for the requesting user.
 * @returns {boolean} `true` if the request is allowed.
 * @throws {Error} If the user has exceeded 10 requests within the last 60 seconds.
 *
 * @example
 * checkRateLimit('user-123'); // true (first call)
 * // ...after 10 rapid calls...
 * checkRateLimit('user-123'); // throws Error
 */
export function checkRateLimit(userId = 'default') {
  const now = Date.now();
  const timestamps = requestLog.get(userId) || [];

  // Prune timestamps outside the current window
  const validTimestamps = timestamps.filter((t) => now - t < WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS) {
    throw new Error(
      `Rate limit exceeded: ${MAX_REQUESTS} requests per minute. Please wait before trying again.`
    );
  }

  validTimestamps.push(now);
  requestLog.set(userId, validTimestamps);
  return true;
}
