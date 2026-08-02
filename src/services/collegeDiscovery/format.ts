import type { FoundationOwnership } from '@/lib/types/college';

export function formatCollegePercent(value: number | null) {
  return value === null ? 'Unavailable' : new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 }).format(value);
}

export function formatCollegeCurrency(value: number | null) {
  return value === null ? 'Unavailable' : new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(value);
}

export function ownershipLabel(value: FoundationOwnership) {
  return ({
    public: 'Public', private_nonprofit: 'Private nonprofit',
    private_for_profit: 'Private for-profit', other: 'Other',
  })[value];
}
