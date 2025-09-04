import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/src/lib/hash';

describe('hash', () => {
  it('hashes and verifies password', async () => {
    const hash = await hashPassword('secret-pass');
    expect(hash).toBeTypeOf('string');
    expect(await verifyPassword(hash, 'secret-pass')).toBe(true);
    expect(await verifyPassword(hash, 'wrong-pass')).toBe(false);
  });
});

