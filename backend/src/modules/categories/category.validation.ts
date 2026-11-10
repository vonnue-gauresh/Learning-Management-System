import { z } from 'zod'

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
})

export const updateCategorySchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).optional(),
}).refine(
  (data) => data.name !== undefined || data.description !== undefined,
  {
    message: 'At least one field is required',
  },
)

export const categoryIdSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>