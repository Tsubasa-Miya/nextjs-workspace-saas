// Export a lazy, test-friendly proxy to avoid instantiating Prisma at import time.
// In tests, consumers usually `vi.mock('@/src/lib/db', ...)` and won't touch this proxy.
// If a test accidentally touches Prisma without mocking, we throw to make it explicit.

import type { PrismaClient, Prisma } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let client: PrismaClient | undefined;

function createClient() {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const { PrismaClient } = require('@prisma/client') as typeof import('@prisma/client');
  type PC = InstanceType<typeof PrismaClient>;
  const c: PC = (globalThis.prisma ?? new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'stdout', level: 'error' },
      { emit: 'stdout', level: 'warn' },
    ],
  })) as PC;
  if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = c;
  }
  c.$on('query', (e) => {
    if (process.env.DEBUG_PRISMA === '1') {
      // e is Prisma.QueryEvent for 'query' events
      const qe = e as unknown as { query: string; params: string; duration: number };
      console.warn(`${qe.query} ${qe.params} (${qe.duration}ms)`);
    }
  });
  return c;
}

export const prisma: PrismaClient = new Proxy<PrismaClient>(
  {} as PrismaClient,
  {
    get(_target, prop) {
      if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
        throw new Error('Prisma client accessed during tests without mock. vi.mock("@/src/lib/db") in your test.');
      }
      if (!client) client = createClient();
      return (client as PrismaClient)[prop as keyof PrismaClient] as unknown;
    },
  },
) as unknown as PrismaClient;
