import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '../../utils/rateLimit';

/**
 * Unit tests for the client-side rate limiter.
 * Validates sliding window enforcement and error throwing.
 */
describe('checkRateLimit', () => {
  it('allows requests under the limit', () => {
    const userId = 'test-allow-' + Date.now();
    expect(checkRateLimit(userId)).toBe(true);
    expect(checkRateLimit(userId)).toBe(true);
    expect(checkRateLimit(userId)).toBe(true);
  });

  it('throws an error when the rate limit (10/min) is exceeded', () => {
    const userId = 'test-exceed-' + Date.now();
    // Exhaust all 10 allowed requests
    for (let i = 0; i < 10; i++) {
      checkRateLimit(userId);
    }
    // The 11th call should throw
    expect(() => checkRateLimit(userId)).toThrow('Rate limit exceeded');
  });

  it('uses "default" userId when none is provided', () => {
    // Should not throw on first call with default user
    expect(() => checkRateLimit()).not.toThrow();
  });

  it('tracks separate limits per userId', () => {
    const userA = 'rate-test-a-' + Date.now();
    const userB = 'rate-test-b-' + Date.now();
    for (let i = 0; i < 10; i++) {
      checkRateLimit(userA);
    }
    // User A is exhausted, but User B should still be allowed
    expect(() => checkRateLimit(userA)).toThrow('Rate limit exceeded');
    expect(checkRateLimit(userB)).toBe(true);
  });
});
