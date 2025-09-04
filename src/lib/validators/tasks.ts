import { z } from 'zod';

export const taskCreateSchema = z.object({
  workspaceId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  status: z.enum(['Todo', 'InProgress', 'Done']).default('Todo'),
  assigneeId: z.string().optional(),
  dueAt: z.string().datetime().optional(),
});

export const taskUpdateSchema = taskCreateSchema.partial().extend({ id: z.string().min(1) });

