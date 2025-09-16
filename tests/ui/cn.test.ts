import { describe, it, expect } from 'vitest';
import { cn } from '@/src/components/ui/cn';

describe('UI/cn', () => {
  it('joins truthy class parts with spaces', () => {
    expect(cn('a', undefined, '', 'b', false, 'c')).toBe('a b c');
  });
});

