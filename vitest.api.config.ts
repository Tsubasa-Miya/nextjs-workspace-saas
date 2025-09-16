import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  coverage: {
    provider: 'v8',
    reportsDirectory: 'coverage-api',
    reporter: ['text', 'html'],
    thresholds: (() => {
      const base = Number(process.env.COV || '90');
      const b = Math.max(0, base - 10);
      return {
        statements: base,
        branches: b,
        functions: base,
        lines: base,
      };
    })(),
    all: true,
    include: [
      'app/**/route.ts',
    ],
    exclude: [
      '**/*.tsx',
      '**/*.jsx',
      'app/**/page.ts',
      'app/**/layout.ts',
      'app/**/template.ts',
      'app/**/error.ts',
      'app/**/loading.ts',
      'app/**/not-found.ts',
      'app/**/head.ts',
      '**/next.config.js',
      '**/ecosystem.config.js',
      '**/scripts/**',
      '**/prisma/**',
    ],
  },
});
/* istanbul ignore file */
