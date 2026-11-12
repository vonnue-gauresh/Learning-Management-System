import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockFirst, mockCreate, mockAll, mockWhere, mockUpdate } = vi.hoisted(
  () => ({
    mockFirst: vi.fn(),
    mockCreate: vi.fn(),
    mockAll: vi.fn(),
    mockWhere: vi.fn(),
    mockUpdate: vi.fn(),
  }),
)

vi.mock('../../src/prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        Category: {
          first: mockFirst,
          create: mockCreate,
          all: mockAll,
          where: mockWhere,
        },
      },
    },
  },
}))

import {
  createCategory,
  getCategories,
  updateCategory,
} from '../../src/modules/categories/category.service.js'

describe('Category service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWhere.mockReturnValue({ update: mockUpdate })
  })

  describe('createCategory', () => {
    it('creates a category when the name is unique', async () => {
      mockFirst.mockResolvedValue(null)

      const category = {
        id: 1,
        name: 'Programming',
        description: 'Programming courses',
      }

      mockCreate.mockResolvedValue(category)

      await expect(
        createCategory({
          name: 'Programming',
          description: 'Programming courses',
        }),
      ).resolves.toEqual(category)

      expect(mockFirst).toHaveBeenCalledWith({ name: 'Programming' })
      expect(mockCreate).toHaveBeenCalledWith({
        name: 'Programming',
        description: 'Programming courses',
      })
    })

    it('creates a category with a null description when omitted', async () => {
      mockFirst.mockResolvedValue(null)
      mockCreate.mockResolvedValue({
        id: 1,
        name: 'Programming',
        description: null,
      })

      await createCategory({ name: 'Programming' })

      expect(mockCreate).toHaveBeenCalledWith({
        name: 'Programming',
        description: null,
      })
    })

    it('rejects duplicate category names', async () => {
      mockFirst.mockResolvedValue({ id: 1, name: 'Programming' })

      await expect(
        createCategory({ name: 'Programming' }),
      ).rejects.toThrow('Category already exists')

      expect(mockCreate).not.toHaveBeenCalled()
    })
  })

  describe('getCategories', () => {
    it('returns all categories', async () => {
      const categories = [
        { id: 1, name: 'Programming', description: null },
        { id: 2, name: 'Design', description: 'Design courses' },
      ]

      mockAll.mockResolvedValue(categories)

      await expect(getCategories()).resolves.toEqual(categories)
      expect(mockAll).toHaveBeenCalledOnce()
    })

    it('returns an empty array when no categories exist', async () => {
      mockAll.mockResolvedValue([])

      await expect(getCategories()).resolves.toEqual([])
    })
  })

  describe('updateCategory', () => {
    it('updates an existing category name', async () => {
      mockFirst
        .mockResolvedValueOnce({
            id: 1,
            name: 'Programming',
            description: null,
        })
        .mockResolvedValueOnce(null)

      const updatedCategory = {
        id: 1,
        name: 'Development',
        description: null,
      }

      mockUpdate.mockResolvedValue(updatedCategory)

      await expect(
        updateCategory(1, { name: 'Development' }),
      ).resolves.toEqual(updatedCategory)

      expect(mockWhere).toHaveBeenCalledWith({ id: 1 })
      expect(mockUpdate).toHaveBeenCalledWith({ name: 'Development' })
    })

    it('updates only the description', async () => {
      mockFirst.mockResolvedValue({
        id: 1,
        name: 'Programming',
        description: 'Old description',
      })

      mockUpdate.mockResolvedValue({
        id: 1,
        name: 'Programming',
        description: 'New description',
      })

      await updateCategory(1, { description: 'New description' })

      expect(mockUpdate).toHaveBeenCalledWith({
        description: 'New description',
      })
    })

    it('returns null when the category does not exist', async () => {
      mockFirst.mockResolvedValue(null)

      await expect(
        updateCategory(99, { name: 'Development' }),
      ).resolves.toBeNull()

      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('rejects a name already used by another category', async () => {
      mockFirst
        .mockResolvedValueOnce({
          id: 1,
          name: 'Programming',
          description: null,
        })
        .mockResolvedValueOnce({
          id: 2,
          name: 'Development',
          description: null,
        })

      await expect(
        updateCategory(1, { name: 'Development' }),
      ).rejects.toThrow('Category already exists')

      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('does not check for duplicates when the name is unchanged', async () => {
      mockFirst.mockResolvedValue({
        id: 1,
        name: 'Programming',
        description: null,
      })

      mockUpdate.mockResolvedValue({
        id: 1,
        name: 'Programming',
        description: 'Updated description',
      })

      await updateCategory(1, {
        name: 'Programming',
        description: 'Updated description',
      })

      expect(mockFirst).toHaveBeenCalledOnce()
    })
  })
})