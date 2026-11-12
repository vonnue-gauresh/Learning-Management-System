import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  updateCourseStatus,
} from '../../src/modules/courses/course.service.js'

const { 
  mockCategoryFirst,
  mockCourseFirst,
  mockCourseCreate,
  mockCourseAll,
  mockCourseWhere,
  mockCourseUpdate,
  mockInstant,
} = vi.hoisted(() => ({
  mockCategoryFirst: vi.fn(),
  mockCourseFirst: vi.fn(),
  mockCourseCreate: vi.fn(),
  mockCourseAll: vi.fn(),
  mockCourseWhere: vi.fn(),
  mockCourseUpdate: vi.fn(),
  mockInstant: vi.fn(),
}))

vi.mock('../../src/prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        Category: {
          first: mockCategoryFirst,
        },
        Course: {
          first: mockCourseFirst,
          create: mockCourseCreate,
          all: mockCourseAll,
          where: mockCourseWhere,
        },
      },
    },
  },
}))

vi.mock('temporal-polyfill', () => ({
  Temporal: {
    Now: {
      instant: mockInstant,
    },
  },
}))

const mockTimestamp = new Date('2026-01-01T00:00:00.000Z')

const category = {
  id: 1,
  name: 'Programming',
  description: 'Programming courses',
}

const course = {
  id: 1,
  title: 'JavaScript Fundamentals',
  description: 'Learn the fundamentals of JavaScript programming.',
  thumbnail: 'https://example.com/thumbnail.jpg',
  status: 'DRAFT',
  categoryId: 1,
  createdAt: mockTimestamp,
  updatedAt: mockTimestamp,
}

describe('Course service', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockInstant.mockReturnValue(mockTimestamp)

    mockCourseWhere.mockReturnValue({
      update: mockCourseUpdate,
    })
  })

  describe('createCourse', () => {
    const validInput = {
      title: 'JavaScript Fundamentals',
      description: 'Learn the fundamentals of JavaScript programming.',
      thumbnail: 'https://example.com/thumbnail.jpg',
      categoryId: 1,
    }

    it('creates a course with valid data', async () => {
      mockCategoryFirst.mockResolvedValue(category)
      mockCourseCreate.mockResolvedValue(course)

      const result = await createCourse(validInput)

      expect(mockCategoryFirst).toHaveBeenCalledWith({ id: 1 })

      expect(mockCourseCreate).toHaveBeenCalledWith({
        title: validInput.title,
        description: validInput.description,
        thumbnail: validInput.thumbnail,
        status: 'DRAFT',
        categoryId: 1,
        updatedAt: mockTimestamp,
      })

      expect(result).toEqual(course)
    })

    it('sets thumbnail to null when omitted', async () => {
      mockCategoryFirst.mockResolvedValue(category)
      mockCourseCreate.mockResolvedValue(course)

      const { thumbnail, ...input } = validInput

      await createCourse(input)

      expect(mockCourseCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          thumbnail: null,
        }),
      )
    })

    it('throws an error when the category does not exist', async () => {
      mockCategoryFirst.mockResolvedValue(null)

      await expect(createCourse(validInput)).rejects.toThrow(
        'Category not found',
      )

      expect(mockCourseCreate).not.toHaveBeenCalled()
    })
  })

  describe('getCourses', () => {
    const courses = [
      { ...course, id: 1, status: 'PUBLISHED' },
      { ...course, id: 2, status: 'DRAFT' },
      { ...course, id: 3, status: 'ARCHIVED' },
    ]

    it('returns all courses for an admin', async () => {
      mockCourseAll.mockResolvedValue(courses)

      const result = await getCourses(true)

      expect(mockCourseAll).toHaveBeenCalledOnce()
      expect(result).toEqual(courses)
    })

    it('returns only published courses for a learner', async () => {
      mockCourseAll.mockResolvedValue(courses)

      const result = await getCourses(false)

      expect(result).toEqual([courses[0]])
    })

    it('returns an empty array when no courses exist', async () => {
      mockCourseAll.mockResolvedValue([])

      const result = await getCourses(true)

      expect(result).toEqual([])
    })
  })

  describe('getCourseById', () => {
    it('returns a course when an admin requests it', async () => {
      mockCourseFirst.mockResolvedValue(course)

      const result = await getCourseById(1, true)

      expect(mockCourseFirst).toHaveBeenCalledWith({ id: 1 })
      expect(result).toEqual(course)
    })

    it('returns a published course when a learner requests it', async () => {
      const publishedCourse = {
        ...course,
        status: 'PUBLISHED',
      }

      mockCourseFirst.mockResolvedValue(publishedCourse)

      const result = await getCourseById(1, false)

      expect(result).toEqual(publishedCourse)
    })

    it('returns null when a learner requests a draft course', async () => {
      mockCourseFirst.mockResolvedValue(course)

      const result = await getCourseById(1, false)

      expect(result).toBeNull()
    })

    it('returns null when a learner requests an archived course', async () => {
      mockCourseFirst.mockResolvedValue({
        ...course,
        status: 'ARCHIVED',
      })

      const result = await getCourseById(1, false)

      expect(result).toBeNull()
    })

    it('returns null when the course does not exist', async () => {
      mockCourseFirst.mockResolvedValue(null)

      const result = await getCourseById(999, true)

      expect(result).toBeNull()
    })
  })

  describe('updateCourse', () => {
    it('updates course details', async () => {
      const input = {
        title: 'Advanced JavaScript',
        description: 'An updated course description.',
      }

      mockCourseFirst.mockResolvedValue(course)
      mockCourseUpdate.mockResolvedValue({
        ...course,
        ...input,
      })

      const result = await updateCourse(1, input)

      expect(mockCourseFirst).toHaveBeenCalledWith({ id: 1 })

      expect(mockCourseWhere).toHaveBeenCalledWith({ id: 1 })

      expect(mockCourseUpdate).toHaveBeenCalledWith({
        ...input,
        updatedAt: mockTimestamp,
      })

      expect(result).toEqual({
        ...course,
        ...input,
      })
    })

    it('updates the course category when the category exists', async () => {
      mockCourseFirst.mockResolvedValue(course)
      mockCategoryFirst.mockResolvedValue(category)
      mockCourseUpdate.mockResolvedValue({
        ...course,
        categoryId: 2,
      })

      await updateCourse(1, { categoryId: 2 })

      expect(mockCategoryFirst).toHaveBeenCalledWith({ id: 2 })

      expect(mockCourseUpdate).toHaveBeenCalledWith({
        categoryId: 2,
        updatedAt: mockTimestamp,
      })
    })

    it('throws an error when the new category does not exist', async () => {
      mockCourseFirst.mockResolvedValue(course)
      mockCategoryFirst.mockResolvedValue(null)

      await expect(
        updateCourse(1, { categoryId: 999 }),
      ).rejects.toThrow('Category not found')

      expect(mockCourseUpdate).not.toHaveBeenCalled()
    })

    it('returns null when the course does not exist', async () => {
      mockCourseFirst.mockResolvedValue(null)

      const result = await updateCourse(999, {
        title: 'Updated title',
      })

      expect(result).toBeNull()
      expect(mockCourseUpdate).not.toHaveBeenCalled()
    })

    it('does not check the category when categoryId is omitted', async () => {
      mockCourseFirst.mockResolvedValue(course)
      mockCourseUpdate.mockResolvedValue({
        ...course,
        title: 'Updated title',
      })

      await updateCourse(1, { title: 'Updated title' })

      expect(mockCategoryFirst).not.toHaveBeenCalled()
    })
  })

  describe('updateCourseStatus', () => {
    it.each(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const)(
      'updates course status to %s',
      async (status) => {
        mockCourseFirst.mockResolvedValue(course)
        mockCourseUpdate.mockResolvedValue({
          ...course,
          status,
        })

        const result = await updateCourseStatus(1, status)

        expect(mockCourseFirst).toHaveBeenCalledWith({ id: 1 })

        expect(mockCourseWhere).toHaveBeenCalledWith({ id: 1 })

        expect(mockCourseUpdate).toHaveBeenCalledWith({
          status,
          updatedAt: mockTimestamp,
        })

        expect(result).toEqual({
          ...course,
          status,
        })
      },
    )

    it('returns null when the course does not exist', async () => {
      mockCourseFirst.mockResolvedValue(null)

      const result = await updateCourseStatus(999, 'PUBLISHED')

      expect(result).toBeNull()
      expect(mockCourseUpdate).not.toHaveBeenCalled()
    })
  })
})