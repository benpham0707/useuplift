/**
 * schoolFitVectors.ts — Multi-dimensional school fit vectors.
 *
 * Direct corpus evidence (`corpusEvidence: "directly attested..."`):
 *   - Harvard (10 admit-attested essays in v2.1 reviews)
 *   - Johns Hopkins (4 admit-attested essays; reviews pending parallel chat)
 *
 * Inferred (`corpusEvidence: "inferred from cross-school-fit analysis..."`):
 *   - All other top schools — derived from Part V "school-fit analysis" sections
 *     in the 10 attested reviews. Each review evaluates how the essay would
 *     fare at Stanford/Yale/Princeton/MIT/Caltech/UChicago/Brown/Columbia/
 *     Penn/Cornell/Dartmouth/Duke/Northwestern. These cross-school inferences
 *     are surfaced honestly as inferences, not as direct attestation.
 *
 * Dimensions (0-10 scale):
 *   - craftDensity        — how much craft-density the school requires
 *   - intellectualSpecificity — how much intellectual content (STEM, scholarly references)
 *   - biographicalLoad    — how much identity/biographical content the school welcomes
 *   - voiceRisk           — how much voice/structural risk the school will reward
 *   - resolutionType      — external/internal/either preferred resolution
 */

import type { SchoolFitVector } from './corpusTypes';

export const SCHOOL_FIT_VECTORS: SchoolFitVector[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // DIRECTLY ATTESTED
  // ─────────────────────────────────────────────────────────────────────────
  {
    schoolId: 'harvard',
    dimensions: { craftDensity: 8, intellectualSpecificity: 6, biographicalLoad: 7, voiceRisk: 7, resolutionType: 'either' },
    archetypeAffinities: [
      { archetypeId: 'interior-transformation-metaphor-possession', strength: 9 },
      { archetypeId: 'peak-scene-community-integration', strength: 8 },
      { archetypeId: 'strategic-balance-plain-prose', strength: 8 },
      { archetypeId: 'mundane-topic-multi-lens', strength: 8 },
      { archetypeId: 'bait-and-switch-foil-refutation', strength: 9 },
      { archetypeId: 'child-memory-extended-metaphor-prophecy', strength: 9 },
      { archetypeId: 'metaphor-literalization-scientific', strength: 9 },
      { archetypeId: 'plain-voice-sacrifice-ritual', strength: 8 },
      { archetypeId: 'obsession-intellectual-autobiography-maximalist', strength: 9 },
      { archetypeId: 'compressed-heritage', strength: 9 },
    ],
    corpusEvidence: 'Directly attested: 10 admit-claimed Harvard 2024 essays in v2.1 reviews. Selection pattern: rewards COMMAND of any specific craft mode rather than one preferred archetype. No single Harvard template; multiple modes admitted when each operates well in its chosen mode.',
  },
  {
    schoolId: 'johns-hopkins',
    dimensions: { craftDensity: 7, intellectualSpecificity: 7, biographicalLoad: 8, voiceRisk: 5, resolutionType: 'external-preferred' },
    archetypeAffinities: [
      { archetypeId: 'splash-of-color-small-risk-growth', strength: 9 },
      { archetypeId: 'building-a-universe-interdisciplinary-obsession', strength: 9 },
      { archetypeId: 'korean-sticky-notes-cultural-reclamation', strength: 9 },
      { archetypeId: 'ordering-the-disorderly-intellectual-metaphor', strength: 9 },
      { archetypeId: 'peak-scene-community-integration', strength: 8 },
      { archetypeId: 'plain-voice-sacrifice-ritual', strength: 8 },
      { archetypeId: 'metaphor-literalization-scientific', strength: 8 },
      { archetypeId: 'compressed-heritage', strength: 8 },
    ],
    corpusEvidence: 'Directly attested: 4 admit-claimed Hopkins essays (essays 01-04). Selection pattern (per cross-references in attested Harvard reviews): rewards growth-from-adversity narratives, interdisciplinary-intellectual essays, cultural-reclamation. Hopkins AO commentary (where present) emphasizes resilience and community contribution. Note: Hopkins archetype recipes pending parallel-track review authoring.',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // INFERRED FROM CROSS-SCHOOL ANALYSIS
  // ─────────────────────────────────────────────────────────────────────────
  {
    schoolId: 'stanford',
    dimensions: { craftDensity: 8, intellectualSpecificity: 8, biographicalLoad: 6, voiceRisk: 7, resolutionType: 'either' },
    archetypeAffinities: [
      { archetypeId: 'mundane-topic-multi-lens', strength: 9 },
      { archetypeId: 'metaphor-literalization-scientific', strength: 9 },
      { archetypeId: 'interior-transformation-metaphor-possession', strength: 8 },
      { archetypeId: 'strategic-balance-plain-prose', strength: 7 },
      { archetypeId: 'obsession-intellectual-autobiography-maximalist', strength: 8 },
      { archetypeId: 'compressed-heritage', strength: 8 },
      { archetypeId: 'plain-voice-sacrifice-ritual', strength: 7 },
      { archetypeId: 'child-memory-extended-metaphor-prophecy', strength: 7 },
    ],
    corpusEvidence: 'Inferred from cross-school-fit analysis in Sarika, Daniella, Michelle, Lauren, Clara reviews. Stanford rewards distinctive voice with intellectual range; STEM-compatible thinking even in non-STEM topics; "passionate intellect"; making-it-work narratives. Not directly attested by admit data.',
  },
  {
    schoolId: 'yale',
    dimensions: { craftDensity: 8, intellectualSpecificity: 6, biographicalLoad: 7, voiceRisk: 6, resolutionType: 'either' },
    archetypeAffinities: [
      { archetypeId: 'interior-transformation-metaphor-possession', strength: 9 },
      { archetypeId: 'bait-and-switch-foil-refutation', strength: 8 },
      { archetypeId: 'child-memory-extended-metaphor-prophecy', strength: 8 },
      { archetypeId: 'metaphor-literalization-scientific', strength: 9 },
      { archetypeId: 'obsession-intellectual-autobiography-maximalist', strength: 8 },
      { archetypeId: 'compressed-heritage', strength: 9 },
    ],
    corpusEvidence: 'Inferred from cross-school-fit analysis in attested reviews. Yale rewards literary tradition (allusions, formal moves), sincerity, sophisticated humor. Not directly attested by admit data.',
  },
  {
    schoolId: 'princeton',
    dimensions: { craftDensity: 8, intellectualSpecificity: 7, biographicalLoad: 6, voiceRisk: 6, resolutionType: 'either' },
    archetypeAffinities: [
      { archetypeId: 'interior-transformation-metaphor-possession', strength: 9 },
      { archetypeId: 'metaphor-literalization-scientific', strength: 8 },
      { archetypeId: 'compressed-heritage', strength: 9 },
      { archetypeId: 'bait-and-switch-foil-refutation', strength: 8 },
      { archetypeId: 'obsession-intellectual-autobiography-maximalist', strength: 8 },
    ],
    corpusEvidence: 'Inferred from cross-school-fit analysis. Princeton tends toward sincerity, literary maturity, philosophical reach. Not directly attested by admit data.',
  },
  {
    schoolId: 'mit',
    dimensions: { craftDensity: 6, intellectualSpecificity: 9, biographicalLoad: 5, voiceRisk: 5, resolutionType: 'either' },
    archetypeAffinities: [
      { archetypeId: 'metaphor-literalization-scientific', strength: 9 },
      { archetypeId: 'mundane-topic-multi-lens', strength: 7 },
      { archetypeId: 'strategic-balance-plain-prose', strength: 6 },
    ],
    corpusEvidence: 'Inferred from cross-school-fit analysis. MIT rewards real intellectual engagement with technical domains; would reject essays without demonstrable STEM substance regardless of literary craft. Michelle\'s essay (with genuine biology) is the corpus exemplar of MIT-compatible humanistic-essay. Not directly attested by admit data.',
  },
  {
    schoolId: 'caltech',
    dimensions: { craftDensity: 5, intellectualSpecificity: 10, biographicalLoad: 4, voiceRisk: 4, resolutionType: 'either' },
    archetypeAffinities: [
      { archetypeId: 'metaphor-literalization-scientific', strength: 7 },
      { archetypeId: 'mundane-topic-multi-lens', strength: 6 },
    ],
    corpusEvidence: 'Inferred from cross-school-fit analysis. Caltech wants HIGH technical density. Most Harvard 2024 corpus essays would not clear Caltech\'s STEM bar. Not directly attested by admit data.',
  },
  {
    schoolId: 'uchicago',
    dimensions: { craftDensity: 9, intellectualSpecificity: 7, biographicalLoad: 6, voiceRisk: 9, resolutionType: 'either' },
    archetypeAffinities: [
      { archetypeId: 'mundane-topic-multi-lens', strength: 10 },
      { archetypeId: 'interior-transformation-metaphor-possession', strength: 9 },
      { archetypeId: 'child-memory-extended-metaphor-prophecy', strength: 10 },
      { archetypeId: 'metaphor-literalization-scientific', strength: 9 },
      { archetypeId: 'bait-and-switch-foil-refutation', strength: 9 },
      { archetypeId: 'obsession-intellectual-autobiography-maximalist', strength: 9 },
      { archetypeId: 'compressed-heritage', strength: 8 },
    ],
    corpusEvidence: 'Inferred from cross-school-fit analysis. UChicago LOVES formal restraint, formal experiments, literary-intellectual essays, mundane-topic elevation. Strong fit for most corpus archetypes EXCEPT plain-voice-sacrifice (UChicago typically wants formal-literary moves). Not directly attested by admit data.',
  },
  {
    schoolId: 'brown',
    dimensions: { craftDensity: 7, intellectualSpecificity: 6, biographicalLoad: 7, voiceRisk: 7, resolutionType: 'internal-preferred' },
    archetypeAffinities: [
      { archetypeId: 'bait-and-switch-foil-refutation', strength: 8 },
      { archetypeId: 'child-memory-extended-metaphor-prophecy', strength: 9 },
      { archetypeId: 'plain-voice-sacrifice-ritual', strength: 8 },
      { archetypeId: 'compressed-heritage', strength: 8 },
      { archetypeId: 'interior-transformation-metaphor-possession', strength: 8 },
      { archetypeId: 'metaphor-literalization-scientific', strength: 8 },
    ],
    corpusEvidence: 'Inferred from cross-school-fit analysis. Brown reads warmly for emotional honesty, willingness to refuse external resolution, open-curriculum ethos. Not directly attested by admit data.',
  },
  {
    schoolId: 'columbia',
    dimensions: { craftDensity: 7, intellectualSpecificity: 7, biographicalLoad: 7, voiceRisk: 6, resolutionType: 'either' },
    archetypeAffinities: [
      { archetypeId: 'obsession-intellectual-autobiography-maximalist', strength: 9 },
      { archetypeId: 'compressed-heritage', strength: 8 },
      { archetypeId: 'interior-transformation-metaphor-possession', strength: 8 },
      { archetypeId: 'metaphor-literalization-scientific', strength: 8 },
      { archetypeId: 'bait-and-switch-foil-refutation', strength: 7 },
    ],
    corpusEvidence: 'Inferred from cross-school-fit analysis. Columbia\'s policy/political dimension aligns with passion-to-policy bridging. Not directly attested by admit data.',
  },
  {
    schoolId: 'penn',
    dimensions: { craftDensity: 7, intellectualSpecificity: 6, biographicalLoad: 7, voiceRisk: 6, resolutionType: 'either' },
    archetypeAffinities: [
      { archetypeId: 'strategic-balance-plain-prose', strength: 7 },
      { archetypeId: 'compressed-heritage', strength: 8 },
      { archetypeId: 'interior-transformation-metaphor-possession', strength: 7 },
      { archetypeId: 'plain-voice-sacrifice-ritual', strength: 7 },
    ],
    corpusEvidence: 'Inferred from cross-school-fit analysis. Penn similar to other Ivy reads. Not directly attested by admit data.',
  },
  {
    schoolId: 'cornell',
    dimensions: { craftDensity: 7, intellectualSpecificity: 7, biographicalLoad: 7, voiceRisk: 6, resolutionType: 'either' },
    archetypeAffinities: [
      { archetypeId: 'compressed-heritage', strength: 8 },
      { archetypeId: 'plain-voice-sacrifice-ritual', strength: 7 },
      { archetypeId: 'interior-transformation-metaphor-possession', strength: 7 },
      { archetypeId: 'strategic-balance-plain-prose', strength: 7 },
    ],
    corpusEvidence: 'Inferred from cross-school-fit analysis. Not directly attested by admit data.',
  },
  {
    schoolId: 'dartmouth',
    dimensions: { craftDensity: 7, intellectualSpecificity: 6, biographicalLoad: 7, voiceRisk: 6, resolutionType: 'either' },
    archetypeAffinities: [
      { archetypeId: 'compressed-heritage', strength: 8 },
      { archetypeId: 'strategic-balance-plain-prose', strength: 7 },
      { archetypeId: 'plain-voice-sacrifice-ritual', strength: 7 },
      { archetypeId: 'child-memory-extended-metaphor-prophecy', strength: 7 },
    ],
    corpusEvidence: 'Inferred from cross-school-fit analysis. Not directly attested by admit data.',
  },
  {
    schoolId: 'duke',
    dimensions: { craftDensity: 7, intellectualSpecificity: 7, biographicalLoad: 7, voiceRisk: 6, resolutionType: 'either' },
    archetypeAffinities: [
      { archetypeId: 'plain-voice-sacrifice-ritual', strength: 8 },
      { archetypeId: 'compressed-heritage', strength: 8 },
      { archetypeId: 'obsession-intellectual-autobiography-maximalist', strength: 7 },
      { archetypeId: 'strategic-balance-plain-prose', strength: 7 },
    ],
    corpusEvidence: 'Inferred from cross-school-fit analysis (Lauren\'s review specifically: "Duke\'s political science would too"). Not directly attested by admit data.',
  },
  {
    schoolId: 'northwestern',
    dimensions: { craftDensity: 7, intellectualSpecificity: 7, biographicalLoad: 7, voiceRisk: 6, resolutionType: 'either' },
    archetypeAffinities: [
      { archetypeId: 'obsession-intellectual-autobiography-maximalist', strength: 8 },
      { archetypeId: 'compressed-heritage', strength: 7 },
      { archetypeId: 'plain-voice-sacrifice-ritual', strength: 7 },
      { archetypeId: 'mundane-topic-multi-lens', strength: 7 },
    ],
    corpusEvidence: 'Inferred from cross-school-fit analysis (Lauren\'s review: "Northwestern\'s theatre program would love her"). Not directly attested by admit data.',
  },
];
