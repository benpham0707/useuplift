import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  test: {
    environment: 'node',
    include: [
      'tests/college-data/college-api.test.ts',
      'tests/college-data/college-format.test.ts',
    ],
  },
});
