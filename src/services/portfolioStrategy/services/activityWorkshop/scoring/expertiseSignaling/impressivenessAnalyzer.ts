/**
 * Impressiveness Analyzer — Deterministic Activity Impression Assessment
 *
 * Produces ImpressionAnalysisResult from evidence, tier, expertise signals,
 * and intended major. Provides rich context for Sonnet nuance calibration:
 * - Level explanation ("This is top 5-10% among selective school applicants because...")
 * - Major alignment ("Critical for Biology — boost factor 0.85")
 * - Technical depth markers ("IRB approval = rare for HS students")
 *
 * Cost: $0.00 (pure TypeScript logic, no LLM calls)
 * Latency: <1ms per activity
 */

import type { ExtractedEvidence, TierClassification, InternalTier } from '../types';
import type {
  ImpressionAnalysisResult,
  MajorAlignmentEntry,
  TechnicalDepthMarker,
  ExpertiseMatchResult,
} from './types';
import { getMajorAlignment } from './majorAlignmentMatrix';

// ============================================================================
// TIER-LEVEL EXPLANATION DATA
// ============================================================================

interface TierLevelContext {
  /** Human-readable percentile range */
  percentileRange: string;
  /** What this tier means in admissions context */
  levelTemplate: string;
  /** School tier relevance */
  schoolContext: string;
}

const TIER_LEVEL_DATA: Record<InternalTier, TierLevelContext> = {
  1: {
    percentileRange: 'top 1-2%',
    levelTemplate: 'among the most distinguished activities nationally — only {percentile} of applicants at highly selective schools present achievements at this level',
    schoolContext: 'This is a standout activity even at the most selective schools (Harvard, MIT, Stanford)',
  },
  2: {
    percentileRange: 'top 5-10%',
    levelTemplate: 'nationally recognized achievement — approximately {percentile} of applicants at selective schools present activities at this level',
    schoolContext: 'This would be a strong spike activity at any selective school',
  },
  3: {
    percentileRange: 'top 15-25%',
    levelTemplate: 'state/regional distinction — {percentile} of applicants at selective schools have activities at this level',
    schoolContext: 'Strong at most selective schools; expected at the most competitive',
  },
  4: {
    percentileRange: 'top 30-50%',
    levelTemplate: 'meaningful school-level impact — {percentile} of applicants at selective schools have activities at this level',
    schoolContext: 'Solid supporting activity; would need depth/progression to stand out',
  },
  5: {
    percentileRange: 'top 50-70%',
    levelTemplate: 'consistent participation — {percentile} of applicants show this level of involvement',
    schoolContext: 'Common at all school types; value comes from sustained commitment',
  },
  6: {
    percentileRange: 'bottom 30%',
    levelTemplate: 'developing involvement — {percentile} characterization; minimal demonstrated impact',
    schoolContext: 'Unlikely to contribute positively to applications at selective schools',
  },
};

// ============================================================================
// TECHNICAL DEPTH MARKERS
// ============================================================================

/**
 * Patterns that indicate technical depth rare among HS students.
 * Organized by domain for efficient matching.
 */
interface DepthPattern {
  keywords: string[];
  marker: string;
  significance: string;
  rarity: TechnicalDepthMarker['rarity'];
}

const DEPTH_PATTERNS: DepthPattern[] = [
  // Research methodology
  { keywords: ['irb', 'institutional review board'], marker: 'IRB approval', significance: 'Required formal ethics review — rare for HS students, signals university-level research', rarity: 'very_rare' },
  { keywords: ['peer review', 'peer-reviewed'], marker: 'Peer-reviewed publication', significance: 'Work evaluated by domain experts — exceptional for HS researchers', rarity: 'very_rare' },
  { keywords: ['patent', 'provisional patent'], marker: 'Patent filing', significance: 'Intellectual property creation — signals original, commercially viable work', rarity: 'very_rare' },
  { keywords: ['first author', '1st author'], marker: 'First authorship', significance: 'Led the research and writing — distinguished from co-authorship', rarity: 'very_rare' },

  // Research signals
  { keywords: ['novel finding', 'novel approach', 'novel method', 'novel compound', 'novel technique', 'first-ever', 'first to', 'previously unknown'], marker: 'Novel discovery', significance: 'Original contribution to the field — the gold standard for research', rarity: 'rare' },
  { keywords: ['protocol', 'methodology', 'assay'], marker: 'Original methodology', significance: 'Developed own experimental approach — shows independent scientific thinking', rarity: 'rare' },
  { keywords: ['replicate', 'reproducib'], marker: 'Reproducibility focus', significance: 'Attention to scientific rigor — unusual maturity for HS student', rarity: 'uncommon' },
  { keywords: ['p-value', 'statistical significance', 'confidence interval', 'regression'], marker: 'Statistical analysis', significance: 'Quantitative rigor beyond typical HS level', rarity: 'uncommon' },

  // Competition signals
  { keywords: ['usamo', 'imo', 'ioi', 'ipho', 'icho', 'ibo'], marker: 'Olympiad qualification', significance: 'Internationally recognized competitive achievement — top fraction of a percent', rarity: 'very_rare' },
  { keywords: ['isef', 'regeneron', 'siemens', 'intel sts'], marker: 'Premier science competition', significance: 'National/international science competition — highly selective', rarity: 'very_rare' },
  { keywords: ['aime qualifier', 'aime'], marker: 'AIME qualification', significance: 'Top 5% of AMC participants nationally', rarity: 'rare' },

  // Engineering/coding signals
  { keywords: ['deployed', 'production', 'live users', 'app store'], marker: 'Production deployment', significance: 'Software used by real people — moves beyond classroom exercise', rarity: 'uncommon' },
  { keywords: ['open source', 'github stars', 'contributors'], marker: 'Open source contribution', significance: 'Community-validated technical work', rarity: 'uncommon' },
  { keywords: ['machine learning model', 'trained model', 'neural network'], marker: 'ML implementation', significance: 'Advanced technical implementation beyond typical HS curriculum', rarity: 'uncommon' },

  // Arts signals
  { keywords: ['all-state', 'all-national'], marker: 'All-State/All-National selection', significance: 'Juried selection among top performers statewide/nationally', rarity: 'rare' },
  { keywords: ['carnegie hall', 'lincoln center', 'kennedy center'], marker: 'Premier venue performance', significance: 'Performed at nationally recognized venue', rarity: 'very_rare' },
  { keywords: ['commissioned', 'commission'], marker: 'Commissioned work', significance: 'Paid to create original work — professional-level validation', rarity: 'rare' },

  // Leadership/community signals
  { keywords: ['501(c)', 'nonprofit', 'incorporated', 'tax-exempt'], marker: 'Formal nonprofit creation', significance: 'Legal entity creation — exceptional organizational commitment', rarity: 'rare' },
  { keywords: ['grant', 'funding', 'awarded funding'], marker: 'Grant funding secured', significance: 'Competitive funding obtained — validates project quality externally', rarity: 'rare' },
  { keywords: ['legislation', 'city council', 'policy change', 'ordinance'], marker: 'Policy impact', significance: 'Influenced actual government policy — tangible civic impact', rarity: 'rare' },
  { keywords: ['ted', 'tedx'], marker: 'TEDx speaker', significance: 'Selected for curated speaking platform — thought leadership signal', rarity: 'uncommon' },

  // Medical/health signals
  { keywords: ['emt', 'emt-b', 'emt-a', 'emergency medical technician', 'nremt'], marker: 'EMT certification', significance: 'Requires 150+ hours training + national exam — objective clinical competence', rarity: 'uncommon' },
  { keywords: ['hipaa', 'hipaa training', 'hipaa certified'], marker: 'HIPAA training', significance: 'Access to protected health information — signals institutional trust and genuine clinical role', rarity: 'uncommon' },
  { keywords: ['clinical rotation', 'clinical rotations'], marker: 'Clinical rotation', significance: 'Hands-on patient care training in medical setting — beyond basic volunteering', rarity: 'uncommon' },
  { keywords: ['ehr', 'emr', 'electronic health record', 'electronic medical record'], marker: 'EHR/EMR access', significance: 'Trusted with patient record systems — implies real clinical integration', rarity: 'uncommon' },
  { keywords: ['surgical observation', 'observed surgery', 'operating room'], marker: 'Surgical observation', significance: 'Access to OR requires credentialing — signals serious clinical engagement', rarity: 'uncommon' },
  { keywords: ['case report', 'case study', 'clinical case'], marker: 'Clinical case report', significance: 'Contributing to medical literature — exceptional for HS student', rarity: 'rare' },
  { keywords: ['epidemiological', 'epidemiology', 'disease surveillance'], marker: 'Epidemiological study', significance: 'Population-level health research — advanced public health methodology', rarity: 'rare' },
  { keywords: ['clinical trial', 'phase i', 'phase ii', 'phase iii', 'randomized controlled'], marker: 'Clinical trial involvement', significance: 'Participation in drug/treatment trials — rare institutional trust for HS student', rarity: 'very_rare' },
  { keywords: ['public health initiative', 'community health program', 'health screening program'], marker: 'Public health initiative', significance: 'Student-led community health intervention with measurable outcomes', rarity: 'rare' },
  { keywords: ['cna', 'certified nursing assistant'], marker: 'CNA certification', significance: 'State-certified patient care credential — demonstrates clinical training', rarity: 'uncommon' },

  // Arts/creative signals
  { keywords: ['juried exhibition', 'juried show', 'juried art'], marker: 'Juried exhibition acceptance', significance: 'Work selected by professional curators against competitive field', rarity: 'uncommon' },
  { keywords: ['gallery show', 'gallery exhibition', 'gallery representation', 'solo show', 'solo exhibition'], marker: 'Gallery show/representation', significance: 'Professional gallery validated artistic merit — rare for HS artist', rarity: 'rare' },
  { keywords: ['scholastic art', 'scholastic writing', 'gold key', 'silver key', 'american visions', 'american voices'], marker: 'Scholastic Art & Writing Awards', significance: 'Universal benchmark for HS creative arts — 300K annual submissions', rarity: 'uncommon' },
  { keywords: ['portfolio accepted', 'portfolio acceptance', 'pre-college art', 'risd pre-college', 'saic early college'], marker: 'Art portfolio acceptance', significance: 'Faculty-evaluated portfolio met pre-professional standards', rarity: 'rare' },
  { keywords: ['literary journal', 'literary magazine', 'adroit journal', 'kenyon review'], marker: 'Literary journal publication', significance: 'Editors who publish MFA graduates selected HS student work', rarity: 'rare' },
];

// ============================================================================
// CORE ANALYZER
// ============================================================================

/**
 * Analyze the impressiveness of an activity.
 * Produces rich context for Sonnet nuance calibration prompts.
 *
 * @param evidence - Extracted evidence from feature extraction
 * @param tier - Tier classification result
 * @param expertiseResult - Optional expertise signal matching result
 * @param intendedMajor - Student's intended major (optional)
 * @param description - Raw activity description text
 * @returns Deterministic impression analysis ($0, <1ms)
 */
export function analyzeImpressiveness(
  evidence: ExtractedEvidence,
  tier: TierClassification,
  expertiseResult: ExpertiseMatchResult | undefined,
  intendedMajor: string | undefined,
  description: string,
): ImpressionAnalysisResult {
  // 1. Build level explanation
  const tierData = TIER_LEVEL_DATA[tier.internalTier];
  const levelExplanation = buildLevelExplanation(evidence, tier, tierData);

  // 2. Compute major alignment
  const domainId = expertiseResult?.domainId ?? evidence.categoryMatch.category;
  const majorAlignment = intendedMajor
    ? getMajorAlignment(domainId, intendedMajor)
    : { relevance: 'unrelated' as const, boostFactor: 0, rationale: 'No intended major specified' };

  // 3. Detect technical depth markers
  const searchText = [
    description,
    ...evidence.impact.tangibleOutcomes,
    evidence.scope.evidence,
    evidence.role.evidence,
    ...evidence.recognitions.map(r => r.name),
  ].join(' ').toLowerCase();

  const technicalDepthMarkers = detectDepthMarkers(searchText);

  // 4. Build prompt summary
  const promptSummary = buildPromptSummary(
    tier.internalTier,
    tierData,
    majorAlignment,
    technicalDepthMarkers,
    intendedMajor,
  );

  return {
    levelExplanation,
    percentileRange: tierData.percentileRange,
    majorAlignment,
    technicalDepthMarkers,
    promptSummary,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build a human-readable level explanation for the activity.
 */
function buildLevelExplanation(
  evidence: ExtractedEvidence,
  tier: TierClassification,
  tierData: TierLevelContext,
): string {
  const parts: string[] = [];

  // Base level statement
  parts.push(
    `This activity is ${tierData.percentileRange} — ` +
    tierData.levelTemplate.replace('{percentile}', tierData.percentileRange)
  );

  // Add tier-specific evidence
  const matchedSignals = tier.signals.filter(s => s.matched);
  if (matchedSignals.length > 0) {
    const topSignals = matchedSignals.slice(0, 3).map(s => s.evidence);
    parts.push(`Key factors: ${topSignals.join('; ')}`);
  }

  // Add scope context
  if (evidence.scope.level === 'national' || evidence.scope.level === 'international') {
    parts.push(`${tierData.schoolContext}`);
  }

  return parts.join('. ') + '.';
}

/**
 * Detect technical depth markers in the combined search text.
 */
function detectDepthMarkers(searchText: string): TechnicalDepthMarker[] {
  const markers: TechnicalDepthMarker[] = [];

  for (const pattern of DEPTH_PATTERNS) {
    const found = pattern.keywords.some(kw => searchText.includes(kw));
    if (found) {
      markers.push({
        marker: pattern.marker,
        significance: pattern.significance,
        rarity: pattern.rarity,
      });
    }
  }

  return markers;
}

/**
 * Build a compact prompt summary for injection into nuance calibration.
 */
function buildPromptSummary(
  internalTier: InternalTier,
  tierData: TierLevelContext,
  majorAlignment: MajorAlignmentEntry,
  depthMarkers: TechnicalDepthMarker[],
  intendedMajor: string | undefined,
): string {
  const parts: string[] = [];

  // Level
  parts.push(`Tier ${internalTier} (${tierData.percentileRange} among selective school applicants)`);

  // Major alignment
  if (intendedMajor && majorAlignment.relevance !== 'unrelated') {
    parts.push(
      `${capitalize(majorAlignment.relevance)} for ${intendedMajor} — boost ${majorAlignment.boostFactor.toFixed(1)} (${majorAlignment.rationale})`
    );
  }

  // Technical depth
  if (depthMarkers.length > 0) {
    const rareMarkers = depthMarkers.filter(m => m.rarity === 'very_rare' || m.rarity === 'rare');
    if (rareMarkers.length > 0) {
      parts.push(
        `Depth markers: ${rareMarkers.map(m => `${m.marker} (${m.significance})`).join('; ')}`
      );
    }
  }

  return parts.join('. ') + '.';
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
