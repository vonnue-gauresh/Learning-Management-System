import type { Request, Response } from 'express';
import { createUserSchema, paginationSchema, userIdSchema, updateUserSchema, updateUserStatusSchema } from './user.validation.js';
import { createLearner, getUserById , getUsers, updateUser, updateUserStatus } from './user.service.js';
import { flattenError } from 'zod/v4/core';

export async function createUser(req: Request, res: Response) {
  const validation = createUserSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: flattenError(validation.error).fieldErrors,
    });
  }

  try {
    const user = await createLearner(validation.data);

    return res.status(201).json({
      message: 'Learner created successfully',
      user,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Email is already registered') {
      return res.status(409).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: 'Failed to create learner',
    });
  }
}

export async function listUsers(req: Request, res: Response) {
    const validation = paginationSchema.safeParse(req.query)

    if (!validation.success) {
        return res.status(400).json({
            message: 'Invalid pagination parameteres',
            errors: flattenError(validation.error).fieldErrors
        })
    }

    const { page, limit } = validation.data
    const result = await getUsers(page, limit)
    
    return res.status(200).json(result)
} 

export async function getUser(req: Request, res: Response) {
    const validation = userIdSchema.safeParse(req.params)

    if (!validation.success) {
        return res.status(400).json({
            message: "Invalid user ID",
        })
    }

    const user = await getUserById(validation.data.id)

    if (!user) {
        return res.status(404).json({
            message: "User not found"
        })
    }

    return res.status(200).json({
        user
    })
}

export async function updateUserDetails(req: Request, res: Response) {
    const idValidation = userIdSchema.safeParse(req.params)

    if(!idValidation.success) {
        return res.status(400).json({
            message: 'Invalid user ID',
        })
    }

    const bodyValidation = updateUserSchema.safeParse(req.body)

    if (!bodyValidation.success) {
        return res.status(400).json({
            message: "Invalid request body",
            errors: flattenError(bodyValidation.error).fieldErrors
        })
    }

    try {
        const user = await updateUser(idValidation.data.id, bodyValidation.data) 

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            })
        }

        return res.status(200).json({
            message: "User updated successfully",
            user,
        })
    } catch (error) {
        if(error instanceof Error && error.message === 'Email is already registered') {
            return res.status(409).json({
                message: error.message,
            })
        }

        throw error
    }
}

export async function changeUserStatus(req: Request, res: Response) {
    const idValidation = userIdSchema.safeParse(req.params)

    if (!idValidation.success) {
        return res.status(400).json({
            message: "Invalid user ID"
        })
    }

    const bodyValidation = updateUserStatusSchema.safeParse(req.body)

    if(!bodyValidation.success) {
        return res.status(400).json({
            message: "Invalid request body",
            errors: flattenError(bodyValidation.error).fieldErrors,
        })
    }

    const user = await updateUserStatus(
        idValidation.data.id,
        bodyValidation.data.isActive,
    )

    if (!user) {
        return res.status(400).json({
            message: "User not found",
        })
    }

    return res.status(200).json({
        message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`
    })
}
