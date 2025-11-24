import * as esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function build() {
  try {
    await esbuild.build({
      entryPoints: ['src/index.ts'],
      bundle: true,
      platform: 'node',
      format: 'esm',
      outfile: 'dist/index.js',
      sourcemap: true,
      // Resolve @/ alias to the parent src directory
      alias: {
        '@': path.resolve(__dirname, '../src')
      },
      // Keep dependencies external
      external: [
        '@modelcontextprotocol/sdk', 
        '@supabase/supabase-js', 
        'zod', 
        'natural',
        '@anthropic-ai/sdk' // Add anthropic sdk if used in shared code
      ],
      loader: {
        '.ts': 'ts',
        '.tsx': 'tsx'
      },
      define: {
        // Polyfill import.meta.env for shared code compatibility
        'import.meta.env': 'process.env',
        'import.meta.env.VITE_ANTHROPIC_API_KEY': 'process.env.ANTHROPIC_API_KEY'
      },
      logLevel: 'info'
    });
    console.log('Build completed successfully');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
