// Direct test of the API
const fetch = require('node-fetch');

async function testAPI() {
  const payload = {
    entry: {
      id: 'test-direct',
      title: 'Food Bank Volunteer',
      category: 'service',
      description_original: 'I volunteered at a local food bank distributing meals.',
      role: 'Volunteer',
      hours_per_week: 5,
      weeks_per_year: 30
    },
    options: {
      depth: 'quick',
      skip_coaching: false
    }
  };

  console.log('Testing API at http://localhost:8789/api/v1/analyze/extracurricular');
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch('http://localhost:8789/api/v1/analyze/extracurricular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('HTTP Error:', response.status);
      const text = await response.text();
      console.error('Response:', text);
      return;
    }

    const result = await response.json();
    console.log('\n=== SUCCESS ===');
    console.log('NQI Score:', result.report.narrative_quality_index);
    console.log('First 3 category scores:');
    result.report.categories.slice(0, 3).forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.score_0_to_10}/10`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
