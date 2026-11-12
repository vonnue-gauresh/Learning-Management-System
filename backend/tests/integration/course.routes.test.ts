import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

const {
  mockUserFirst,
  mockCategoryFirst,
  mockCourseFirst,
  mockCourseAll,
  mockCourseCreate,
  mockCourseWhere,
  mockCourseUpdate,
  mockVerifyToken,
} = vi.hoisted(() => ({
  mockUserFirst: vi.fn(),
  mockCategoryFirst: vi.fn(),
  mockCourseFirst: vi.fn(),
  mockCourseAll: vi.fn(),
  mockCourseCreate: vi.fn(),
  mockCourseWhere: vi.fn(),
  mockCourseUpdate: vi.fn(),
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
        },
        Course: {
          first: mockCourseFirst,
          all: mockCourseAll,
          create: mockCourseCreate,
          where: mockCourseWhere,
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

const publishedCourse = {
  id: 1,
  title: 'JavaScript Fundamentals',
  description: 'Learn the fundamentals of JavaScript programming.',
  thumbnail: 'https://example.com/thumbnail.jpg',
  status: 'PUBLISHED',
  categoryId: 1,
}

const draftCourse = {
  id: 2,
  title: 'Advanced React',
  description: 'Learn advanced React concepts and patterns.',
  thumbnail: null,
  status: 'DRAFT',
  categoryId: 1,
}

const archivedCourse = {
  id: 3,
  title: 'Old JavaScript Course',
  description: 'An archived JavaScript course.',
  thumbnail: null,
  status: 'ARCHIVED',
  categoryId: 1,
}

describe('Course Management API', () => {
  const adminAuth = { Authorization: 'Bearer admin-token' }
  const learnerAuth = { Authorization: 'Bearer learner-token' }

  const validCourseInput = {
    title: 'JavaScript Fundamentals',
    description: 'Learn the fundamentals of JavaScript programming.',
    thumbnail: 'https://example.com/thumbnail.jpg',
    categoryId: 1,
  }

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

    mockCourseWhere.mockReturnValue({
      update: mockCourseUpdate,
    })
  })

  describe('GET /api/courses', () => {
    it('allows public access to published courses', async () => {
      mockCourseAll.mockResolvedValue([publishedCourse])

      const response = await request(app).get('/api/courses')

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual([publishedCourse])
      expect(mockCourseAll).toHaveBeenCalledOnce()
    })

    it('returns all courses for admins', async () => {
      const courses = [
        publishedCourse,
        draftCourse,
        archivedCourse,
      ]

      mockCourseAll.mockResolvedValue(courses)

      const response = await request(app)
        .get('/api/courses')
        .set(adminAuth)

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual(courses)
      expect(mockCourseAll).toHaveBeenCalledOnce()
    })

    it('returns only published courses for learners', async () => {
      mockCourseAll.mockResolvedValue([publishedCourse])

      const response = await request(app)
        .get('/api/courses')
        .set(learnerAuth)

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual([publishedCourse])
    })

    it('returns an empty array when no published courses exist', async () => {
      mockCourseAll.mockResolvedValue([])

      const response = await request(app).get('/api/courses')

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual([])
    })

    it('rejects requests with an invalid token', async () => {
      const response = await request(app)
        .get('/api/courses')
        .set({ Authorization: 'Bearer invalid-token' })

      expect(response.status).toBe(401)
      expect(mockCourseAll).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/courses/:id', () => {
    it('allows public access to published courses', async () => {
      mockCourseFirst.mockResolvedValue(publishedCourse)

      const response = await request(app).get('/api/courses/1')

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual(publishedCourse)
      expect(mockCourseFirst).toHaveBeenCalledWith({ id: 1 })
    })

    it('allows admins to retrieve draft courses', async () => {
      mockCourseFirst.mockResolvedValue(draftCourse)

      const response = await request(app)
        .get('/api/courses/2')
        .set(adminAuth)

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual(draftCourse)
    })

    it('allows admins to retrieve archived courses', async () => {
      mockCourseFirst.mockResolvedValue(archivedCourse)

      const response = await request(app)
        .get('/api/courses/3')
        .set(adminAuth)

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual(archivedCourse)
    })

    it('does not allow learners to retrieve draft courses', async () => {
      mockCourseFirst.mockResolvedValue(draftCourse)

      const response = await request(app)
        .get('/api/courses/2')
        .set(learnerAuth)

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Course not found')
    })

    it('does not allow learners to retrieve archived courses', async () => {
      mockCourseFirst.mockResolvedValue(archivedCourse)

      const response = await request(app)
        .get('/api/courses/3')
        .set(learnerAuth)

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Course not found')
    })

    it('returns 400 for invalid course IDs', async () => {
      const response = await request(app).get('/api/courses/abc')

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Invalid course ID')
      expect(mockCourseFirst).not.toHaveBeenCalled()
    })

    it('returns 404 when the course does not exist', async () => {
      mockCourseFirst.mockResolvedValue(null)

      const response = await request(app).get('/api/courses/999')

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Course not found')
    })

    it('rejects requests with an invalid token', async () => {
      const response = await request(app)
        .get('/api/courses/1')
        .set({ Authorization: 'Bearer invalid-token' })

      expect(response.status).toBe(401)
      expect(mockCourseFirst).not.toHaveBeenCalled()
    })
  })

  describe('Authentication and authorization', () => {
    it('rejects course creation without authentication', async () => {
      const response = await request(app)
        .post('/api/courses')
        .send(validCourseInput)

      expect(response.status).toBe(401)
      expect(mockCourseCreate).not.toHaveBeenCalled()
    })

    it('rejects course updates without authentication', async () => {
      const response = await request(app)
        .patch('/api/courses/1')
        .send({ title: 'Updated Course' })

      expect(response.status).toBe(401)
      expect(mockCourseUpdate).not.toHaveBeenCalled()
    })

    it('rejects course status changes without authentication', async () => {
      const response = await request(app)
        .patch('/api/courses/1/status')
        .send({ status: 'PUBLISHED' })

      expect(response.status).toBe(401)
      expect(mockCourseUpdate).not.toHaveBeenCalled()
    })

    it('rejects course creation by learners', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set(learnerAuth)
        .send(validCourseInput)

      expect(response.status).toBe(403)
      expect(mockCourseCreate).not.toHaveBeenCalled()
    })

    it('rejects course updates by learners', async () => {
      const response = await request(app)
        .patch('/api/courses/1')
        .set(learnerAuth)
        .send({ title: 'Updated Course' })

      expect(response.status).toBe(403)
      expect(mockCourseUpdate).not.toHaveBeenCalled()
    })

    it('rejects course status changes by learners', async () => {
      const response = await request(app)
        .patch('/api/courses/1/status')
        .set(learnerAuth)
        .send({ status: 'PUBLISHED' })

      expect(response.status).toBe(403)
      expect(mockCourseUpdate).not.toHaveBeenCalled()
    })
  })

  describe('POST /api/courses', () => {
    it('allows admins to create a course', async () => {
      mockCategoryFirst.mockResolvedValue(programmingCategory)
      mockCourseCreate.mockResolvedValue({
        ...publishedCourse,
        status: 'DRAFT',
      })

      const response = await request(app)
        .post('/api/courses')
        .set(adminAuth)
        .send(validCourseInput)

      expect(response.status).toBe(201)
      expect(response.body.message).toBe('Course created successfully')
      expect(response.body.data.status).toBe('DRAFT')

      expect(mockCategoryFirst).toHaveBeenCalledWith({ id: 1 })
      expect(mockCourseCreate).toHaveBeenCalledOnce()
    })

    it('rejects invalid course data', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set(adminAuth)
        .send({
          title: 'JS',
          description: 'Too short',
          categoryId: 1,
        })

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Invalid course data')
      expect(mockCourseCreate).not.toHaveBeenCalled()
    })

    it('returns 404 when the category does not exist', async () => {
      mockCategoryFirst.mockResolvedValue(null)

      const response = await request(app)
        .post('/api/courses')
        .set(adminAuth)
        .send(validCourseInput)

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Category not found')
      expect(mockCourseCreate).not.toHaveBeenCalled()
    })
  })

  describe('PATCH /api/courses/:id', () => {
    it('allows admins to update a course', async () => {
      const updatedCourse = {
        ...publishedCourse,
        title: 'Advanced JavaScript',
      }

      mockCourseFirst.mockResolvedValue(publishedCourse)
      mockCourseUpdate.mockResolvedValue(updatedCourse)

      const response = await request(app)
        .patch('/api/courses/1')
        .set(adminAuth)
        .send({ title: 'Advanced JavaScript' })

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Course updated successfully')
      expect(response.body.data).toEqual(updatedCourse)
    })

    it('rejects invalid course IDs', async () => {
      const response = await request(app)
        .patch('/api/courses/abc')
        .set(adminAuth)
        .send({ title: 'Advanced JavaScript' })

      expect(response.status).toBe(400)
      expect(mockCourseFirst).not.toHaveBeenCalled()
    })

    it('rejects empty update bodies', async () => {
      const response = await request(app)
        .patch('/api/courses/1')
        .set(adminAuth)
        .send({})

      expect(response.status).toBe(400)
      expect(mockCourseFirst).not.toHaveBeenCalled()
    })

    it('returns 404 when the course does not exist', async () => {
      mockCourseFirst.mockResolvedValue(null)

      const response = await request(app)
        .patch('/api/courses/999')
        .set(adminAuth)
        .send({ title: 'Updated Course' })

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Course not found')
    })

    it('returns 404 when the updated category does not exist', async () => {
      mockCourseFirst.mockResolvedValue(publishedCourse)
      mockCategoryFirst.mockResolvedValue(null)

      const response = await request(app)
        .patch('/api/courses/1')
        .set(adminAuth)
        .send({ categoryId: 99 })

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Category not found')
      expect(mockCourseUpdate).not.toHaveBeenCalled()
    })
  })

  describe('PATCH /api/courses/:id/status', () => {
    it('allows admins to publish a course', async () => {
      mockCourseFirst.mockResolvedValue(draftCourse)
      mockCourseUpdate.mockResolvedValue({
        ...draftCourse,
        status: 'PUBLISHED',
      })

      const response = await request(app)
        .patch('/api/courses/2/status')
        .set(adminAuth)
        .send({ status: 'PUBLISHED' })

      expect(response.status).toBe(200)
      expect(response.body.message).toBe(
        'Course status updated successfully',
      )
      expect(response.body.data.status).toBe('PUBLISHED')
    })

    it('allows admins to archive a course', async () => {
      mockCourseFirst.mockResolvedValue(publishedCourse)
      mockCourseUpdate.mockResolvedValue({
        ...publishedCourse,
        status: 'ARCHIVED',
      })

      const response = await request(app)
        .patch('/api/courses/1/status')
        .set(adminAuth)
        .send({ status: 'ARCHIVED' })

      expect(response.status).toBe(200)
      expect(response.body.data.status).toBe('ARCHIVED')
    })

    it('rejects unsupported course statuses', async () => {
      const response = await request(app)
        .patch('/api/courses/1/status')
        .set(adminAuth)
        .send({ status: 'PENDING' })

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Invalid course status')
      expect(mockCourseUpdate).not.toHaveBeenCalled()
    })

    it('returns 404 when the course does not exist', async () => {
      mockCourseFirst.mockResolvedValue(null)

      const response = await request(app)
        .patch('/api/courses/999/status')
        .set(adminAuth)
        .send({ status: 'PUBLISHED' })

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Course not found')
    })
  })
})