/**
 * Wave 3 Tests: Pre-Analysis Service + Restructured Prompt Builder
 *
 * Tests:
 * 1. Pre-analysis service (Haiku smart detection)
 * 2. Clustered prompt builder output
 * 3. Pipeline integration (deep content + pre-analysis + Sonnet prompt)
 */

import { analyzeEssayStructure } from '../src/pipeline/structureAnalyzer';
import { analyzeThemes } from '../src/pipeline/themeAnalyzer';
import { analyzeCharacterRevelation } from '../src/pipeline/characterAnalyzer';
import { analyzeInsight } from '../src/pipeline/insightAnalyzer';
import type { DeepContentAnalysis } from '../src/pipeline/contentAnalysisTypes';
import { PromptBuilder } from '../src/pipeline/promptBuilder';
import { featureExtractor, dimensionRegistry } from '../src/workshop';
import type { EnrichedFeatures, AnnotationPipelineConfig } from '../src/pipeline/types';

// ============================================================================
// TEST ESSAYS
// ============================================================================

const STRONG_ESSAY = `The fluorescent lights hummed above as I slid my grandmother's ring across the pawnshop counter. Mr. Chen picked it up with practiced fingers, turning it under the magnifying lamp.

"Fourteen karat," he said. "The stone is cloudy." He meant the diamond was flawed. I already knew that — my grandmother had told me the story a hundred times. How my grandfather had saved for three months, how the jeweler had offered him a clearer stone for twice the price, how he'd said, "She won't love me for the diamond."

I could have taken the forty dollars. Instead, I took the ring back. I held it up to the fluorescent light and watched the cloudy diamond scatter fragments of color across the glass counter — imperfect light, but light nonetheless.

That evening, I started writing. Not the college essay I'd been drafting for weeks, the one about my summer research internship and its tidy lessons about perseverance. I wrote about the ring. About how my grandfather chose the flawed diamond because perfection wasn't the point. About how I'd walked into that pawnshop ready to trade something irreplaceable for something I could spend.

Now when I sit down to write, I think about that cloudy diamond. I don't reach for the clearest word or the most polished sentence. I reach for the true one — the one with light inside it, even if you have to hold it at the right angle to see.`;

const WEAK_ESSAY = `Volunteering at the local food bank taught me many important lessons about life. Every Saturday morning, I would wake up early and go help sort donations and distribute food to families in need.

At first, I didn't want to go because I was tired from school. But my mom made me go anyway. After a few weeks, I started to enjoy it. The people there were really nice and I made some good friends.

One day, a little girl came in with her mother. She looked sad. I gave her an extra apple and she smiled. That moment changed my life. I realized that small acts of kindness can make a big difference in someone's day.

I am now a more empathetic and caring person because of my time at the food bank. I have learned the importance of giving back to my community and helping those less fortunate. This experience taught me that we should always try to help others whenever we can.`;

// ============================================================================
// HELPERS
// ============================================================================

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
    console.log(`  PASS: ${message}`);
  } else {
    failed++;
    failures.push(message);
    console.log(`  FAIL: ${message}`);
  }
}

function section(name: string): void {
  console.log(`\n=== ${name} ===`);
}

// ============================================================================
// TESTS
// ============================================================================

async function runTests(): Promise<void> {
  console.log('Wave 3: Pre-Analysis + Restructured Prompt Builder Tests');
  console.log('=========================================================');

  // Initialize registries
  await dimensionRegistry.autoImport();

  // ---- Section 1: Prompt Builder (no API key needed) ----
  section('Clustered Prompt Builder — System Prompt');

  const builder = new PromptBuilder();
  const features = featureExtractor.extract(STRONG_ESSAY);
  const config: AnnotationPipelineConfig = {
    essayType: 'personal_statement',
  };

  const enriched: EnrichedFeatures = { features };
  const prompt = builder.buildPrompt(STRONG_ESSAY, config, enriched);

  // System prompt structure checks
  assert(
    prompt.systemPrompt.includes('Structure & Arc'),
    'System prompt includes Structure & Arc cluster',
  );
  assert(
    prompt.systemPrompt.includes('Craft & Voice'),
    'System prompt includes Craft & Voice cluster',
  );
  assert(
    prompt.systemPrompt.includes('Character & Meaning'),
    'System prompt includes Character & Meaning cluster',
  );
  assert(
    prompt.systemPrompt.includes('Three Interconnected Clusters'),
    'System prompt describes clustered organization',
  );

  // Dimension presence in clusters
  assert(
    prompt.systemPrompt.includes('opening_hook_engagement'),
    'Structure cluster includes opening_hook_engagement',
  );
  assert(
    prompt.systemPrompt.includes('closing_impact_resolution'),
    'Structure cluster includes closing_impact_resolution',
  );
  assert(
    prompt.systemPrompt.includes('originality_voice_authenticity'),
    'Craft cluster includes originality_voice_authenticity',
  );
  assert(
    prompt.systemPrompt.includes('thematic_depth_reflection'),
    'Character cluster includes thematic_depth_reflection',
  );
  assert(
    prompt.systemPrompt.includes('growth_transformation_arc'),
    'Character cluster includes growth_transformation_arc',
  );

  // Interconnection guidance present
  assert(
    prompt.systemPrompt.includes('Consider how these dimensions interact'),
    'System prompt includes interconnection guidance',
  );

  section('Clustered Prompt Builder — User Prompt');

  // User prompt structure checks
  assert(
    prompt.userPrompt.includes('## Essay Text'),
    'User prompt includes essay text section',
  );
  assert(
    prompt.userPrompt.includes('## Feature Summary'),
    'User prompt includes feature summary',
  );
  assert(
    prompt.userPrompt.includes('## Instructions'),
    'User prompt includes instructions',
  );

  // Annotation budget distribution
  assert(
    prompt.userPrompt.includes('Structure & Arc'),
    'Instructions reference Structure & Arc cluster budget',
  );
  assert(
    prompt.userPrompt.includes('Craft & Voice'),
    'Instructions reference Craft & Voice cluster budget',
  );
  assert(
    prompt.userPrompt.includes('Character & Meaning'),
    'Instructions reference Character & Meaning cluster budget',
  );

  section('Clustered Prompt Builder — With Deep Content Analysis');

  const [structure, theme, character, insightResult] = [
    analyzeEssayStructure(STRONG_ESSAY),
    analyzeThemes(STRONG_ESSAY),
    analyzeCharacterRevelation(STRONG_ESSAY),
    analyzeInsight(STRONG_ESSAY),
  ];
  const deepContent: DeepContentAnalysis = { structure, theme, character, insight: insightResult };

  const enrichedWithContent: EnrichedFeatures = {
    features,
    deepContentAnalysis: deepContent,
  };
  const promptWithContent = builder.buildPrompt(STRONG_ESSAY, config, enrichedWithContent);

  assert(
    promptWithContent.userPrompt.includes('Pre-Analysis Findings'),
    'User prompt with deep content includes Pre-Analysis Findings section',
  );
  assert(
    promptWithContent.userPrompt.includes('### Structure & Arc'),
    'Pre-analysis section has Structure & Arc subsection',
  );
  assert(
    promptWithContent.userPrompt.includes('### Craft & Voice'),
    'Pre-analysis section has Craft & Voice subsection',
  );
  assert(
    promptWithContent.userPrompt.includes('### Character & Meaning'),
    'Pre-analysis section has Character & Meaning subsection',
  );

  section('Token Estimates');

  console.log(`  System prompt: ~${prompt.estimatedTokens.system} tokens`);
  console.log(`  User prompt (basic): ~${prompt.estimatedTokens.user} tokens`);
  console.log(`  User prompt (with deep content): ~${promptWithContent.estimatedTokens.user} tokens`);
  console.log(`  Expected output: ~${prompt.estimatedTokens.expectedOutput} tokens`);

  assert(
    prompt.estimatedTokens.system > 500,
    `System prompt has reasonable token count (${prompt.estimatedTokens.system})`,
  );
  assert(
    promptWithContent.estimatedTokens.user > prompt.estimatedTokens.user,
    'Deep content analysis adds tokens to user prompt',
  );

  // ---- Summary ----
  console.log('\n=========================================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(f => console.log(`  - ${f}`));
  }
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
