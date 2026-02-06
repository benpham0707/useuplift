/**
 * Quick diagnostic to test API key loading
 */
import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';

async function main() {
  const key = process.env.ANTHROPIC_API_KEY;
  console.log('Key length:', key?.length);
  console.log('Key starts with:', key?.substring(0, 15));
  console.log('Key ends with:', key?.substring(key.length - 10));

  try {
    const client = new Anthropic({ apiKey: key });
    console.log('Client created successfully');

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Say hello in 5 words' }]
    });
    console.log('Response:', response.content[0].type === 'text' ? response.content[0].text : 'No text');
    console.log('API KEY IS WORKING!');
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

main();
