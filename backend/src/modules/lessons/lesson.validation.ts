import { z } from 'zod'

export const createLessonSchema = z.object({
  title: z.string().trim().min(2).max(150),
  description: z.string().trim().max(1000).optional(),
  content: z.string().trim().optional(),
  videoUrl: z.string().url().optional(),
  position: z.number().int().positive(),
})

export const updateLessonSchema = z.object({
  title: z.string().trim().min(2).max(150).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  content: z.string().trim().nullable().optional(),
  videoUrl: z.string().url().nullable().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' },
)

export const lessonIdSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const sectionIdSchema = z.object({
  sectionId: z.coerce.number().int().positive(),
})

export const updateLessonPositionSchema = z.object({
  position: z.number().int().positive(),
})

export type CreateLessonInput = z.infer<typeof createLessonSchema>
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>