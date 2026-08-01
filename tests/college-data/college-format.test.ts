import { describe, expect, it } from 'vitest';
import {
  formatCollegeCurrency,
  formatCollegePercent,
  ownershipLabel,
} from '@/services/collegeDiscovery/format';

describe('college display formatting', () => {
  it('keeps missing values explicit', () => {
    expect(formatCollegePercent(null)).toBe('Unavailable');
    expect(formatCollegeCurrency(null)).toBe('Unavailable');
  });

  it('formats reported values without implying extra precision', () => {
    expect(formatCollegePercent(0.1264)).toBe('12.6%');
    expect(formatCollegeCurrency(23145.75)).toBe('$23,146');
  });

  it('uses student-facing ownership labels', () => {
    expect(ownershipLabel('public')).toBe('Public');
    expect(ownershipLabel('private_nonprofit')).toBe('Private nonprofit');
    expect(ownershipLabel('private_for_profit')).toBe('Private for-profit');
    expect(ownershipLabel('other')).toBe('Other');
  });
});
