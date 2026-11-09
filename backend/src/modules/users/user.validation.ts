import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(255),
  password: z.string().min(8).max(128),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
})

export const userIdSchema = z.object({
    id: z.coerce.number().int().positive()
})

export const updateUserSchema = z.object({
    name: z.string().trim().min(2).max(100).optional(),
    email: z.email().max(255).optional(),
}).refine(
    (data) => data.name !== undefined || data.email !== undefined,
    {
        message: 'At least one field is required'
    },
)

export type UpdateUserInput = z.infer<typeof updateUserSchema>

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
})