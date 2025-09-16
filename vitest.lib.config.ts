/* istanbul ignore file */
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: [
      'tests/hash.test.ts',
      'tests/email.test.ts',
      'tests/emailTemplates.test.ts',
      'tests/acl.test.ts',
      'tests/auth.lib.test.ts',
      'tests/auth.non_test_branch.test.ts',
      'tests/auth.authorize.test.ts',
      'tests/auth.callbacks.test.ts',
      'tests/auth.force_null.test.ts',
      'tests/fieldErrors.test.ts',
      'tests/api.metrics.test.ts',
      'tests/api.client.test.ts',
      'tests/api.presets.test.ts',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  coverage: {
    provider: 'v8',
    reportsDirectory: 'coverage-lib',
    reporter: ['text', 'html'],
    all: true,
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
    include: ['src/lib/**/*.ts'],
    exclude: [
      'src/lib/auth.ts',
      'src/lib/db.ts',
    ],
  },
});
