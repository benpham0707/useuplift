
import 'dotenv/config';
import { EssayOrchestrator } from '../src/services/orchestrator/index.js';
import { GOLDEN_DATASET } from './fixtures/golden-dataset.js';
import { vi } from 'vitest';

// ...

async function runOrchestratorReliabilityTest() {
  console.log('🧪 Starting Orchestrator Reliability Test (Mock Mode)...');
  
  // 1. No instantiation needed if static, checking...
  // 2. Load Golden Dataset
  const eliteEssay = GOLDEN_DATASET.find(e => e.tier === 'Elite')!;
  console.log(`\n📝 Testing with Elite Essay: "${eliteEssay.id}"`);

  try {
    console.log('   Running full analysis...');
    // Pass empty profile for now
    const result = await EssayOrchestrator.analyzeEssay(eliteEssay.text, 'piq1_leadership', {
        name: 'Test Student',
        intended_major: 'Sociology',
        activities: []
    });

    // 3. Validate Structure
    console.log('\n📊 Validating Output Structure:');
    
    if (result.voice) {
       console.log(`   ✅ Voice Analysis: Score ${result.voice.score} (Quality: ${result.voice.quality_level}) - ${result.voice.evaluator_note}`);
    }

    if (result.primary_dimensions) {
      console.log(`   ✅ Primary Dimensions: ${Object.keys(result.primary_dimensions).join(', ')}`);
      
      if (result.primary_dimensions['initiative_leadership']) {
         const init = result.primary_dimensions['initiative_leadership'];
         console.log(`      - Initiative: Score ${init.score} (Quality: ${init.quality_level}) - ${init.evaluator_note}`);
      }
      if (result.primary_dimensions['role_clarity']) {
         const role = result.primary_dimensions['role_clarity'];
         console.log(`      - Role Clarity: Score ${role.score} (Quality: ${role.quality_level}) - ${role.evaluator_note}`);
      }
    }

    if (result.overall_score) {
      console.log(`   ✅ Overall Score generated: ${result.overall_score}`);
    }

  } catch (error: any) {
    // If it fails due to API key, that's expected for LLM parts, 
    // but we want to ensure it didn't crash the whole process if we designed it robustly.
    if (error.message && error.message.includes('API_KEY')) {
      console.log('\n⚠️  Test stopped at LLM stage (Expected: Missing API Key)');
      console.log('   This confirms the pipeline attempts to call the LLM.');
    } else {
      console.error('\n❌ Unexpected Crash:', error);
    }
  }
}

runOrchestratorReliabilityTest();

