/**
 * Connection Graph Module — barrel export.
 */

export { ConnectionGraph, createConnection } from './connectionGraph';
export {
  buildHolisticConnectionContext,
  buildParagraphConnectionContext,
  buildScoutLeadContext,
  buildRevalidationContext,
  buildCompactConnectionContext,
} from './connectionContextBuilder';
