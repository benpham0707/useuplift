import { analyzeOpeningHook } from './src/services/unified/features/openingHookAnalyzer_v3';

const testHook = `I have old hands.`;
const testFollowing = `They aren't just weathered from age; they're calloused from years of gripping fountain pens and conducting orchestras invisible to everyone but me. By thirteen, I'd written six novels no one would ever read and composed symphonies that existed only in the margins of my math homework.`;

async function debug() {
  try {
    const result = await analyzeOpeningHook(testHook + '\n\n' + testFollowing, {
      depth: 'comprehensive',
      essayType: 'creative'
    });

    console.log('\n=== FULL RESULT ===');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('ERROR:', error);
  }
}

debug();
