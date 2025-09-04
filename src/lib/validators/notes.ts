import { z } from 'zod';

export const noteCreateSchema = z.object({
  workspaceId: z.string().min(1),
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  tags: z.array(z.string().min(1)).max(20).optional(),
});

export const noteUpdateSchema = noteCreateSchema.partial().extend({ id: z.string().min(1) });

