import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

const {
  mockUserFirst,
  mockCategoryFirst,
  mockCategoryAll,
  mockCategoryCreate,
  mockCategoryWhere,
  mockCategoryUpdate,
  mockVerifyToken,
} = vi.hoisted(() => ({
  mockUserFirst: vi.fn(),
  mockCategoryFirst: vi.fn(),
  mockCategoryAll: vi.fn(),
  mockCategoryCreate: vi.fn(),
  mockCategoryWhere: vi.fn(),
  mockCategoryUpdate: vi.fn(),
  mockVerifyToken: vi.fn(),
}))

vi.mock('../../src/prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        User: {
          first: mockUserFirst,
        },
        Category: {
          first: mockCategoryFirst,
          all: mockCategoryAll,
          create: mockCategoryCreate,
          where: mockCategoryWhere,
        },
      },
    },
  },
}))

vi.mock('../../src/utils/jwt.js', () => ({
  verifyToken: mockVerifyToken,
}))

import { app } from '../../src/app.js'

const adminUser = {
  id: 1,
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'ADMIN',
  isActive: true,
}

const learnerUser = {
  id: 2,
  name: 'Jane Doe',
  email: 'jane@example.com',
  role: 'LEARNER',
  isActive: true,
}

const programmingCategory = {
  id: 1,
  name: 'Programming',
  description: 'Programming courses',
}

describe('Category Management API', () => {
  const adminAuth = { Authorization: 'Bearer admin-token' }
  const learnerAuth = { Authorization: 'Bearer learner-token' }

  beforeEach(() => {
    vi.clearAllMocks()

    mockVerifyToken.mockImplementation((token: string) => {
      if (token === 'admin-token') return { userId: 1 }
      if (token === 'learner-token') return { userId: 2 }
      throw new Error('Invalid token')
    })

    mockUserFirst.mockImplementation(({ id }: { id?: number }) => {
      if (id === 1) return Promise.resolve(adminUser)
      if (id === 2) return Promise.resolve(learnerUser)
      return Promise.resolve(null)
    })

    mockCategoryWhere.mockReturnValue({
      update: mockCategoryUpdate,
    })
  })

  describe('GET /api/categories', () => {
    it('allows public access to category listing', async () => {
      mockCategoryAll.mockResolvedValue([programmingCategory])

      const response = await request(app).get('/api/categories')

      expect(response.status).toBe(200)
      expect(response.body.categories).toEqual([programmingCategory])
      expect(mockCategoryAll).toHaveBeenCalledOnce()
    })

    it('returns an empty array when no categories exist', async () => {
      mockCategoryAll.mockResolvedValue([])

      const response = await request(app).get('/api/categories')

      expect(response.status).toBe(200)
      expect(response.body.categories).toEqual([])
    })
  })

  describe('Authentication and authorization', () => {
    it('rejects category creation without an authentication token', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({ name: 'Programming' })

      expect(response.status).toBe(401)
      expect(mockCategoryCreate).not.toHaveBeenCalled()
    })

    it('rejects category updates without an authentication token', async () => {
      const response = await request(app)
        .patch('/api/categories/1')
        .send({ name: 'Development' })

      expect(response.status).toBe(401)
      expect(mockCategoryUpdate).not.toHaveBeenCalled()
    })

    it('rejects category creation by learners', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set(learnerAuth)
        .send({ name: 'Programming' })

      expect(response.status).toBe(403)
      expect(mockCategoryCreate).not.toHaveBeenCalled()
    })

    it('rejects category updates by learners', async () => {
      const response = await request(app)
        .patch('/api/categories/1')
        .set(learnerAuth)
        .send({ name: 'Development' })

      expect(response.status).toBe(403)
      expect(mockCategoryUpdate).not.toHaveBeenCalled()
    })
  })

  describe('POST /api/categories', () => {
    it('allows admins to create a category', async () => {
      mockCategoryFirst.mockResolvedValue(null)
      mockCategoryCreate.mockResolvedValue(programmingCategory)

      const response = await request(app)
        .post('/api/categories')
        .set(adminAuth)
        .send({
          name: 'Programming',
          description: 'Programming courses',
        })

      expect(response.status).toBe(201)
      expect(response.body.message).toBe('Category created successfully')
      expect(response.body.category).toEqual(programmingCategory)
      expect(mockCategoryCreate).toHaveBeenCalledWith({
        name: 'Programming',
        description: 'Programming courses',
      })
    })

    it('rejects invalid category data', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set(adminAuth)
        .send({ name: 'A' })

      expect(response.status).toBe(400)
      expect(mockCategoryCreate).not.toHaveBeenCalled()
    })

    it('rejects duplicate category names', async () => {
      mockCategoryFirst.mockResolvedValue(programmingCategory)

      const response = await request(app)
        .post('/api/categories')
        .set(adminAuth)
        .send({ name: 'Programming' })

      expect(response.status).toBe(409)
      expect(response.body.message).toBe('Category already exists')
      expect(mockCategoryCreate).not.toHaveBeenCalled()
    })
  })

  describe('PATCH /api/categories/:id', () => {
    it('allows admins to update a category', async () => {
      const updatedCategory = {
        ...programmingCategory,
        name: 'Development',
      }

      mockCategoryFirst
        .mockResolvedValueOnce(programmingCategory)
        .mockResolvedValueOnce(null)

      mockCategoryUpdate.mockResolvedValue(updatedCategory)

      const response = await request(app)
        .patch('/api/categories/1')
        .set(adminAuth)
        .send({ name: 'Development' })

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Category updated successfully')
      expect(response.body.category).toEqual(updatedCategory)
    })

    it('rejects invalid category IDs', async () => {
      const response = await request(app)
        .patch('/api/categories/abc')
        .set(adminAuth)
        .send({ name: 'Development' })

      expect(response.status).toBe(400)
      expect(mockCategoryFirst).not.toHaveBeenCalled()
      expect(mockCategoryUpdate).not.toHaveBeenCalled()
    })

    it('rejects empty update bodies', async () => {
      const response = await request(app)
        .patch('/api/categories/1')
        .set(adminAuth)
        .send({})

      expect(response.status).toBe(400)
      expect(mockCategoryUpdate).not.toHaveBeenCalled()
    })

    it('returns 404 when the category does not exist', async () => {
      mockCategoryFirst.mockResolvedValue(null)

      const response = await request(app)
        .patch('/api/categories/999')
        .set(adminAuth)
        .send({ name: 'Development' })

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Category not found')
    })

    it('rejects duplicate category names during updates', async () => {
      mockCategoryFirst
        .mockResolvedValueOnce(programmingCategory)
        .mockResolvedValueOnce({
          id: 2,
          name: 'Development',
          description: null,
        })

      const response = await request(app)
        .patch('/api/categories/1')
        .set(adminAuth)
        .send({ name: 'Development' })

      expect(response.status).toBe(409)
      expect(response.body.message).toBe('Category already exists')
      expect(mockCategoryUpdate).not.toHaveBeenCalled()
    })
  })
})