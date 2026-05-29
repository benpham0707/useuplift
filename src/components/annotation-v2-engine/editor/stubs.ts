/**
 * Editor shared-type barrel.
 *
 * Originally a Wave α stub file; at Wave α merge it became a thin re-export
 * layer so editor modules can keep their `./stubs` import paths unchanged.
 *
 * Authoritative sources:
 *   - Tier / TIER_CSS_VAR / EASING / DURATION         → `../tokens`
 *   - Paragraph / SentenceProfile / EssayProfile      → `../types/profile`
 *   - ParagraphRole                                   → `../types/profile`
 *
 * The editor only needs a minimal slice of the full profile — it renders text
 * from `paragraphs[*].text`, looks up tiers from `sentences[*].tier`, and
 * resolves positions from `sentences[*].{paragraphIndex,startOffset,endOffset}`.
 * Everything else (annotations, cross-refs, holistic synthesis) flows to other
 * workstreams via the panel layer, not through the editor.
 */

export type { Tier } from '../tokens';
export { TIER_CSS_VAR, EASING, DURATION } from '../tokens';

export type {
  ParagraphRole,
  Paragraph,
  SentenceProfile,
  EssayProfile,
} from '../types/profile';
