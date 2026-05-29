/**
 * useNewnessBadge — Phase 10 §2.10 "New" / "Updated" badge detection.
 *
 * Compares the current EssayProfile's annotations against an optional
 * prior snapshot:
 *   - annotationId present in current but NOT prior     → 'new'
 *   - annotationId present in both but critique text OR
 *     priority changed                                  → 'updated'
 *   - everything else                                   → null
 *
 * Backend (§6.3) does this comparison server-side and ships back an
 * `isNew` / `isUpdated` flag on every queue entry; this hook exists for
 * the Round-1 demo path (no backend) and for local focused-re-analysis
 * flows where the client retains both the prior and current profile.
 *
 * If `priorProfileSnapshot` is undefined, every annotation is first-pass,
 * so `newnessOf` returns null for all IDs (per spec).
 */

import { useMemo } from 'react';

import type { EssayProfile } from '../types/profile';
import type { NewnessBadge } from '../types/navigation';

export interface UseNewnessBadgeOpts {
  readonly currentProfile: EssayProfile;
  readonly priorProfileSnapshot?: EssayProfile;
}

export interface UseNewnessBadgeResult {
  readonly newnessOf: (annotationId: string) => NewnessBadge;
  readonly newCount: number;
  readonly updatedCount: number;
}

export function useNewnessBadge(
  opts: UseNewnessBadgeOpts,
): UseNewnessBadgeResult {
  const { currentProfile, priorProfileSnapshot } = opts;

  const { badges, newCount, updatedCount } = useMemo(() => {
    const map = new Map<string, NewnessBadge>();
    let n = 0;
    let u = 0;

    if (!priorProfileSnapshot) {
      // First-pass: no prior; every annotation's badge is null.
      return { badges: map, newCount: 0, updatedCount: 0 };
    }

    const prior = new Map(
      priorProfileSnapshot.annotations.map((a) => [a.id, a] as const),
    );

    for (const cur of currentProfile.annotations) {
      const before = prior.get(cur.id);
      if (!before) {
        map.set(cur.id, 'new');
        n += 1;
        continue;
      }
      // Phase 10 §2.10 — 'updated' fires when critique text or priority
      // changes. Tier is not on the annotation (it lives on the sentence)
      // so we don't test tier drift here; if the sentence tier changes
      // it will be reflected in critique text indirectly. Workstream γ
      // can widen this comparison once full annotationVersion wiring
      // lands.
      if (
        before.critique !== cur.critique ||
        before.priority !== cur.priority
      ) {
        map.set(cur.id, 'updated');
        u += 1;
      } else {
        map.set(cur.id, null);
      }
    }
    return { badges: map, newCount: n, updatedCount: u };
  }, [currentProfile, priorProfileSnapshot]);

  const newnessOf = (annotationId: string): NewnessBadge => {
    return badges.get(annotationId) ?? null;
  };

  return { newnessOf, newCount, updatedCount };
}
