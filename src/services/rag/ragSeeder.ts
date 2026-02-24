/**
 * RAG Content Seeder
 *
 * Extracts teaching content from existing codebase files and seeds it
 * into the rag_essay_fragments and rag_transformations pgvector tables.
 *
 * Content sources:
 * 1. PIQ Teaching Examples — weak→strong transformation pairs (21 items)
 * 2. Type-Specific Teaching — 14 essay type teaching modules
 * 3. Expert Counselor Knowledge Base — AO insights, narrative arcs, authenticity
 * 4. Rubric v1.0.0 — 11 activity evaluation dimensions
 * 5. PIQ Rubric — 13 PIQ evaluation dimensions
 * 6. Advanced Teaching Bundles — overclaiming, growth arc, tone/voice, etc.
 *
 * Run standalone:
 *   OPENAI_API_KEY="..." SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." npx tsx src/services/rag/ragSeeder.ts
 */

import { ragService } from './ragService';

// Source imports — read-only, never modified
import { PIQ_TEACHING_EXAMPLES } from '../piq/teachingExamples';
import { TYPE_TEACHING_FOCUS } from '../commonAppWorkshop/services/typeSpecificTeaching';
import {
  AO_READING_PROCESS,
  NARRATIVE_ARC_PATTERNS,
  AUTHENTICITY_INTELLIGENCE,
  ADVANCED_TEACHING_BUNDLES,
  PORTFOLIO_STRATEGY,
  CHARACTER_FRAMEWORK,
  CONSTRAINT_INTELLIGENCE,
} from '../portfolioStrategy/services/activityWorkshop/expertCounselorKnowledgeBase';
import { RUBRIC_CATEGORIES_DEFINITIONS } from '../../core/rubrics/v1.0.0';
import { PIQ_RUBRIC_DIMENSIONS } from '../piq/rubric';

// ============================================================================
// TYPES
// ============================================================================

interface SeedResult {
  fragmentsSeeded: number;
  transformationsSeeded: number;
  errors: string[];
}

interface FragmentInput {
  content: string;
  essayType?: string;
  promptType?: string;
  dimension?: string;
  qualityTier: 'excellent' | 'strong' | 'needs_work';
  college?: string;
  technique?: string;
  whyItWorks: string;
  transferablePrinciple: string;
  sourceInfo: string;
}

interface TransformationInput {
  beforeText: string;
  afterText: string;
  dimension?: string;
  technique?: string;
  essayType?: string;
  whyItWorks: string;
  principle: string;
  sourceInfo: string;
}

// ============================================================================
// DELAY UTILITY (rate-limit protection)
// ============================================================================

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// SOURCE 1: PIQ TEACHING EXAMPLES (~21 transformation pairs + 21 strong fragments)
// ============================================================================

function extractPIQTeachingExamples(): { fragments: FragmentInput[]; transformations: TransformationInput[] } {
  const fragments: FragmentInput[] = [];
  const transformations: TransformationInput[] = [];

  for (const example of PIQ_TEACHING_EXAMPLES) {
    // Map issueType to technique name
    const technique = example.issueType
      .replace(/-/g, ' ')
      .replace(/^(hook|vuln|arc|spec)\s/, (match) => {
        const map: Record<string, string> = {
          'hook ': 'Opening hook: ',
          'vuln ': 'Vulnerability: ',
          'arc ': 'Narrative arc: ',
          'spec ': 'Specificity: ',
        };
        return map[match] || match;
      });

    // Insert transformation (weak → strong)
    transformations.push({
      beforeText: example.weakExample,
      afterText: example.strongExample,
      dimension: example.dimension,
      technique,
      essayType: 'piq',
      whyItWorks: example.explanation,
      principle: example.principle,
      sourceInfo: `src/services/piq/teachingExamples.ts:${example.id}`,
    });

    // Insert the strong example as a standalone fragment
    fragments.push({
      content: example.strongExample,
      essayType: 'piq',
      promptType: example.essayContext,
      dimension: example.dimension,
      qualityTier: 'excellent',
      technique,
      whyItWorks: example.explanation,
      transferablePrinciple: example.principle,
      sourceInfo: `src/services/piq/teachingExamples.ts:${example.id}`,
    });
  }

  return { fragments, transformations };
}

// ============================================================================
// SOURCE 2: TYPE-SPECIFIC TEACHING (~14 fragments per essay type)
// ============================================================================

function extractTypeSpecificTeaching(): FragmentInput[] {
  const fragments: FragmentInput[] = [];

  for (const [essayType, focus] of Object.entries(TYPE_TEACHING_FOCUS)) {
    // Extract the "what makes excellent" as a teaching fragment
    fragments.push({
      content: `${focus.what_makes_excellent}\n\nKey insight most students miss: ${focus.what_students_miss}`,
      essayType: 'common_app',
      promptType: essayType,
      dimension: focus.primary_dimensions[0],
      qualityTier: 'excellent',
      technique: `${essayType} essay mastery`,
      whyItWorks: focus.evaluation_lens,
      transferablePrinciple: focus.teaching_priority,
      sourceInfo: `src/services/commonAppWorkshop/services/typeSpecificTeaching.ts:${essayType}`,
    });
  }

  return fragments;
}

// ============================================================================
// SOURCE 3: EXPERT COUNSELOR KNOWLEDGE BASE
// ============================================================================

function extractExpertCounselorKnowledge(): { fragments: FragmentInput[]; transformations: TransformationInput[] } {
  const fragments: FragmentInput[] = [];
  const transformations: TransformationInput[] = [];
  const sourceFile = 'src/services/portfolioStrategy/services/activityWorkshop/expertCounselorKnowledgeBase.ts';

  // 3a. AO Reading Process — Committee Pitch Test
  fragments.push({
    content: `The Committee Pitch Test: An AO must pitch your application to a committee of 15-20 colleagues in approximately 90 seconds. They need: ${AO_READING_PROCESS.committeePitchTest.whatAONeeds.join('; ')}. Activities provide the EVIDENCE for the hook. ${AO_READING_PROCESS.committeePitchTest.howActivitiesHelp}. Gold standard: ${AO_READING_PROCESS.committeePitchTest.goldStandard}`,
    essayType: 'activity',
    dimension: 'role_clarity_ownership',
    qualityTier: 'excellent',
    technique: 'committee pitch test',
    whyItWorks: 'Understanding how AOs present applications to committee helps students write descriptions that serve as ammunition for their advocate.',
    transferablePrinciple: 'Write activity descriptions clear enough that an AO can read them aloud to a committee and the room nods.',
    sourceInfo: `${sourceFile}:AO_READING_PROCESS.committeePitchTest`,
  });

  // 3b. The "Oof Factor" — what makes AOs lean forward
  for (const trigger of AO_READING_PROCESS.oofFactor.triggers) {
    fragments.push({
      content: `"Oof Factor" signal: ${trigger.signal}. Example: ${trigger.example}. Why it works: ${trigger.why}`,
      essayType: 'activity',
      dimension: 'specificity_evidence',
      qualityTier: 'excellent',
      technique: `oof factor: ${trigger.signal.toLowerCase().slice(0, 40)}`,
      whyItWorks: trigger.why,
      transferablePrinciple: `${trigger.signal} — this pattern makes AOs pause scanning and actually READ your description.`,
      sourceInfo: `${sourceFile}:AO_READING_PROCESS.oofFactor`,
    });
  }

  // 3c. Narrative Arc Patterns (7 arcs)
  for (const arc of NARRATIVE_ARC_PATTERNS.arcs) {
    fragments.push({
      content: `${arc.name}: ${arc.pattern}. Why AOs value this: ${arc.why}. Example trajectory: ${arc.example}. Tier 1 indicators: ${arc.tier1Indicators}`,
      essayType: 'activity',
      dimension: 'narrative_arc_stakes',
      qualityTier: 'excellent',
      technique: `narrative arc: ${arc.name.toLowerCase()}`,
      whyItWorks: arc.why,
      transferablePrinciple: `The ${arc.name} shows ${arc.signals.slice(0, 2).join(' and ')} — school fit: ${arc.schoolFit.slice(0, 3).join(', ')}`,
      sourceInfo: `${sourceFile}:NARRATIVE_ARC_PATTERNS.${arc.name.replace(/\s/g, '')}`,
    });
  }

  // 3d. Authenticity genuine signals
  for (const signal of AUTHENTICITY_INTELLIGENCE.genuineSignals) {
    fragments.push({
      content: `Authenticity signal (${signal.weight}): ${signal.signal}. Why: ${signal.why}. Example: ${signal.example}`,
      essayType: 'activity',
      dimension: 'voice_integrity',
      qualityTier: 'strong',
      technique: `authenticity: ${signal.signal.toLowerCase().slice(0, 40)}`,
      whyItWorks: signal.why,
      transferablePrinciple: signal.signal,
      sourceInfo: `${sourceFile}:AUTHENTICITY_INTELLIGENCE.genuineSignals`,
    });
  }

  // 3e. Advanced Teaching Bundles — each has a before/after example
  for (const [key, bundle] of Object.entries(ADVANCED_TEACHING_BUNDLES)) {
    // Extract the teaching fragment
    fragments.push({
      content: `${bundle.theProblem.headline}: ${bundle.theProblem.explanation}\n\nWhat to do: ${bundle.whatToDo.principle}\n\nSteps: ${bundle.whatToDo.steps.slice(0, 3).join('; ')}`,
      essayType: 'activity',
      dimension: bundle.issueType === 'tone_voice_issues' ? 'voice_integrity' : 'specificity_evidence',
      qualityTier: 'strong',
      technique: `advanced teaching: ${bundle.issueType}`,
      whyItWorks: `${bundle.whyThisWorks.admissionsQuote} — ${bundle.whyThisWorks.quoteSource}`,
      transferablePrinciple: bundle.whatToDo.principle,
      sourceInfo: `${sourceFile}:ADVANCED_TEACHING_BUNDLES.${key}`,
    });

    // Extract before/after examples as transformations
    for (const ex of bundle.examples) {
      transformations.push({
        beforeText: ex.before,
        afterText: ex.after,
        dimension: bundle.issueType === 'tone_voice_issues' ? 'voice_integrity' : 'specificity_evidence',
        technique: bundle.issueType,
        essayType: 'activity',
        whyItWorks: `${ex.principleApplied}. ${bundle.whyThisWorks.psychology}`,
        principle: bundle.whatToDo.principle,
        sourceInfo: `${sourceFile}:ADVANCED_TEACHING_BUNDLES.${key}.examples`,
      });
    }
  }

  // 3f. School Intelligence — school archetypes (5 types)
  // (imported via SCHOOL_INTELLIGENCE but we already have it in scope from expertCounselorKnowledgeBase)
  // We'll import it directly since it's a named export

  // 3g. Character Framework traits
  for (const trait of CHARACTER_FRAMEWORK.traits) {
    fragments.push({
      content: `Character trait: ${trait.trait}. What AOs look for: ${trait.whatAOsLookFor}. Signals: ${trait.activitySignals.join('; ')}. Description language: ${trait.descriptionLanguage}. Anti-signals: ${trait.antiSignals}`,
      essayType: 'activity',
      dimension: 'reflection_meaning',
      qualityTier: 'strong',
      technique: `character trait: ${trait.trait.toLowerCase()}`,
      whyItWorks: `AOs evaluate applicants on personal qualities. ${trait.trait} is demonstrated through ${trait.activitySignals[0].toLowerCase()}.`,
      transferablePrinciple: trait.whatAOsLookFor,
      sourceInfo: `${sourceFile}:CHARACTER_FRAMEWORK.traits.${trait.trait}`,
    });
  }

  // 3h. Portfolio anti-patterns
  for (const anti of PORTFOLIO_STRATEGY.antiPatterns) {
    fragments.push({
      content: `Portfolio anti-pattern: "${anti.name}" — ${anti.description}. Problem: ${anti.problem}. Fix: ${anti.fix}`,
      essayType: 'activity',
      dimension: 'fit_trajectory',
      qualityTier: 'strong',
      technique: `portfolio strategy: ${anti.name.toLowerCase()}`,
      whyItWorks: `Identifying and avoiding the "${anti.name}" anti-pattern strengthens portfolio coherence and AO impression.`,
      transferablePrinciple: anti.fix,
      sourceInfo: `${sourceFile}:PORTFOLIO_STRATEGY.antiPatterns.${anti.name.replace(/\s/g, '')}`,
    });
  }

  // 3i. Constraint intelligence levels
  for (const level of CONSTRAINT_INTELLIGENCE.levels) {
    fragments.push({
      content: `Constraint Level ${level.level}: ${level.name} — ${level.description}. Examples: ${level.examples.slice(0, 3).join('; ')}. Evaluation note: ${level.evaluationNote}`,
      essayType: 'activity',
      dimension: 'context_circumstances',
      qualityTier: 'strong',
      technique: `constraint intelligence: level ${level.level}`,
      whyItWorks: `Understanding constraint levels ensures fair evaluation — achievement weighed against access, not absolute metrics.`,
      transferablePrinciple: level.evaluationNote,
      sourceInfo: `${sourceFile}:CONSTRAINT_INTELLIGENCE.levels[${level.level - 1}]`,
    });
  }

  return { fragments, transformations };
}

// ============================================================================
// SOURCE 4: RUBRIC v1.0.0 (11 activity evaluation dimensions)
// ============================================================================

function extractRubricDimensions(): FragmentInput[] {
  const fragments: FragmentInput[] = [];

  for (const [key, def] of Object.entries(RUBRIC_CATEGORIES_DEFINITIONS)) {
    // Extract dimension definition with anchors
    fragments.push({
      content: `${def.display_name} (weight: ${def.weight}): ${def.definition}\n\nScore anchors:\n- 0/10: ${def.anchor_0}\n- 5/10: ${def.anchor_5}\n- 10/10: ${def.anchor_10}`,
      essayType: 'activity',
      dimension: key,
      qualityTier: 'excellent',
      technique: `rubric dimension: ${def.display_name.toLowerCase()}`,
      whyItWorks: `Understanding scoring anchors helps writers target the 10/10 level for ${def.display_name}.`,
      transferablePrinciple: `${def.display_name}: ${def.writer_prompts[0]}`,
      sourceInfo: `src/core/rubrics/v1.0.0.ts:${key}`,
    });

    // Extract writer prompts as a separate fragment
    fragments.push({
      content: `Writing prompts for ${def.display_name}:\n${def.writer_prompts.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\nWarning signs to avoid: ${def.warning_signs.join('; ')}`,
      essayType: 'activity',
      dimension: key,
      qualityTier: 'strong',
      technique: `writing guidance: ${def.display_name.toLowerCase()}`,
      whyItWorks: `These prompts help students move beyond surface-level writing to authentic, specific descriptions.`,
      transferablePrinciple: def.evaluator_prompts.join(' '),
      sourceInfo: `src/core/rubrics/v1.0.0.ts:${key}:writer_prompts`,
    });
  }

  return fragments;
}

// ============================================================================
// SOURCE 5: PIQ RUBRIC (13 PIQ evaluation dimensions)
// ============================================================================

function extractPIQRubricDimensions(): FragmentInput[] {
  const fragments: FragmentInput[] = [];

  for (const dim of PIQ_RUBRIC_DIMENSIONS) {
    fragments.push({
      content: `PIQ Dimension: ${dim.name} (Tier: ${dim.tier}, Weight: ${dim.weight}, Priority: ${dim.priority})\n\n${dim.description}\n\nWhat we evaluate:\n${dim.whatWeEvaluate.map((c, i) => `${i + 1}. ${c}`).join('\n')}`,
      essayType: 'piq',
      dimension: dim.dimension,
      qualityTier: 'strong',
      technique: `piq dimension: ${dim.name.toLowerCase()}`,
      whyItWorks: `Understanding the ${dim.name} dimension helps students focus on what UC admissions readers specifically evaluate.`,
      transferablePrinciple: `${dim.name}: ${dim.whatWeEvaluate[0]}`,
      sourceInfo: `src/services/piq/rubric.ts:${dim.dimension}`,
    });
  }

  return fragments;
}

// ============================================================================
// MAIN SEEDER
// ============================================================================

export async function seedRAGContent(): Promise<SeedResult> {
  const result: SeedResult = {
    fragmentsSeeded: 0,
    transformationsSeeded: 0,
    errors: [],
  };

  console.log('[RAGSeeder] Starting content extraction...');

  // ── Extract all content ──────────────────────────────────────────────
  const piq = extractPIQTeachingExamples();
  const typeSpecific = extractTypeSpecificTeaching();
  const expert = extractExpertCounselorKnowledge();
  const rubric = extractRubricDimensions();
  const piqRubric = extractPIQRubricDimensions();

  const allFragments: FragmentInput[] = [
    ...piq.fragments,
    ...typeSpecific,
    ...expert.fragments,
    ...rubric,
    ...piqRubric,
  ];

  const allTransformations: TransformationInput[] = [
    ...piq.transformations,
    ...expert.transformations,
  ];

  console.log(`[RAGSeeder] Extracted ${allFragments.length} fragments and ${allTransformations.length} transformations`);
  console.log(`  - PIQ Teaching Examples: ${piq.fragments.length} fragments, ${piq.transformations.length} transformations`);
  console.log(`  - Type-Specific Teaching: ${typeSpecific.length} fragments`);
  console.log(`  - Expert Counselor: ${expert.fragments.length} fragments, ${expert.transformations.length} transformations`);
  console.log(`  - Rubric v1.0.0: ${rubric.length} fragments`);
  console.log(`  - PIQ Rubric: ${piqRubric.length} fragments`);

  // ── Seed fragments ───────────────────────────────────────────────────
  console.log('\n[RAGSeeder] Seeding fragments...');

  for (let i = 0; i < allFragments.length; i++) {
    const fragment = allFragments[i];
    try {
      await ragService.addFragment(fragment);
      result.fragmentsSeeded++;

      if ((i + 1) % 10 === 0 || i === allFragments.length - 1) {
        console.log(`  Fragments: ${i + 1}/${allFragments.length} seeded`);
      }

      // Rate limit: small delay every 5 items to avoid OpenAI rate limits
      if ((i + 1) % 5 === 0) {
        await delay(200);
      }
    } catch (error) {
      const msg = `Fragment ${i + 1} (${fragment.sourceInfo}): ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`  ERROR: ${msg}`);
      result.errors.push(msg);
    }
  }

  // ── Seed transformations ─────────────────────────────────────────────
  console.log('\n[RAGSeeder] Seeding transformations...');

  for (let i = 0; i < allTransformations.length; i++) {
    const transform = allTransformations[i];
    try {
      await ragService.addTransformation(transform);
      result.transformationsSeeded++;

      if ((i + 1) % 5 === 0 || i === allTransformations.length - 1) {
        console.log(`  Transformations: ${i + 1}/${allTransformations.length} seeded`);
      }

      // Rate limit: transformations embed 2 texts each, so slower pace
      if ((i + 1) % 3 === 0) {
        await delay(300);
      }
    } catch (error) {
      const msg = `Transformation ${i + 1} (${transform.sourceInfo}): ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`  ERROR: ${msg}`);
      result.errors.push(msg);
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────
  console.log('\n[RAGSeeder] ══════════════════════════════════════');
  console.log(`  Fragments seeded:       ${result.fragmentsSeeded}/${allFragments.length}`);
  console.log(`  Transformations seeded:  ${result.transformationsSeeded}/${allTransformations.length}`);
  console.log(`  Errors:                  ${result.errors.length}`);
  if (result.errors.length > 0) {
    console.log('  Error details:');
    for (const err of result.errors) {
      console.log(`    - ${err}`);
    }
  }
  console.log('[RAGSeeder] ══════════════════════════════════════\n');

  return result;
}

// ============================================================================
// STANDALONE RUNNER
// ============================================================================

// Run when executed directly: npx tsx src/services/rag/ragSeeder.ts
const isMainModule = typeof require !== 'undefined' && require.main === module;
const isDirectRun = process.argv[1]?.endsWith('ragSeeder.ts') || process.argv[1]?.endsWith('ragSeeder.js');

if (isMainModule || isDirectRun) {
  console.log('[RAGSeeder] Running as standalone script...\n');

  // Validate env
  const missing: string[] = [];
  if (!process.env.OPENAI_API_KEY) missing.push('OPENAI_API_KEY');
  if (!process.env.SUPABASE_URL && !process.env.VITE_SUPABASE_URL) missing.push('SUPABASE_URL or VITE_SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.VITE_SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_SERVICE_ROLE_KEY');

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  seedRAGContent()
    .then((result) => {
      if (result.errors.length > 0) {
        console.log(`Completed with ${result.errors.length} errors.`);
        process.exit(1);
      }
      console.log('Seeding complete!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
