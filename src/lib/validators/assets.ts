import { z } from 'zod';

export const signSchema = z.object({
  workspaceId: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().int().positive().max(10 * 1024 * 1024),
});

export const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.pdf'];

export const confirmSchema = z.object({
  workspaceId: z.string().min(1),
  key: z.string().min(1),
  mime: z.string().min(1),
  size: z.number().int().positive().max(10 * 1024 * 1024),
});
