import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(3).max(60).regex(/^[a-z0-9](-?[a-z0-9])+$/),
});

export const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['Owner', 'Admin', 'Member']).default('Member'),
});

