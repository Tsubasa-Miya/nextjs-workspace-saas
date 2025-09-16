import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/ui/**/*.test.tsx'],
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  coverage: {
    provider: 'v8',
    reportsDirectory: 'coverage-ui',
    reporter: ['text', 'html'],
    all: true,
    include: [
      'src/components/ui/**/*.tsx',
    ],
    exclude: [
      '**/*.config.*',
      'next-env.d.ts',
    ],
    thresholds: (() => {
      const base = Number(process.env.COV || '80');
      const b = Math.max(0, base - 10);
      return {
        statements: base,
        branches: b,
        functions: base,
        lines: base,
      };
    })(),
  },
});
/* istanbul ignore file */
