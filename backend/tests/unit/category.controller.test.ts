import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Request, Response } from 'express'

const {
  mockCreateCategory,
  mockGetCategories,
  mockUpdateCategory,
} = vi.hoisted(() => ({
  mockCreateCategory: vi.fn(),
  mockGetCategories: vi.fn(),
  mockUpdateCategory: vi.fn(),
}))

vi.mock('../../src/modules/categories/category.service.js', () => ({
  createCategory: mockCreateCategory,
  getCategories: mockGetCategories,
  updateCategory: mockUpdateCategory,
}))

import {
  createCategoryHandler,
  listCategories,
  updateCategoryHandler,
} from '../../src/modules/categories/category.controller.js'

function createResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }

  return res as unknown as Response
}

describe('Category controller', () => {
  let res: Response

  beforeEach(() => {
    vi.clearAllMocks()
    res = createResponse()
  })

  describe('createCategoryHandler', () => {
    it('creates a category successfully', async () => {
      const category = {
        id: 1,
        name: 'Programming',
        description: 'Programming courses',
      }

      mockCreateCategory.mockResolvedValue(category)

      const req = {
        body: {
          name: 'Programming',
          description: 'Programming courses',
        },
      } as Request

      await createCategoryHandler(req, res)

      expect(mockCreateCategory).toHaveBeenCalledWith(req.body)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category created successfully',
        category,
      })
    })

    it('returns 400 for invalid request data', async () => {
      const req = {
        body: { name: 'A' },
      } as Request

      await createCategoryHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(mockCreateCategory).not.toHaveBeenCalled()
    })

    it('returns 409 when the category already exists', async () => {
      mockCreateCategory.mockRejectedValue(
        new Error('Category already exists'),
      )

      const req = {
        body: { name: 'Programming' },
      } as Request

      await createCategoryHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(409)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category already exists',
      })
    })

    it('rethrows unexpected service errors', async () => {
      const error = new Error('Database unavailable')
      mockCreateCategory.mockRejectedValue(error)

      const req = {
        body: { name: 'Programming' },
      } as Request

      await expect(createCategoryHandler(req, res)).rejects.toThrow(
        'Database unavailable',
      )
    })
  })

  describe('listCategories', () => {
    it('returns all categories', async () => {
      const categories = [
        { id: 1, name: 'Programming', description: null },
        { id: 2, name: 'Design', description: 'Design courses' },
      ]

      mockGetCategories.mockResolvedValue(categories)

      await listCategories({} as Request, res)

      expect(mockGetCategories).toHaveBeenCalledOnce()
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ categories })
    })

    it('returns an empty array when no categories exist', async () => {
      mockGetCategories.mockResolvedValue([])

      await listCategories({} as Request, res)

      expect(res.json).toHaveBeenCalledWith({ categories: [] })
    })
  })

  describe('updateCategoryHandler', () => {
    it('updates a category successfully', async () => {
      const category = {
        id: 1,
        name: 'Development',
        description: 'Updated description',
      }

      mockUpdateCategory.mockResolvedValue(category)

      const req = {
        params: { id: '1' },
        body: { name: 'Development' },
      } as unknown as Request

      await updateCategoryHandler(req, res)

      expect(mockUpdateCategory).toHaveBeenCalledWith(1, {
        name: 'Development',
      })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category updated successfully',
        category,
      })
    })

    it('returns 400 for an invalid category ID', async () => {
      const req = {
        params: { id: 'abc' },
        body: { name: 'Development' },
      } as unknown as Request

      await updateCategoryHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(mockUpdateCategory).not.toHaveBeenCalled()
    })

    it('returns 400 for an invalid request body', async () => {
      const req = {
        params: { id: '1' },
        body: {},
      } as unknown as Request

      await updateCategoryHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(mockUpdateCategory).not.toHaveBeenCalled()
    })

    it('returns 404 when the category does not exist', async () => {
      mockUpdateCategory.mockResolvedValue(null)

      const req = {
        params: { id: '99' },
        body: { name: 'Development' },
      } as unknown as Request

      await updateCategoryHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category not found',
      })
    })

    it('returns 409 when the updated name already exists', async () => {
      mockUpdateCategory.mockRejectedValue(
        new Error('Category already exists'),
      )

      const req = {
        params: { id: '1' },
        body: { name: 'Development' },
      } as unknown as Request

      await updateCategoryHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(409)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category already exists',
      })
    })
  })
})