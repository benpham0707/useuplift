import { describe, expect, it } from 'vitest';
import { shouldUsePublicLaunchMode } from '../../src/config/launchMode';

describe('production launch mode', () => {
  it('fails closed for production-mode builds', () => {
    expect(shouldUsePublicLaunchMode('production', undefined)).toBe(true);
  });

  it('keeps local development auth available', () => {
    expect(shouldUsePublicLaunchMode('development', undefined)).toBe(false);
  });

  it('only reopens production auth with an explicit opt-in', () => {
    expect(shouldUsePublicLaunchMode('production', 'true')).toBe(false);
    expect(shouldUsePublicLaunchMode('production', 'false')).toBe(true);
  });
});
