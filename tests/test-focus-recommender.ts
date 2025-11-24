
import { FocusRecommender } from '../src/services/recommendation/focusRecommender';
import { EssayAnalysisResult } from '../src/services/orchestrator/types';

// Mock Analysis Result with clear flaws
const flawedAnalysis: EssayAnalysisResult = {
    metadata: {
        promptType: 'piq1_leadership',
        timestamp: '2023-01-01',
        wordCount: 300
    },
    voice: {
        quality_level: 'robot',
        weaknesses: ['Passive voice'],
        score: 4.5 // Should trigger full_rewrite
    },
    narrative_arc: {
        present: true,
        climax_quality: 'summary', // Should trigger pivot_moment
        score: 6.0
    },
    opening_hook: {
        hook_type: 'generic',
        score: 5.0 // Should trigger hook
    },
    thematic_coherence: {
        score: 8.0
    },
    holistic_context: {
        narrative_quality: {
            blind_spots: [],
            coherence_score: 80,
            recurring_motifs: [],
            spine: [],
            spike: [],
            lift: []
        }
    } as any,
    primary_dimensions: {},
    secondary_dimensions: {},
    craft: {},
    specificity: {},
    vulnerability: {}
};

function runTests() {
    console.log('=== TEST: Focus Recommender ===');
    
    const recs = FocusRecommender.recommend(flawedAnalysis);
    
    console.log('Recommendations found:', recs.length);
    recs.forEach(r => {
        console.log(`- [Priority ${r.priority}] Focus: ${r.focusArea}`);
        console.log(`  Reason: ${r.reason}`);
        console.log(`  Strategy: ${r.strategy}`);
    });

    // Assertions
    const hasFullRewrite = recs.some(r => r.focusArea === 'full_rewrite');
    const hasHook = recs.some(r => r.focusArea === 'hook');
    const hasPivot = recs.some(r => r.focusArea === 'pivot_moment');

    if (hasFullRewrite && hasHook && hasPivot) {
        console.log('PASSED: Identified all expected flaws.');
    } else {
        console.error('FAILED: Missed some recommendations.');
    }
    
    // Check priority sorting
    if (recs[0].priority <= recs[1].priority) {
        console.log('PASSED: Correctly sorted by priority.');
    } else {
        console.error('FAILED: Incorrect sorting.');
    }
}

runTests();

