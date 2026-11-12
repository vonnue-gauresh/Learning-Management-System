import type { Request, Response } from 'express'
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
} from './category.validation.js'
import {
  createCategory,
  getCategories,
  updateCategory,
} from './category.service.js'

export async function createCategoryHandler(req: Request, res: Response) {
  const validation = createCategorySchema.safeParse(req.body)

  if (!validation.success) {
    return res.status(400).json({
      message: 'Invalid request body',
      errors: validation.error.flatten().fieldErrors,
    })
  }

  try {
    const category = await createCategory(validation.data)

    return res.status(201).json({
      message: 'Category created successfully',
      category,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Category already exists') {
      return res.status(409).json({
        message: error.message,
      })
    }

    throw error
  }
}

export async function listCategories(_req: Request, res: Response) {
  const categories = await getCategories()

  return res.status(200).json({
    categories,
  })
}

export async function updateCategoryHandler(req: Request, res: Response) {
  const idValidation = categoryIdSchema.safeParse(req.params)

  if (!idValidation.success) {
    return res.status(400).json({
      message: 'Invalid category ID',
    })
  }

  const bodyValidation = updateCategorySchema.safeParse(req.body)

  if (!bodyValidation.success) {
    return res.status(400).json({
      message: 'Invalid request body',
      errors: bodyValidation.error.flatten().fieldErrors,
    })
  }

  try {
    const category = await updateCategory(
      idValidation.data.id,
      bodyValidation.data,
    )

    if (!category) {
      return res.status(404).json({
        message: 'Category not found',
      })
    }

    return res.status(200).json({
      message: 'Category updated successfully',
      category,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Category already exists') {
      return res.status(409).json({
        message: error.message,
      })
    }

    throw error
  }
}