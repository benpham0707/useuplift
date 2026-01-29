import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zclaplpkuvxkrdwsgrul.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbGFwbHBrdXZ4a3Jkd3NncnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NDA2NDUsImV4cCI6MjA3MTMxNjY0NX0.LN3_avY7B0UnwCVEza9B5M9_EG3GMWlRFwQsZ8yq8Vc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPIQIntegration() {
  console.log('🧪 Testing PIQ Workshop Integration Data Structure...\n');

  const testEssay = `My Lego workshop started in my garage, surrounded by bins of colorful bricks.`;

  const testPrompt = {
    id: 'piq1',
    title: 'Leadership Experience',
    prompt: 'Describe an example of your leadership experience.'
  };

  try {
    console.log('📤 Calling edge function...');

    const { data, error } = await supabase.functions.invoke('workshop-analysis', {
      body: {
        essayText: testEssay,
        promptTitle: testPrompt.title,
        promptText: testPrompt.prompt,
        essayType: 'uc_piq'
      }
    });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Response received\n');

    // Print full data structure
    console.log('📊 FULL DATA STRUCTURE:');
    console.log(JSON.stringify(data, null, 2));

    console.log('\n🔍 DATA VALIDATION:');
    console.log('voiceFingerprint type:', typeof data.voiceFingerprint);
    console.log('voiceFingerprint:', data.voiceFingerprint);

    console.log('\nexperienceFingerprint type:', typeof data.experienceFingerprint);
    console.log('experienceFingerprint:', data.experienceFingerprint);

    console.log('\nrubricDimensionDetails type:', typeof data.rubricDimensionDetails);
    console.log('rubricDimensionDetails length:', data.rubricDimensionDetails?.length);

    console.log('\nworkshopItems type:', typeof data.workshopItems);
    console.log('workshopItems length:', data.workshopItems?.length);

  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

testPIQIntegration();
