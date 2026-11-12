import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Response } from 'express'
import type { AuthenticatedRequest } from '../../src/middleware/authenticate.js'

const {
  mockCreateSection,
  mockGetCourseSections,
  mockUpdateSection,
  mockUpdateSectionPosition,
} = vi.hoisted(() => ({
  mockCreateSection: vi.fn(),
  mockGetCourseSections: vi.fn(),
  mockUpdateSection: vi.fn(),
  mockUpdateSectionPosition: vi.fn(),
}))

vi.mock('../../src/modules/sections/section.service.js', () => ({
  createSection: mockCreateSection,
  getCourseSections: mockGetCourseSections,
  updateSection: mockUpdateSection,
  updateSectionPosition: mockUpdateSectionPosition,
}))

import {
  createSectionHandler,
  listCourseSections,
  updateSectionHandler,
  updateSectionPositionHandler,
} from '../../src/modules/sections/section.controller.js'

describe('Section Controller', () => {
  let req: Partial<AuthenticatedRequest>
  let res: Response

  let status: ReturnType<typeof vi.fn>
  let json: ReturnType<typeof vi.fn>

  const mockSection = {
    id: 1,
    title: 'Introduction',
    description: 'Introduction to the course',
    position: 1,
    courseId: 1,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    status = vi.fn().mockReturnThis()
    json = vi.fn().mockReturnThis()

    req = {
      params: {},
      body: {},
      user: undefined,
    }

    res = {
      status,
      json,
    } as unknown as Response
  })

  describe('createSectionHandler', () => {
    it('should create a section successfully', async () => {
      req.params = { courseId: '1' }
      req.body = {
        title: 'Introduction',
        description: 'Introduction to the course',
        position: 1,
      }

      mockCreateSection.mockResolvedValue(mockSection)

      await createSectionHandler(req as AuthenticatedRequest, res)

      expect(mockCreateSection).toHaveBeenCalledWith(1, req.body)
      expect(status).toHaveBeenCalledWith(201)
      expect(json).toHaveBeenCalledWith({
        message: 'Section created successfully',
        data: mockSection,
      })
    })

    it('should reject an invalid course ID', async () => {
      req.params = { courseId: 'invalid' }

      await createSectionHandler(req as AuthenticatedRequest, res)

      expect(status).toHaveBeenCalledWith(400)
      expect(json).toHaveBeenCalledWith({
        message: 'Invalid course ID',
      })
      expect(mockCreateSection).not.toHaveBeenCalled()
    })

    it('should reject invalid section data', async () => {
      req.params = { courseId: '1' }
      req.body = {
        title: 'A',
        position: 0,
      }

      await createSectionHandler(req as AuthenticatedRequest, res)

      expect(status).toHaveBeenCalledWith(400)
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid section data',
          errors: expect.any(Object),
        }),
      )
      expect(mockCreateSection).not.toHaveBeenCalled()
    })

    it('should return 404 when the course does not exist', async () => {
      req.params = { courseId: '999' }
      req.body = {
        title: 'Introduction',
        position: 1,
      }

      mockCreateSection.mockRejectedValue(new Error('Course not found'))

      await createSectionHandler(req as AuthenticatedRequest, res)

      expect(status).toHaveBeenCalledWith(404)
      expect(json).toHaveBeenCalledWith({
        message: 'Course not found',
      })
    })

    it('should rethrow unexpected errors', async () => {
      req.params = { courseId: '1' }
      req.body = {
        title: 'Introduction',
        position: 1,
      }

      mockCreateSection.mockRejectedValue(new Error('Database error'))

      await expect(
        createSectionHandler(req as AuthenticatedRequest, res),
      ).rejects.toThrow('Database error')
    })
  })

  describe('listCourseSections', () => {
    it('should return course sections successfully', async () => {
      req.params = { courseId: '1' }
      req.user = { userId: 2, role: 'LEARNER' }

      mockGetCourseSections.mockResolvedValue([mockSection])

      await listCourseSections(req as AuthenticatedRequest, res)

      expect(mockGetCourseSections).toHaveBeenCalledWith(1, false)
      expect(status).toHaveBeenCalledWith(200)
      expect(json).toHaveBeenCalledWith({
        data: [mockSection],
      })
    })

    it('should identify admin requests', async () => {
      req.params = { courseId: '1' }
      req.user = { userId: 1, role: 'ADMIN' }

      mockGetCourseSections.mockResolvedValue([mockSection])

      await listCourseSections(req as AuthenticatedRequest, res)

      expect(mockGetCourseSections).toHaveBeenCalledWith(1, true)
      expect(status).toHaveBeenCalledWith(200)
    })

    it('should treat unauthenticated requests as non-admin', async () => {
      req.params = { courseId: '1' }

      mockGetCourseSections.mockResolvedValue([mockSection])

      await listCourseSections(req as AuthenticatedRequest, res)

      expect(mockGetCourseSections).toHaveBeenCalledWith(1, false)
    })

    it('should reject an invalid course ID', async () => {
      req.params = { courseId: 'invalid' }

      await listCourseSections(req as AuthenticatedRequest, res)

      expect(status).toHaveBeenCalledWith(400)
      expect(json).toHaveBeenCalledWith({
        message: 'Invalid course ID',
      })
      expect(mockGetCourseSections).not.toHaveBeenCalled()
    })

    it('should return 404 when the course does not exist or is inaccessible', async () => {
      req.params = { courseId: '999' }

      mockGetCourseSections.mockResolvedValue(null)

      await listCourseSections(req as AuthenticatedRequest, res)

      expect(status).toHaveBeenCalledWith(404)
      expect(json).toHaveBeenCalledWith({
        message: 'Course not found',
      })
    })
  })

  describe('updateSectionHandler', () => {
    it('should update a section successfully', async () => {
      req.params = { id: '1' }
      req.body = { title: 'Updated introduction' }

      const updatedSection = {
        ...mockSection,
        title: 'Updated introduction',
      }

      mockUpdateSection.mockResolvedValue(updatedSection)

      await updateSectionHandler(req as AuthenticatedRequest, res)

      expect(mockUpdateSection).toHaveBeenCalledWith(1, req.body)
      expect(status).toHaveBeenCalledWith(200)
      expect(json).toHaveBeenCalledWith({
        message: 'Section updated successfully',
        data: updatedSection,
      })
    })

    it('should reject an invalid section ID', async () => {
      req.params = { id: 'invalid' }
      req.body = { title: 'Updated introduction' }

      await updateSectionHandler(req as AuthenticatedRequest, res)

      expect(status).toHaveBeenCalledWith(400)
      expect(json).toHaveBeenCalledWith({
        message: 'Invalid section ID',
      })
      expect(mockUpdateSection).not.toHaveBeenCalled()
    })

    it('should reject an empty update body', async () => {
      req.params = { id: '1' }
      req.body = {}

      await updateSectionHandler(req as AuthenticatedRequest, res)

      expect(status).toHaveBeenCalledWith(400)
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid section data',
        }),
      )
      expect(mockUpdateSection).not.toHaveBeenCalled()
    })

    it('should return 404 when the section does not exist', async () => {
      req.params = { id: '999' }
      req.body = { title: 'Updated introduction' }

      mockUpdateSection.mockResolvedValue(null)

      await updateSectionHandler(req as AuthenticatedRequest, res)

      expect(status).toHaveBeenCalledWith(404)
      expect(json).toHaveBeenCalledWith({
        message: 'Section not found',
      })
    })
  })

  describe('updateSectionPositionHandler', () => {
    it('should update section position successfully', async () => {
      req.params = { id: '1' }
      req.body = { position: 2 }

      const updatedSection = {
        ...mockSection,
        position: 2,
      }

      mockUpdateSectionPosition.mockResolvedValue(updatedSection)

      await updateSectionPositionHandler(req as AuthenticatedRequest, res)

      expect(mockUpdateSectionPosition).toHaveBeenCalledWith(1, 2)
      expect(status).toHaveBeenCalledWith(200)
      expect(json).toHaveBeenCalledWith({
        message: 'Section position updated successfully',
        data: updatedSection,
      })
    })

    it('should reject an invalid section ID', async () => {
      req.params = { id: 'invalid' }
      req.body = { position: 2 }

      await updateSectionPositionHandler(req as AuthenticatedRequest, res)

      expect(status).toHaveBeenCalledWith(400)
      expect(json).toHaveBeenCalledWith({
        message: 'Invalid section ID',
      })
      expect(mockUpdateSectionPosition).not.toHaveBeenCalled()
    })

    it('should reject an invalid position', async () => {
      req.params = { id: '1' }
      req.body = { position: 0 }

      await updateSectionPositionHandler(req as AuthenticatedRequest, res)

      expect(status).toHaveBeenCalledWith(400)
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid position',
        }),
      )
      expect(mockUpdateSectionPosition).not.toHaveBeenCalled()
    })

    it('should return 404 when the section does not exist', async () => {
      req.params = { id: '999' }
      req.body = { position: 2 }

      mockUpdateSectionPosition.mockResolvedValue(null)

      await updateSectionPositionHandler(req as AuthenticatedRequest, res)

      expect(status).toHaveBeenCalledWith(404)
      expect(json).toHaveBeenCalledWith({
        message: 'Section not found',
      })
    })
  })
})