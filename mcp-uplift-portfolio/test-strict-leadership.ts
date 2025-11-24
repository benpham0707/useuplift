#!/usr/bin/env node

/**
 * TEST STRICT PIQ 1 (LEADERSHIP) SCORING
 */

import { enableMockMode, initializeSupabase } from './src/database/supabaseClientTestable.js';
import { seedMockDatabase, clearMockDatabase } from './src/database/supabaseClientMock.js';
import { tools } from './src/tools/index.js';

enableMockMode();
initializeSupabase();

console.log('Testing Strict PIQ 1 Leadership Scoring...\n');

async function test(name: string, leadership: any, expected: [number, number]) {
  console.log(`━━━ ${name} ━━━`);

  clearMockDatabase();
  seedMockDatabase({
    user_id: 'test-001',
    profile: { leadership_roles: [leadership] }
  });

  const result = await tools.suggest_piq_prompts({ user_id: 'test-001' });
  const piq1 = result.recommendations.find((r: any) => r.prompt_number === 1);

  if (!piq1) {
    console.log('❌ PIQ 1 not recommended\n');
    return;
  }

  const [min, max] = expected;
  const ok = piq1.fit_score >= min && piq1.fit_score <= max;
  console.log(`Score: ${piq1.fit_score}/100 (expected ${min}-${max}) ${ok ? '✅' : '❌'}`);
  console.log(`Rationale: ${piq1.rationale.substring(0, 150)}...\n`);
}

(async () => {
  await test('Student Council President (school-wide, metrics, 12 hrs/week)', {
    name: 'Student Council President',
    hours_per_week: 12,
    impact: 'Led 25-person team. Organized 5 school-wide events serving 1,200 students. Improved student satisfaction scores by 40%. Managed $10,000 budget.'
  }, [68, 76]); // Impactful (40) + metrics (12) + breadth (6) + time (5) + transformation (18) = ~81... let me recalculate

  await test('Debate Captain (state champion)', {
    name: 'Debate Team Captain',
    hours_per_week: 12,
    impact: 'Led team to state championship. Mentored 20 students. Created new training curriculum adopted by 3 schools. Improved average speaker scores by 25%.'
  }, [80, 88]); // Impactful/Transformative + state + metrics + time

  await test('Club President (minimal impact)', {
    name: 'Chess Club President',
    hours_per_week: 5,
    impact: 'Organized weekly meetings. Managed 15 members.'
  }, [30, 40]); // Positional (22) + maybe some small bonuses

  process.exit(0);
})();
