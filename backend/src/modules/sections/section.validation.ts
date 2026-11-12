import { z } from 'zod'

export const createSectionSchema = z.object({
  title: z.string().trim().min(2).max(150),
  description: z.string().trim().max(1000).optional(),
  position: z.number().int().positive(),
})

export const updateSectionSchema = z.object({
  title: z.string().trim().min(2).max(150).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' },
)

export const sectionIdSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const courseIdSchema = z.object({
  courseId: z.coerce.number().int().positive(),
})

export const updateSectionPositionSchema = z.object({
  position: z.number().int().positive(),
})

export type CreateSectionInput = z.infer<typeof createSectionSchema>
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>