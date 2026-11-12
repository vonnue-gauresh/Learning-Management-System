import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Request, Response } from 'express'

const {
  mockCreateCourse,
  mockGetCourses,
  mockGetCourseById,
  mockUpdateCourse,
  mockUpdateCourseStatus,
} = vi.hoisted(() => ({
  mockCreateCourse: vi.fn(),
  mockGetCourses: vi.fn(),
  mockGetCourseById: vi.fn(),
  mockUpdateCourse: vi.fn(),
  mockUpdateCourseStatus: vi.fn(),
}))

vi.mock('../../src/modules/courses/course.service.js', () => ({
  createCourse: mockCreateCourse,
  getCourses: mockGetCourses,
  getCourseById: mockGetCourseById,
  updateCourse: mockUpdateCourse,
  updateCourseStatus: mockUpdateCourseStatus,
}))

import {
  createCourseHandler,
  listCourses,
  getCourse,
  updateCourseHandler,
  updateCourseStatusHandler,
} from '../../src/modules/courses/course.controller.js'

function createResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }

  return res as unknown as Response
}

describe('Course controller', () => {
  let res: Response

  beforeEach(() => {
    vi.clearAllMocks()
    res = createResponse()
  })

  describe('createCourseHandler', () => {
    const courseInput = {
      title: 'JavaScript Fundamentals',
      description: 'Learn the fundamentals of JavaScript programming.',
      thumbnail: 'https://example.com/thumbnail.jpg',
      categoryId: 1,
    }

    it('creates a course successfully', async () => {
      const course = {
        id: 1,
        ...courseInput,
        status: 'DRAFT',
      }

      mockCreateCourse.mockResolvedValue(course)

      const req = {
        body: courseInput,
      } as Request

      await createCourseHandler(req, res)

      expect(mockCreateCourse).toHaveBeenCalledWith(courseInput)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Course created successfully',
        data: course,
      })
    })

    it('returns 400 for invalid request data', async () => {
      const req = {
        body: {
          title: 'JS',
          description: 'Short',
          categoryId: 1,
        },
      } as Request

      await createCourseHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid course data',
        }),
      )
      expect(mockCreateCourse).not.toHaveBeenCalled()
    })

    it('returns 404 when the category does not exist', async () => {
      mockCreateCourse.mockRejectedValue(
        new Error('Category not found'),
      )

      const req = {
        body: courseInput,
      } as Request

      await createCourseHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category not found',
      })
    })

    it('rethrows unexpected service errors', async () => {
      mockCreateCourse.mockRejectedValue(
        new Error('Database unavailable'),
      )

      const req = {
        body: courseInput,
      } as Request

      await expect(createCourseHandler(req, res)).rejects.toThrow(
        'Database unavailable',
      )
    })
  })

  describe('listCourses', () => {
    it('returns all courses for an admin', async () => {
      const courses = [
        { id: 1, title: 'Course 1', status: 'PUBLISHED' },
        { id: 2, title: 'Course 2', status: 'DRAFT' },
      ]

      mockGetCourses.mockResolvedValue(courses)

      const req = {
        user: { userId: 1, role: 'ADMIN' },
      } as unknown as Request

      await listCourses(req, res)

      expect(mockGetCourses).toHaveBeenCalledWith(true)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        data: courses,
      })
    })

    it('returns only published courses for a learner', async () => {
      const courses = [
        { id: 1, title: 'Course 1', status: 'PUBLISHED' },
      ]

      mockGetCourses.mockResolvedValue(courses)

      const req = {
        user: { userId: 2, role: 'LEARNER' },
      } as unknown as Request

      await listCourses(req, res)

      expect(mockGetCourses).toHaveBeenCalledWith(false)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        data: courses,
      })
    })

    it('returns published courses for a public request', async () => {
      mockGetCourses.mockResolvedValue([])

      await listCourses({} as Request, res)

      expect(mockGetCourses).toHaveBeenCalledWith(false)
      expect(res.json).toHaveBeenCalledWith({
        data: [],
      })
    })
  })

  describe('getCourse', () => {
    it('returns a course successfully', async () => {
      const course = {
        id: 1,
        title: 'JavaScript Fundamentals',
        status: 'PUBLISHED',
      }

      mockGetCourseById.mockResolvedValue(course)

      const req = {
        params: { id: '1' },
        user: { userId: 1, role: 'ADMIN' },
      } as unknown as Request

      await getCourse(req, res)

      expect(mockGetCourseById).toHaveBeenCalledWith(1, true)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        data: course,
      })
    })

    it('returns 400 for an invalid course ID', async () => {
      const req = {
        params: { id: 'abc' },
      } as unknown as Request

      await getCourse(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid course ID',
      })
      expect(mockGetCourseById).not.toHaveBeenCalled()
    })

    it('returns 404 when the course does not exist', async () => {
      mockGetCourseById.mockResolvedValue(null)

      const req = {
        params: { id: '99' },
        user: { userId: 1, role: 'ADMIN' },
      } as unknown as Request

      await getCourse(req, res)

      expect(mockGetCourseById).toHaveBeenCalledWith(99, true)
      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Course not found',
      })
    })

    it('requests published courses for a public request', async () => {
      mockGetCourseById.mockResolvedValue(null)

      const req = {
        params: { id: '1' },
      } as unknown as Request

      await getCourse(req, res)

      expect(mockGetCourseById).toHaveBeenCalledWith(1, false)
    })
  })

  describe('updateCourseHandler', () => {
    it('updates a course successfully', async () => {
      const course = {
        id: 1,
        title: 'Advanced JavaScript',
        description: 'An updated course description.',
        status: 'DRAFT',
      }

      mockUpdateCourse.mockResolvedValue(course)

      const req = {
        params: { id: '1' },
        body: {
          title: 'Advanced JavaScript',
          description: 'An updated course description.',
        },
      } as unknown as Request

      await updateCourseHandler(req, res)

      expect(mockUpdateCourse).toHaveBeenCalledWith(1, req.body)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Course updated successfully',
        data: course,
      })
    })

    it('returns 400 for an invalid course ID', async () => {
      const req = {
        params: { id: 'abc' },
        body: { title: 'Advanced JavaScript' },
      } as unknown as Request

      await updateCourseHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(mockUpdateCourse).not.toHaveBeenCalled()
    })

    it('returns 400 for an invalid request body', async () => {
      const req = {
        params: { id: '1' },
        body: {},
      } as unknown as Request

      await updateCourseHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(mockUpdateCourse).not.toHaveBeenCalled()
    })

    it('returns 404 when the course does not exist', async () => {
      mockUpdateCourse.mockResolvedValue(null)

      const req = {
        params: { id: '99' },
        body: { title: 'Advanced JavaScript' },
      } as unknown as Request

      await updateCourseHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Course not found',
      })
    })

    it('returns 404 when the updated category does not exist', async () => {
      mockUpdateCourse.mockRejectedValue(
        new Error('Category not found'),
      )

      const req = {
        params: { id: '1' },
        body: { categoryId: 99 },
      } as unknown as Request

      await updateCourseHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category not found',
      })
    })

    it('rethrows unexpected service errors', async () => {
      mockUpdateCourse.mockRejectedValue(
        new Error('Database unavailable'),
      )

      const req = {
        params: { id: '1' },
        body: { title: 'Advanced JavaScript' },
      } as unknown as Request

      await expect(updateCourseHandler(req, res)).rejects.toThrow(
        'Database unavailable',
      )
    })
  })

  describe('updateCourseStatusHandler', () => {
    it('updates course status successfully', async () => {
      const course = {
        id: 1,
        title: 'JavaScript Fundamentals',
        status: 'PUBLISHED',
      }

      mockUpdateCourseStatus.mockResolvedValue(course)

      const req = {
        params: { id: '1' },
        body: { status: 'PUBLISHED' },
      } as unknown as Request

      await updateCourseStatusHandler(req, res)

      expect(mockUpdateCourseStatus).toHaveBeenCalledWith(
        1,
        'PUBLISHED',
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Course status updated successfully',
        data: course,
      })
    })

    it('returns 400 for an invalid course ID', async () => {
      const req = {
        params: { id: 'abc' },
        body: { status: 'PUBLISHED' },
      } as unknown as Request

      await updateCourseStatusHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(mockUpdateCourseStatus).not.toHaveBeenCalled()
    })

    it('returns 400 for an unsupported course status', async () => {
      const req = {
        params: { id: '1' },
        body: { status: 'PENDING' },
      } as unknown as Request

      await updateCourseStatusHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid course status',
        }),
      )
      expect(mockUpdateCourseStatus).not.toHaveBeenCalled()
    })

    it('returns 404 when the course does not exist', async () => {
      mockUpdateCourseStatus.mockResolvedValue(null)

      const req = {
        params: { id: '99' },
        body: { status: 'PUBLISHED' },
      } as unknown as Request

      await updateCourseStatusHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Course not found',
      })
    })
  })
})