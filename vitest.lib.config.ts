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
    include: ['src/lib/**/*.ts'],
    exclude: [
      'src/lib/auth.ts',
      'src/lib/db.ts',
    ],
  },
});
