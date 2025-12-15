/**
 * Common App Workshop Utilities
 *
 * Utility functions and helpers for the workshop system
 */

// JSON Parser (Robust Claude Response Parsing)
export { parseClaudeJSON } from './jsonParser';

// Citation Formatter (UI-Ready Citation Conversion)
export {
  CitationFormatter,
  citationFormatter,
  formatCitation,
  formatTextWithCitations,
  generateTooltipHTML,
} from './citationFormatter';
