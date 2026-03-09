/**
 * Enhanced Workshop Configuration
 *
 * Feature flag + circuit breaker for production safety.
 * Circuit breaker: 5 consecutive 500s in 60s -> auto-disable for 5min.
 */

const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_WINDOW_MS = 60_000;
const CIRCUIT_BREAKER_COOLDOWN_MS = 5 * 60_000;

interface CircuitBreakerState {
  failures: number[];
  disabledUntil: number | null;
}

const circuitBreaker: CircuitBreakerState = {
  failures: [],
  disabledUntil: null,
};

export const enhancedWorkshopConfig = {
  /** Whether the enhanced workshop is enabled (always on, unless circuit breaker trips) */
  isEnabled: (): boolean => {
    // Check kill switch override
    if (process.env.ENABLE_ENHANCED_WORKSHOP === 'false') return false;

    // Check circuit breaker
    if (circuitBreaker.disabledUntil) {
      if (Date.now() < circuitBreaker.disabledUntil) return false;
      // Cooldown expired — reset
      circuitBreaker.disabledUntil = null;
      circuitBreaker.failures = [];
    }
    return true;
  },

  /** Record a failure. If threshold hit within window, trip the breaker. */
  recordFailure: (): void => {
    const now = Date.now();
    circuitBreaker.failures.push(now);
    // Prune old failures outside window
    circuitBreaker.failures = circuitBreaker.failures.filter(
      t => now - t < CIRCUIT_BREAKER_WINDOW_MS
    );
    if (circuitBreaker.failures.length >= CIRCUIT_BREAKER_THRESHOLD) {
      circuitBreaker.disabledUntil = now + CIRCUIT_BREAKER_COOLDOWN_MS;
      console.error(
        '[EnhancedWorkshop] Circuit breaker TRIPPED — disabling for 5 minutes after %d consecutive failures',
        circuitBreaker.failures.length
      );
      circuitBreaker.failures = [];
    }
  },

  /** Reset the circuit breaker (e.g., after a successful request) */
  recordSuccess: (): void => {
    circuitBreaker.failures = [];
  },
};
