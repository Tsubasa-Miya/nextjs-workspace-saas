import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
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
    reportsDirectory: 'coverage',
    reporter: ['text', 'html'],
    // Only report coverage for files actually exercised by tests
    all: false,
    include: [
      'src/lib/**/*.ts',
      'app/**/route.ts',
      'src/components/ui/**/*.tsx',
    ],
    exclude: [
      'src/lib/auth.ts',
      'src/lib/db.ts',
      'app/api/auth/[...nextauth]/route.ts',
      '**/*.{tsx,jsx}',
      'app/**',
      'app/dashboard/**',
      'src/components/**',
      'docs/**',
      'examples/**',
      'coverage/**',
      'coverage-*',
      'middleware.ts',
      '**/*.config.*',
      'next-env.d.ts',
      '**/next.config.js',
      '**/ecosystem.config.js',
      '**/scripts/**',
      '**/prisma/**',
    ],
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
  },
});
