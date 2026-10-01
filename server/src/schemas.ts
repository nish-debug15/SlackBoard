import { z } from 'zod';

export const ColumnSchema = z.enum(['todo', 'inprogress', 'done']);

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  duration: z.number().int().min(1, 'Duration must be at least 1 day').max(365, 'Duration too long'),
  dependsOn: z.array(z.string()).default([]),
  column: ColumnSchema.default('todo'),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  duration: z.number().int().min(1).max(365),
  dependsOn: z.array(z.string()),
  column: ColumnSchema,
});

export const PatchColumnSchema = z.object({
  column: ColumnSchema,
});

export const SettingsSchema = z.object({
  name: z.string().min(1).max(100),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
});

export const CopilotPlanSchema = z.object({
  prompt: z.string().min(1).max(1000, 'Input must be under 1000 characters'),
});

export const CopilotAskSchema = z.object({
  question: z.string().min(1).max(1000, 'Question must be under 1000 characters'),
});
