import { z } from 'zod'

export const createCourseSchema = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().min(10).max(5000),
  thumbnail: z.string().url().optional(),
  categoryId: z.number().int().positive(),
})

export const updateCourseSchema = z.object({
  title: z.string().trim().min(3).max(150).optional(),
  description: z.string().trim().min(10).max(5000).optional(),
  thumbnail: z.string().url().nullable().optional(),
  categoryId: z.number().int().positive().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' },
)

export const courseIdSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const updateCourseStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
})

export type CreateCourseInput = z.infer<typeof createCourseSchema>
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>