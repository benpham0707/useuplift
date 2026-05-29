/**
 * Tier re-exports.
 *
 * Authoritative `Tier`, `TIER_CSS_VAR`, `TIER_META`, `UnderlineStyle` live in
 * `../tokens.ts` (Workstream A). This file is a stable barrel so consumers in
 * `./profile.ts`, `./navigation.ts`, and any future type modules have a single
 * import surface (`from './tier'`) regardless of where the values originate.
 *
 * Do not redeclare tier types here.
 */

export type { Tier, UnderlineStyle } from '../tokens';
export { TIER_CSS_VAR, TIER_META } from '../tokens';
