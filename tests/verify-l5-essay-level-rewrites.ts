/**
 * Standalone verification for the essay-level L5 rewrite generator
 * (generateEssayLevelRewrites) — surface #2 of the mentor-grade output initiative.
 *
 * Loads the fresh crochet EssayProfile (L1-L4 dump, with the new mentor-grade
 * coachingMap.priorities), runs assembleRewriteInputs + generateEssayLevelRewrites,
 * and dumps the draftVariants / voicePreservationNotes / antiPattern so we can
 * score the L5_GENERATIVE_DOOR_DIRECTIVE against the bar. ~$0.11-0.20, single call.
 *
 * Usage: npx tsx tests/verify-l5-essay-level-rewrites.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

import {
  assembleRewriteInputs,
  generateEssayLevelRewrites,
} from '../src/services/essayIntelligence/analysis/rewriteGeneration';
import type { EssayProfile } from '../src/services/essayIntelligence/profileTypes';

async function main(): Promise<void> {
  const profilePath = path.join(__dirname, 'output', 'full-profile-14-harvard-2028-crochet.json');
  const profile = JSON.parse(fs.readFileSync(profilePath, 'utf-8')) as EssayProfile;

  const input = assembleRewriteInputs(profile);
  console.log(`Assembled ${input.gaps.length} gaps, ${input.constraints.preserveSpans.length} preserve-spans.`);

  const result = await generateEssayLevelRewrites(input, {
    scale: profile.northStar.activeScale,
    essayId: 'crochet-l5-verify',
  });

  const outJson = path.join(__dirname, 'output', 'l5-essay-level-crochet-VERIFY.json');
  fs.writeFileSync(outJson, JSON.stringify(result, null, 2));

  console.log(`\n=== ${result.growthAnnotations.length} GROWTH ANNOTATIONS ===\n`);
  for (const g of result.growthAnnotations) {
    console.log(`\n──────── GAP ${g.addressesGapId} (${g.teachingMode}) ────────`);
    console.log(`CONTENT: ${g.content}`);
    const drafts = (g as { draftVariants?: Array<Record<string, unknown>> }).draftVariants ?? [];
    for (const d of drafts) {
      const ap = (d.antiPattern ?? {}) as Record<string, unknown>;
      console.log(`\n  [${d.intensityLevel}] (wordDelta=${d.wordDelta})`);
      console.log(`  TEXT: ${d.text}`);
      console.log(`  VOICE-PRESERVATION: ${d.voicePreservationNotes}`);
      console.log(`  ANTI-PATTERN: ${ap.text}`);
      console.log(`  WHY IT FAILS: ${ap.whyItFails}`);
    }
  }
  console.log(`\n\nCOST: $${result.cost.toFixed(4)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
