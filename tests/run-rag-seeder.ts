/**
 * RAG Seeder Runner — loads dotenv + maps UPLIFT_OPENAI_KEY → OPENAI_API_KEY
 */
import 'dotenv/config';

// Map key name
if (!process.env.OPENAI_API_KEY && process.env.UPLIFT_OPENAI_KEY) {
  process.env.OPENAI_API_KEY = process.env.UPLIFT_OPENAI_KEY;
}

// Validate
const missing: string[] = [];
if (!process.env.OPENAI_API_KEY) missing.push('OPENAI_API_KEY or UPLIFT_OPENAI_KEY');
if (!process.env.VITE_SUPABASE_URL && !process.env.SUPABASE_URL) missing.push('SUPABASE_URL');
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');

if (missing.length > 0) {
  console.error('Missing env vars:', missing.join(', '));
  process.exit(1);
}

console.log('Environment OK. Starting seeder...\n');

import { seedRAGContent } from '../src/services/rag/ragSeeder';

seedRAGContent()
  .then((result) => {
    console.log('\nFinal result:', JSON.stringify(result, null, 2));
    if (result.errors.length > 0) {
      process.exit(1);
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
