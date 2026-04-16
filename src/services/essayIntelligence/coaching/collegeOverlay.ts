/**
 * collegeOverlay.ts — Adapter that loads college research data and produces
 * compact coaching context blocks for the essay type system.
 *
 * Uses lazy loading: individual college data files are only imported when
 * getCollegeCoachingOverlay() is called for that college, avoiding the cost
 * of loading all 13 college files at module level.
 */

import type { CollegeResearch, CollegeKeyQuote } from '../../commonAppWorkshop/types/collegeResearch';

// ---------------------------------------------------------------------------
// Lazy-loaded college cache
// ---------------------------------------------------------------------------

const collegeCache = new Map<string, CollegeResearch>();

/**
 * Mapping from college ID to the async import that loads its data file.
 * Each loader returns the named export for that college's CollegeResearch object.
 */
const COLLEGE_LOADERS: Record<string, () => Promise<CollegeResearch>> = {
  stanford:      async () => (await import('../../commonAppWorkshop/data/stanford')).stanfordResearch,
  harvard:       async () => (await import('../../commonAppWorkshop/data/harvard')).harvardResearch,
  mit:           async () => (await import('../../commonAppWorkshop/data/mit')).mitResearch,
  uchicago:      async () => (await import('../../commonAppWorkshop/data/uchicago')).uchicagoResearch,
  usc:           async () => (await import('../../commonAppWorkshop/data/usc')).uscResearch,
  upenn:         async () => (await import('../../commonAppWorkshop/data/upenn')).pennResearch,
  northwestern:  async () => (await import('../../commonAppWorkshop/data/northwestern')).northwesternResearch,
  nyu:           async () => (await import('../../commonAppWorkshop/data/nyu')).nyuResearch,
  cmu:           async () => (await import('../../commonAppWorkshop/data/cmu')).cmuResearch,
  brown:         async () => (await import('../../commonAppWorkshop/data/brown')).brownResearch,
  cornell:       async () => (await import('../../commonAppWorkshop/data/cornell')).cornellResearch,
  caltech:       async () => (await import('../../commonAppWorkshop/data/caltech')).caltechResearch,
  dartmouth:     async () => (await import('../../commonAppWorkshop/data/dartmouth')).dartmouthResearch,
};

/**
 * Load college research data on demand. Returns null if the college ID
 * is not recognized. Caches loaded data so subsequent calls are instant.
 */
async function loadCollege(collegeId: string): Promise<CollegeResearch | null> {
  const normalizedId = collegeId.toLowerCase();

  const cached = collegeCache.get(normalizedId);
  if (cached) return cached;

  const loader = COLLEGE_LOADERS[normalizedId];
  if (!loader) return null;

  try {
    const research = await loader();
    collegeCache.set(normalizedId, research);
    return research;
  } catch (error) {
    console.error(`[CollegeOverlay] Failed to load data for ${collegeId}:`, error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helper: extract the best AO quote from keyQuotes
// ---------------------------------------------------------------------------

function extractBestQuote(keyQuotes: CollegeKeyQuote[]): string | null {
  if (!keyQuotes || keyQuotes.length === 0) return null;

  // Prefer quotes with a named source (AO / Dean)
  for (const kq of keyQuotes) {
    if (kq.quote && kq.source) {
      const sourceName = typeof kq.source === 'string'
        ? kq.source
        : kq.source.name;
      if (sourceName) {
        return `"${kq.quote}" -- ${sourceName}`;
      }
    }
  }

  // Fallback: first quote with text
  const first = keyQuotes.find(kq => kq.quote);
  return first?.quote ? `"${first.quote}"` : null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a compact (~300-500 token) coaching context string for a college.
 *
 * Contains:
 *  - College name and essay philosophy (1 sentence)
 *  - Top 3 core values with weights
 *  - Top 3 red flags (what to avoid)
 *  - Top 3 green flags (what the college loves)
 *  - Key AO quote (if available)
 *
 * Returns null if the college ID is not found.
 */
export async function getCollegeCoachingOverlay(collegeId: string): Promise<string | null> {
  const research = await loadCollege(collegeId);
  if (!research) return null;

  const parts: string[] = [];

  // --- College name + philosophy sentence ---
  parts.push(`COLLEGE: ${research.collegeName}.`);

  // --- Top 3 core values with weights ---
  if (research.coreValues && research.coreValues.length > 0) {
    const topValues = [...research.coreValues]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3);

    const valueStr = topValues
      .map(v => `${v.valueName} (${v.weight}%)`)
      .join(', ');
    parts.push(`CORE VALUES: ${valueStr}.`);
  }

  // --- Top 3 red flags ---
  if (research.redFlags && research.redFlags.length > 0) {
    const topRed = research.redFlags.slice(0, 3);
    const redStr = topRed
      .map(f => {
        const name = f.flagName || f.flagId.replace(/_/g, ' ');
        const detail = f.teaching?.problem || '';
        return detail ? `${name} -- ${detail}` : name;
      })
      .join('; ');
    parts.push(`RED FLAGS (avoid): ${redStr}.`);
  }

  // --- Top 3 green flags ---
  if (research.greenFlags && research.greenFlags.length > 0) {
    const topGreen = research.greenFlags.slice(0, 3);
    const greenStr = topGreen
      .map(f => {
        const name = f.flagName || f.flagId.replace(/_/g, ' ');
        const detail = f.teaching?.whatWorks || '';
        return detail ? `${name} -- ${detail}` : name;
      })
      .join('; ');
    parts.push(`GREEN FLAGS (what they love): ${greenStr}.`);
  }

  // --- Key AO quote ---
  const quote = extractBestQuote(research.keyQuotes);
  if (quote) {
    parts.push(`KEY AO INSIGHT: ${quote}`);
  }

  // --- Dimension weights (top 5 — tells the coach what this college ACTUALLY scores on) ---
  if (research.dimensionWeights?.dimensions && research.dimensionWeights.dimensions.length > 0) {
    const topDims = [...research.dimensionWeights.dimensions]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);

    const dimLines = topDims.map(d => {
      const evidence = d.evidence ? ` — ${d.evidence}` : '';
      return `  ${d.dimensionName} (${d.weight}%): ${d.context}${evidence}`;
    });
    parts.push(`EVALUATION DIMENSIONS (what this college's rubric actually weights):\n${dimLines.join('\n')}`);
  }

  // --- Socratic questions (top 3 by purpose — the questions THIS college's AOs would ask) ---
  if (research.socraticQuestions?.byPurpose) {
    const questions: string[] = [];
    const purposes = ['deepening', 'specificity', 'connection', 'voice', 'vulnerability'] as const;

    for (const purpose of purposes) {
      const bank = research.socraticQuestions.byPurpose[purpose];
      if (!bank || bank.length === 0) continue;

      const first = bank[0];
      const questionText = typeof first === 'string' ? first : first.question;
      if (questionText) {
        questions.push(`  [${purpose}]: "${questionText}"`);
      }
      if (questions.length >= 3) break;
    }

    if (questions.length > 0) {
      parts.push(
        `COLLEGE-CALIBRATED QUESTIONS (prefer these over generic questions):\n${questions.join('\n')}`
      );
    }
  }

  // --- Elite teaching patterns (Scope 3 Phase 7, top 2 examples) ---
  //
  // 10 of 13 college data files have populated `eliteExamples` with
  // `pattern`, `anonymizedDescription`, and `whatMakesItEffective[]`
  // (Brown, Dartmouth, UChicago, Northwestern, Penn, USC, Caltech, CMU,
  // Cornell, NYU). The remaining 3 (Harvard, MIT, Stanford) have empty
  // arrays — the `if` guard below skips them without rendering an empty
  // section.
  //
  // `CollegeEliteExample` in types/collegeResearch.ts uses
  // `[key: string]: unknown` as an escape hatch, so `pattern`,
  // `anonymizedDescription`, and `whatMakesItEffective` are reachable
  // via guarded property reads without a type widening.
  if (research.eliteExamples && research.eliteExamples.length > 0) {
    const topExamples = research.eliteExamples.slice(0, 2);
    const exampleLines: string[] = [];

    for (const ex of topExamples) {
      // Prefer typed field reads, fall back via the [key: string]: unknown
      // escape hatch. Any missing required field → skip the example.
      const pattern =
        (ex as { pattern?: string }).pattern ?? ex.exampleId;
      const description =
        (ex as { anonymizedDescription?: string }).anonymizedDescription;
      const strengths =
        (ex as { whatMakesItEffective?: string[] }).whatMakesItEffective;

      if (!description) continue;
      let line = `  [${pattern}]: ${description}`;
      if (strengths && strengths.length > 0) {
        line += `\n    Effective because: ${strengths.slice(0, 2).join('; ')}`;
      }
      exampleLines.push(line);
    }

    if (exampleLines.length > 0) {
      parts.push(
        `ELITE TEACHING PATTERNS (observed in admitted essays at this college):\n` +
          exampleLines.join('\n'),
      );
    }
  }

  return parts.join('\n');
}

/**
 * Return the list of college IDs that have research data available.
 */
export function getAvailableColleges(): string[] {
  return Object.keys(COLLEGE_LOADERS);
}
