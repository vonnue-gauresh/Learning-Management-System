import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import {app} from '../../src/app.js'

const {
  mockUserFirst,
  mockVerifyToken,
  mockCourseFirst,
  mockSectionCreate,
  mockSectionAll,
  mockSectionFirst,
  mockSectionWhere,
  mockSectionUpdate,
} = vi.hoisted(() => ({
  mockUserFirst: vi.fn(),
  mockVerifyToken: vi.fn(),
  mockCourseFirst: vi.fn(),
  mockSectionCreate: vi.fn(),
  mockSectionAll: vi.fn(),
  mockSectionFirst: vi.fn(),
  mockSectionWhere: vi.fn(),
  mockSectionUpdate: vi.fn(),
}))

vi.mock('../../src/prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        User: {
          first: mockUserFirst,
        },
        Course: {
          first: mockCourseFirst,
        },
        CourseSection: {
          create: mockSectionCreate,
          all: mockSectionAll,
          first: mockSectionFirst,
          where: mockSectionWhere,
        },
      },
    },
  },
}))

vi.mock('../../src/utils/jwt.js', () => ({
  verifyToken: mockVerifyToken,
}))


describe('Section Routes', () => {
  const adminUser = {
    id: 1,
    role: 'ADMIN',
    isActive: true,
  }

  const learnerUser = {
    id: 2,
    role: 'LEARNER',
    isActive: true,
  }

  const publishedCourse = {
    id: 1,
    title: 'Backend Development',
    status: 'PUBLISHED',
  }

  const draftCourse = {
    id: 2,
    title: 'Advanced Backend Development',
    status: 'DRAFT',
  }

  const section = {
    id: 1,
    title: 'Introduction',
    description: 'Introduction to the course',
    position: 1,
    courseId: 1,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockVerifyToken.mockImplementation((token: string) => {
      if (token === 'admin-token') {
        return { userId: 1 }
      }

      if (token === 'learner-token') {
        return { userId: 2 }
      }

      throw new Error('Invalid token')
    })

    mockUserFirst.mockImplementation(({ id }: { id: number }) => {
      if (id === 1) return Promise.resolve(adminUser)
      if (id === 2) return Promise.resolve(learnerUser)

      return Promise.resolve(null)
    })

    mockCourseFirst.mockResolvedValue(publishedCourse)
    mockSectionCreate.mockResolvedValue(section)
    mockSectionAll.mockResolvedValue([section])
    mockSectionFirst.mockResolvedValue(section)

    mockSectionWhere.mockReturnValue({
      update: mockSectionUpdate,
    })

    mockSectionUpdate.mockResolvedValue(section)
  })

  describe('GET /api/courses/:courseId/sections', () => {
    it('should return sections for a published course', async () => {
      const response = await request(app).get(
        '/api/courses/1/sections',
      )

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual([section])
      expect(mockCourseFirst).toHaveBeenCalledWith({ id: 1 })
    })

    it('should return sections sorted by position', async () => {
      mockSectionAll.mockResolvedValue([
        { ...section, id: 3, position: 3 },
        { ...section, id: 1, position: 1 },
        { ...section, id: 2, position: 2 },
      ])

      const response = await request(app).get(
        '/api/courses/1/sections',
      )

      expect(response.status).toBe(200)
      expect(response.body.data.map((item: { position: number }) => item.position))
        .toEqual([1, 2, 3])
    })

    it('should return 404 when the course does not exist', async () => {
      mockCourseFirst.mockResolvedValue(null)

      const response = await request(app).get(
        '/api/courses/999/sections',
      )

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Course not found')
    })

    it('should return 404 when the course is not published', async () => {
      mockCourseFirst.mockResolvedValue(draftCourse)

      const response = await request(app).get(
        '/api/courses/2/sections',
      )

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Course not found')
      expect(mockSectionAll).not.toHaveBeenCalled()
    })

    it('should reject an invalid course ID', async () => {
      const response = await request(app).get(
        '/api/courses/invalid/sections',
      )

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Invalid course ID')
    })
  })

  describe('POST /api/courses/:courseId/sections', () => {
    const validSection = {
      title: 'Introduction',
      description: 'Introduction to the course',
      position: 1,
    }

    it('should create a section as an admin', async () => {
      const response = await request(app)
        .post('/api/courses/1/sections')
        .set('Authorization', 'Bearer admin-token')
        .send(validSection)

      expect(response.status).toBe(201)
      expect(response.body.message).toBe('Section created successfully')
      expect(response.body.data).toEqual(section)

      expect(mockSectionCreate).toHaveBeenCalledWith({
        ...validSection,
        courseId: 1,
      })
    })

    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .post('/api/courses/1/sections')
        .send(validSection)

      expect(response.status).toBe(401)
      expect(mockSectionCreate).not.toHaveBeenCalled()
    })

    it('should reject requests from learners', async () => {
      const response = await request(app)
        .post('/api/courses/1/sections')
        .set('Authorization', 'Bearer learner-token')
        .send(validSection)

      expect(response.status).toBe(403)
      expect(mockSectionCreate).not.toHaveBeenCalled()
    })

    it('should reject an invalid course ID', async () => {
      const response = await request(app)
        .post('/api/courses/invalid/sections')
        .set('Authorization', 'Bearer admin-token')
        .send(validSection)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Invalid course ID')
      expect(mockSectionCreate).not.toHaveBeenCalled()
    })

    it('should reject invalid section data', async () => {
      const response = await request(app)
        .post('/api/courses/1/sections')
        .set('Authorization', 'Bearer admin-token')
        .send({
          title: 'A',
          position: 0,
        })

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Invalid section data')
      expect(mockSectionCreate).not.toHaveBeenCalled()
    })

    it('should return 404 when the course does not exist', async () => {
      mockCourseFirst.mockResolvedValue(null)

      const response = await request(app)
        .post('/api/courses/999/sections')
        .set('Authorization', 'Bearer admin-token')
        .send(validSection)

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Course not found')
    })
  })

  describe('PATCH /api/sections/:id', () => {
    it('should update a section as an admin', async () => {
      const updatedSection = {
        ...section,
        title: 'Updated introduction',
      }

      mockSectionUpdate.mockResolvedValue(updatedSection)

      const response = await request(app)
        .patch('/api/sections/1')
        .set('Authorization', 'Bearer admin-token')
        .send({ title: 'Updated introduction' })

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Section updated successfully')
      expect(response.body.data).toEqual(updatedSection)

      expect(mockSectionWhere).toHaveBeenCalledWith({ id: 1 })
      expect(mockSectionUpdate).toHaveBeenCalledWith({
        title: 'Updated introduction',
      })
    })

    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .patch('/api/sections/1')
        .send({ title: 'Updated introduction' })

      expect(response.status).toBe(401)
      expect(mockSectionFirst).not.toHaveBeenCalled()
    })

    it('should reject requests from learners', async () => {
      const response = await request(app)
        .patch('/api/sections/1')
        .set('Authorization', 'Bearer learner-token')
        .send({ title: 'Updated introduction' })

      expect(response.status).toBe(403)
      expect(mockSectionFirst).not.toHaveBeenCalled()
    })

    it('should reject an invalid section ID', async () => {
      const response = await request(app)
        .patch('/api/sections/invalid')
        .set('Authorization', 'Bearer admin-token')
        .send({ title: 'Updated introduction' })

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Invalid section ID')
    })

    it('should reject an empty update body', async () => {
      const response = await request(app)
        .patch('/api/sections/1')
        .set('Authorization', 'Bearer admin-token')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Invalid section data')
    })

    it('should return 404 when the section does not exist', async () => {
      mockSectionFirst.mockResolvedValue(null)

      const response = await request(app)
        .patch('/api/sections/999')
        .set('Authorization', 'Bearer admin-token')
        .send({ title: 'Updated introduction' })

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Section not found')
    })
  })

  describe('PATCH /api/sections/:id/position', () => {
    it('should update section position as an admin', async () => {
      const updatedSection = {
        ...section,
        position: 2,
      }

      mockSectionUpdate.mockResolvedValue(updatedSection)

      const response = await request(app)
        .patch('/api/sections/1/position')
        .set('Authorization', 'Bearer admin-token')
        .send({ position: 2 })

      expect(response.status).toBe(200)
      expect(response.body.message).toBe(
        'Section position updated successfully',
      )
      expect(response.body.data).toEqual(updatedSection)

      expect(mockSectionWhere).toHaveBeenCalledWith({ id: 1 })
      expect(mockSectionUpdate).toHaveBeenCalledWith({ position: 2 })
    })

    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .patch('/api/sections/1/position')
        .send({ position: 2 })

      expect(response.status).toBe(401)
      expect(mockSectionFirst).not.toHaveBeenCalled()
    })

    it('should reject requests from learners', async () => {
      const response = await request(app)
        .patch('/api/sections/1/position')
        .set('Authorization', 'Bearer learner-token')
        .send({ position: 2 })

      expect(response.status).toBe(403)
      expect(mockSectionFirst).not.toHaveBeenCalled()
    })

    it('should reject an invalid section ID', async () => {
      const response = await request(app)
        .patch('/api/sections/invalid/position')
        .set('Authorization', 'Bearer admin-token')
        .send({ position: 2 })

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Invalid section ID')
    })

    it('should reject an invalid position', async () => {
      const response = await request(app)
        .patch('/api/sections/1/position')
        .set('Authorization', 'Bearer admin-token')
        .send({ position: 0 })

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Invalid position')
      expect(mockSectionUpdate).not.toHaveBeenCalled()
    })

    it('should return 404 when the section does not exist', async () => {
      mockSectionFirst.mockResolvedValue(null)

      const response = await request(app)
        .patch('/api/sections/999/position')
        .set('Authorization', 'Bearer admin-token')
        .send({ position: 2 })

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Section not found')
    })
  })
})