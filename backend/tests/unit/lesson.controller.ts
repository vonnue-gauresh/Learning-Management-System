import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Response } from 'express'
import type { AuthenticatedRequest } from '../../src/middleware/authenticate.js'

const {
  createLesson,
  getSectionLessons,
  getLessonById,
  updateLesson,
  updateLessonPosition,
} = vi.hoisted(() => ({
  createLesson: vi.fn(),
  getSectionLessons: vi.fn(),
  getLessonById: vi.fn(),
  updateLesson: vi.fn(),
  updateLessonPosition: vi.fn(),
}))

vi.mock('../../src/modules/lesson/lesson.service.js', () => ({
  createLesson,
  getSectionLessons,
  getLessonById,
  updateLesson,
  updateLessonPosition,
}))

import {
  createLessonHandler,
  listSectionLessons,
  getLesson,
  updateLessonHandler,
  updateLessonPositionHandler,
} from '../../src/modules/lessons/lesson.controller.js'

describe('Lesson Controller', () => {
  let req: Partial<AuthenticatedRequest>
  let res: Response
  let status: ReturnType<typeof vi.fn>
  let json: ReturnType<typeof vi.fn>

  const createdLesson = {
    id: 1,
    title: 'Introduction to React',
    description: 'Learn React basics',
    content: 'React is a JavaScript library.',
    videoUrl: 'https://example.com/video',
    position: 1,
    sectionId: 5,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    req = {
      params: {},
      body: {},
      user: {
        userId: 10,
        role: 'ADMIN',
      },
    }

    status = vi.fn().mockReturnThis()
    json = vi.fn().mockReturnThis()

    res = { status, json } as unknown as Response
  })

  describe('createLessonHandler', () => {
    it('should create a lesson successfully', async () => {
      req.params = { sectionId: '5' }
      req.body = {
        title: 'Introduction to React',
        description: 'Learn React basics',
        content: 'React is a JavaScript library.',
        videoUrl: 'https://example.com/video',
        position: 1,
      }

      createLesson.mockResolvedValue(createdLesson)

      await createLessonHandler(
        req as AuthenticatedRequest,
        res,
      )

      expect(createLesson).toHaveBeenCalledWith(
        5,
        req.body,
      )
      expect(status).toHaveBeenCalledWith(201)
      expect(json).toHaveBeenCalledWith({
        message: 'Lesson created successfully',
        data: createdLesson,
      })
    })

    it('should reject an invalid section ID', async () => {
      req.params = { sectionId: 'invalid' }

      await createLessonHandler(
        req as AuthenticatedRequest,
        res,
      )

      expect(status).toHaveBeenCalledWith(400)
      expect(json).toHaveBeenCalledWith({
        message: 'Invalid section ID',
      })
      expect(createLesson).not.toHaveBeenCalled()
    })

    it('should reject invalid lesson data', async () => {
      req.params = { sectionId: '5' }
      req.body = {
        title: 'A',
        position: 1,
      }

      await createLessonHandler(
        req as AuthenticatedRequest,
        res,
      )

      expect(status).toHaveBeenCalledWith(400)
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid lesson data',
          errors: expect.any(Object),
        }),
      )
      expect(createLesson).not.toHaveBeenCalled()
    })

    it('should return 404 when the section does not exist', async () => {
      req.params = { sectionId: '999' }
      req.body = {
        title: 'Introduction to React',
        position: 1,
      }

      createLesson.mockRejectedValue(new Error('Section not found'))

      await createLessonHandler(
        req as AuthenticatedRequest,
        res,
      )

      expect(status).toHaveBeenCalledWith(404)
      expect(json).toHaveBeenCalledWith({
        message: 'Section not found',
      })
    })

    it('should rethrow unexpected errors', async () => {
      req.params = { sectionId: '5' }
      req.body = {
        title: 'Introduction to React',
        position: 1,
      }

      const error = new Error('Database error')
      createLesson.mockRejectedValue(error)

      await expect(
        createLessonHandler(req as AuthenticatedRequest, res),
      ).rejects.toThrow('Database error')
    })
  })

  describe('listSectionLessons', () => {
    it('should return section lessons successfully', async () => {
      req.params = { sectionId: '5' }

      const lessons = [
        { id: 1, title: 'Lesson 1', position: 1, sectionId: 5 },
        { id: 2, title: 'Lesson 2', position: 2, sectionId: 5 },
      ]

      getSectionLessons.mockResolvedValue(lessons)

      await listSectionLessons(
        req as AuthenticatedRequest,
        res,
      )

      expect(getSectionLessons).toHaveBeenCalledWith(5)
      expect(status).toHaveBeenCalledWith(200)
      expect(json).toHaveBeenCalledWith({
        data: lessons,
      })
    })

    it('should reject an invalid section ID', async () => {
      req.params = { sectionId: 'invalid' }

      await listSectionLessons(
        req as AuthenticatedRequest,
        res,
      )

      expect(status).toHaveBeenCalledWith(400)
      expect(json).toHaveBeenCalledWith({
        message: 'Invalid section ID',
      })
      expect(getSectionLessons).not.toHaveBeenCalled()
    })

    it('should return 404 when the section or course is unavailable', async () => {
      req.params = { sectionId: '999' }
      getSectionLessons.mockResolvedValue(null)

      await listSectionLessons(
        req as AuthenticatedRequest,
        res,
      )

      expect(status).toHaveBeenCalledWith(404)
      expect(json).toHaveBeenCalledWith({
        message: 'Section not found or course unavailable',
      })
    })
  })

  describe('getLesson', () => {
    it('should return lesson content successfully', async () => {
      req.params = { id: '1' }
      getLessonById.mockResolvedValue(createdLesson)

      await getLesson(
        req as AuthenticatedRequest,
        res,
      )

      expect(getLessonById).toHaveBeenCalledWith(1, 10, true)
      expect(status).toHaveBeenCalledWith(200)
      expect(json).toHaveBeenCalledWith({
        data: createdLesson,
      })
    })

    it('should pass learner access details to the service', async () => {
      req.params = { id: '1' }
      req.user = {
        userId: 20,
        role: 'LEARNER',
      }

      getLessonById.mockResolvedValue(createdLesson)

      await getLesson(
        req as AuthenticatedRequest,
        res,
      )

      expect(getLessonById).toHaveBeenCalledWith(1, 20, false)
    })

    it('should reject an invalid lesson ID', async () => {
      req.params = { id: 'invalid' }

      await getLesson(
        req as AuthenticatedRequest,
        res,
      )

      expect(status).toHaveBeenCalledWith(400)
      expect(json).toHaveBeenCalledWith({
        message: 'Invalid lesson ID',
      })
      expect(getLessonById).not.toHaveBeenCalled()
    })

    it('should return 404 when the lesson is unavailable or access is denied', async () => {
      req.params = { id: '999' }
      getLessonById.mockResolvedValue(null)

      await getLesson(
        req as AuthenticatedRequest,
        res,
      )

      expect(status).toHaveBeenCalledWith(404)
      expect(json).toHaveBeenCalledWith({
        message: 'Lesson not found or access denied',
      })
    })
  })

  describe('updateLessonHandler', () => {
    it('should update lesson details successfully', async () => {
      req.params = { id: '1' }
      req.body = {
        title: 'Updated lesson',
        description: 'Updated description',
        content: 'Updated content',
        videoUrl: 'https://example.com/updated-video',
      }

      const updatedLesson = {
        ...createdLesson,
        ...req.body,
      }

      updateLesson.mockResolvedValue(updatedLesson)

      await updateLessonHandler(
        req as AuthenticatedRequest,
        res,
      )

      expect(updateLesson).toHaveBeenCalledWith(1, req.body)
      expect(status).toHaveBeenCalledWith(200)
      expect(json).toHaveBeenCalledWith({
        message: 'Lesson updated successfully',
        data: updatedLesson,
      })
    })

    it('should reject an invalid lesson ID', async () => {
      req.params = { id: 'invalid' }

      await updateLessonHandler(
        req as AuthenticatedRequest,
        res,
      )

      expect(status).toHaveBeenCalledWith(400)
      expect(json).toHaveBeenCalledWith({
        message: 'Invalid lesson ID',
      })
      expect(updateLesson).not.toHaveBeenCalled()
    })

    it('should reject invalid lesson data', async () => {
      req.params = { id: '1' }
      req.body = {}

      await updateLessonHandler(
        req as AuthenticatedRequest,
        res,
      )

      expect(status).toHaveBeenCalledWith(400)
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid lesson data',
          errors: expect.any(Object),
        }),
      )
      expect(updateLesson).not.toHaveBeenCalled()
    })

    it('should return 404 when the lesson does not exist', async () => {
      req.params = { id: '999' }
      req.body = { title: 'Updated lesson' }
      updateLesson.mockResolvedValue(null)

      await updateLessonHandler(
        req as AuthenticatedRequest,
        res,
      )

      expect(status).toHaveBeenCalledWith(404)
      expect(json).toHaveBeenCalledWith({
        message: 'Lesson not found',
      })
    })
  })

  describe('updateLessonPositionHandler', () => {
    it('should update lesson position successfully', async () => {
      req.params = { id: '1' }
      req.body = { position: 3 }

      const updatedLesson = {
        ...createdLesson,
        position: 3,
      }

      updateLessonPosition.mockResolvedValue(updatedLesson)

      await updateLessonPositionHandler(
        req as AuthenticatedRequest,
        res,
      )

      expect(updateLessonPosition).toHaveBeenCalledWith(1, 3)
      expect(status).toHaveBeenCalledWith(200)
      expect(json).toHaveBeenCalledWith({
        message: 'Lesson position updated successfully',
        data: updatedLesson,
      })
    })

    it('should reject an invalid lesson ID', async () => {
      req.params = { id: 'invalid' }

      await updateLessonPositionHandler(
        req as AuthenticatedRequest,
        res,
      )

      expect(status).toHaveBeenCalledWith(400)
      expect(json).toHaveBeenCalledWith({
        message: 'Invalid lesson ID',
      })
      expect(updateLessonPosition).not.toHaveBeenCalled()
    })

    it('should reject an invalid position', async () => {
      req.params = { id: '1' }
      req.body = { position: 0 }

      await updateLessonPositionHandler(
        req as AuthenticatedRequest,
        res,
      )

      expect(status).toHaveBeenCalledWith(400)
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid lesson position',
          errors: expect.any(Object),
        }),
      )
      expect(updateLessonPosition).not.toHaveBeenCalled()
    })

    it('should return 404 when the lesson does not exist', async () => {
      req.params = { id: '999' }
      req.body = { position: 3 }
      updateLessonPosition.mockResolvedValue(null)

      await updateLessonPositionHandler(
        req as AuthenticatedRequest,
        res,
      )

      expect(status).toHaveBeenCalledWith(404)
      expect(json).toHaveBeenCalledWith({
        message: 'Lesson not found',
      })
    })
  })
})