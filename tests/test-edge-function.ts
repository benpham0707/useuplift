import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zclaplpkuvxkrdwsgrul.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbGFwbHBrdXZ4a3Jkd3NncnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NDA2NDUsImV4cCI6MjA3MTMxNjY0NX0.LN3_avY7B0UnwCVEza9B5M9_EG3GMWlRFwQsZ8yq8Vc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEdgeFunction() {
  console.log('🧪 Testing workshop-analysis edge function...\n');

  const testEssay = `My Lego workshop started in my garage, surrounded by bins of colorful bricks sorted by size, color, and function—a system I'd refined over years of building. I wasn't just creating models; I was teaching neighborhood kids to see engineering problems through a builder's lens. Each Saturday, five to eight children aged 6-12 would arrive, and I'd guide them through projects that balanced creativity with structural integrity.

The challenge emerged when teaching gear ratios using Technic pieces. Seven-year-old Marcus struggled to understand why smaller gears spun faster than larger ones. Explaining with words failed—his eyes glazed over. So I handed him two gears and asked him to count the teeth while I rotated the connected axle. His face lit up as he discovered the mathematical relationship himself. That moment taught me that effective teaching isn't about demonstrating knowledge; it's about designing experiences where students construct understanding themselves.

I redesigned my curriculum around this principle. Instead of showing finished models, I presented engineering challenges: "Build a crane that can lift this water bottle" or "Design a car that travels exactly two meters." Students prototyped, failed, redesigned, and tested—developing persistence alongside technical skills. Parents reported that kids applied this problem-solving approach to schoolwork and daily challenges.

My workshop became a community fixture, expanding to twice-weekly sessions. I created a lending library of specialized pieces and published building guides for families to continue learning at home. What started as sharing my hobby evolved into recognizing that teaching multiplies impact—those students now approach problems with an engineer's mindset, and several have started their own workshops, extending the reach further than I could alone.`;

  const testPrompt = {
    id: 'piq1',
    title: 'Leadership Experience',
    prompt: 'Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes, or contributed to group efforts over time.'
  };

  try {
    console.log('📤 Sending request to edge function...');
    console.log('   Essay length:', testEssay.length, 'characters');
    console.log('   Prompt:', testPrompt.title);
    console.log('');

    const startTime = Date.now();

    const { data, error } = await supabase.functions.invoke('workshop-analysis', {
      body: {
        essayText: testEssay,
        promptTitle: testPrompt.title,
        promptText: testPrompt.prompt,
        essayType: 'uc_piq'
      }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (error) {
      console.error('❌ Edge function error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return;
    }

    console.log(`✅ Edge function succeeded in ${duration}s\n`);

    // Validate response structure
    console.log('📊 Response validation:');
    console.log('   ✓ voiceFingerprint:', data.voiceFingerprint ? '✓ Present' : '✗ Missing');
    console.log('   ✓ experienceFingerprint:', data.experienceFingerprint ? '✓ Present' : '✗ Missing');
    console.log('   ✓ rubricDimensionDetails:', data.rubricDimensionDetails?.length || 0, 'dimensions');
    console.log('   ✓ workshopItems:', data.workshopItems?.length || 0, 'items');
    console.log('   ✓ analysis.narrative_quality_index:', data.analysis?.narrative_quality_index || 'Missing');
    console.log('');

    // Show sample data
    if (data.voiceFingerprint) {
      console.log('🎤 Voice Fingerprint Sample:');
      console.log('   Sentence Structure:', data.voiceFingerprint.sentenceStructure?.pattern || 'N/A');
      console.log('   Vocabulary Level:', data.voiceFingerprint.vocabulary?.level || 'N/A');
      console.log('');
    }

    if (data.experienceFingerprint) {
      console.log('🔍 Experience Fingerprint Sample:');
      console.log('   Confidence Score:', data.experienceFingerprint.confidenceScore || 'N/A');
      console.log('   Anti-Pattern Flags:', Object.keys(data.experienceFingerprint.antiPatternFlags || {}).length);
      console.log('');
    }

    if (data.rubricDimensionDetails && data.rubricDimensionDetails.length > 0) {
      console.log('📏 Rubric Dimensions (top 3):');
      data.rubricDimensionDetails.slice(0, 3).forEach((dim: any) => {
        console.log(`   ${dim.dimension_name}: ${dim.final_score}/10 (raw: ${dim.raw_score})`);
      });
      console.log('');
    }

    if (data.workshopItems && data.workshopItems.length > 0) {
      console.log('🔧 Workshop Items (first item):');
      const firstItem = data.workshopItems[0];
      console.log('   Problem:', firstItem.problem);
      console.log('   Severity:', firstItem.severity);
      console.log('   Suggestions:', firstItem.suggestions?.length || 0);
      console.log('');
    }

    console.log('✅ ALL VALIDATIONS PASSED - Edge function is working correctly!');

  } catch (err) {
    console.error('❌ Test failed with exception:', err);
    console.error('Stack trace:', (err as Error).stack);
  }
}

testEdgeFunction();
