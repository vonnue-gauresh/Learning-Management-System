import { db } from '../../prisma/db.js'
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from './category.validation.js'

export async function createCategory(input: CreateCategoryInput) {
  const existingCategory = await db.orm.public.Category.first({
    name: input.name,
  })

  if (existingCategory) {
    throw new Error('Category already exists')
  }

  const category = await db.orm.public.Category.create({
    name: input.name,
    description: input.description ?? null,
  })

  return category
}

export async function getCategories() {
  const categories = await db.orm.public.Category.all()

  return categories
}

export async function updateCategory(
  categoryId: number,
  input: UpdateCategoryInput,
) {
  const existingCategory = await db.orm.public.Category.first({
    id: categoryId,
  })

  if (!existingCategory) {
    return null
  }

  if (input.name && input.name !== existingCategory.name) {
    const nameExists = await db.orm.public.Category.first({
      name: input.name,
    })

    if (nameExists) {
      throw new Error('Category already exists')
    }
  }

  const updatedCategory = await db.orm.public.Category
    .where({ id: categoryId })
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
    })

  return updatedCategory
}