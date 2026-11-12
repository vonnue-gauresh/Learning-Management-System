import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockCourseFirst, mockSectionCreate, mockSectionAll, mockSectionFirst, mockSectionWhere } =
  vi.hoisted(() => ({
    mockCourseFirst: vi.fn(),
    mockSectionCreate: vi.fn(),
    mockSectionAll: vi.fn(),
    mockSectionFirst: vi.fn(),
    mockSectionWhere: vi.fn(),
  }))

vi.mock('../../src/prisma/db.js', () => ({
  db: {
    orm: {
      public: {
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

import {
  createSection,
  getCourseSections,
  updateSection,
  updateSectionPosition,
} from '../../src/modules/sections/section.service.js'

describe('Section Service', () => {
  const mockCourse = {
    id: 1,
    title: 'Backend Development',
    status: 'PUBLISHED',
  }

  const mockSection = {
    id: 1,
    title: 'Introduction',
    description: 'Introduction to the course',
    position: 1,
    courseId: 1,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createSection', () => {
    const input = {
      title: 'Introduction',
      description: 'Introduction to the course',
      position: 1,
    }

    it('should create a section for an existing course', async () => {
      mockCourseFirst.mockResolvedValue(mockCourse)
      mockSectionCreate.mockResolvedValue(mockSection)

      const result = await createSection(1, input)

      expect(mockCourseFirst).toHaveBeenCalledWith({ id: 1 })
      expect(mockSectionCreate).toHaveBeenCalledWith({
        title: input.title,
        description: input.description,
        position: input.position,
        courseId: 1,
      })
      expect(result).toEqual(mockSection)
    })

    it('should create a section with a null description when omitted', async () => {
      mockCourseFirst.mockResolvedValue(mockCourse)
      mockSectionCreate.mockResolvedValue({
        ...mockSection,
        description: null,
      })

      const { description, ...inputWithoutDescription } = input

      await createSection(1, inputWithoutDescription)

      expect(mockSectionCreate).toHaveBeenCalledWith({
        title: input.title,
        description: null,
        position: input.position,
        courseId: 1,
      })
    })

    it('should throw an error when the course does not exist', async () => {
      mockCourseFirst.mockResolvedValue(null)

      await expect(createSection(999, input)).rejects.toThrow(
        'Course not found',
      )

      expect(mockSectionCreate).not.toHaveBeenCalled()
    })
  })

  describe('getCourseSections', () => {
    it('should return sections belonging to the course', async () => {
      mockCourseFirst.mockResolvedValue(mockCourse)
      mockSectionAll.mockResolvedValue([
        { ...mockSection, id: 2, position: 2 },
        { ...mockSection, id: 3, courseId: 2 },
        { ...mockSection, id: 1, position: 1 },
      ])

      const result = await getCourseSections(1, false)

      expect(result).toEqual([
        { ...mockSection, id: 1, position: 1 },
        { ...mockSection, id: 2, position: 2 },
      ])
    })

    it('should sort sections by position in ascending order', async () => {
      mockCourseFirst.mockResolvedValue(mockCourse)
      mockSectionAll.mockResolvedValue([
        { ...mockSection, id: 3, position: 3 },
        { ...mockSection, id: 1, position: 1 },
        { ...mockSection, id: 2, position: 2 },
      ])

      const result = await getCourseSections(1, false)

      expect(result?.map((section) => section.position)).toEqual([1, 2, 3])
    })

    it('should return all sections for an admin viewing a draft course', async () => {
      mockCourseFirst.mockResolvedValue({
        ...mockCourse,
        status: 'DRAFT',
      })
      mockSectionAll.mockResolvedValue([mockSection])

      const result = await getCourseSections(1, true)

      expect(result).toEqual([mockSection])
    })

    it('should return null for a learner viewing a draft course', async () => {
      mockCourseFirst.mockResolvedValue({
        ...mockCourse,
        status: 'DRAFT',
      })

      const result = await getCourseSections(1, false)

      expect(result).toBeNull()
      expect(mockSectionAll).not.toHaveBeenCalled()
    })

    it('should return null when the course does not exist', async () => {
      mockCourseFirst.mockResolvedValue(null)

      const result = await getCourseSections(999, false)

      expect(result).toBeNull()
      expect(mockSectionAll).not.toHaveBeenCalled()
    })
  })

  describe('updateSection', () => {
    it('should update a section title', async () => {
      mockSectionFirst.mockResolvedValue(mockSection)

      const updatedSection = {
        ...mockSection,
        title: 'Updated introduction',
      }

      const mockUpdate = vi.fn().mockResolvedValue(updatedSection)
      mockSectionWhere.mockReturnValue({ update: mockUpdate })

      const result = await updateSection(1, {
        title: 'Updated introduction',
      })

      expect(mockSectionFirst).toHaveBeenCalledWith({ id: 1 })
      expect(mockSectionWhere).toHaveBeenCalledWith({ id: 1 })
      expect(mockUpdate).toHaveBeenCalledWith({
        title: 'Updated introduction',
      })
      expect(result).toEqual(updatedSection)
    })

    it('should update a section description', async () => {
      mockSectionFirst.mockResolvedValue(mockSection)

      const mockUpdate = vi.fn().mockResolvedValue({
        ...mockSection,
        description: 'Updated description',
      })
      mockSectionWhere.mockReturnValue({ update: mockUpdate })

      await updateSection(1, {
        description: 'Updated description',
      })

      expect(mockUpdate).toHaveBeenCalledWith({
        description: 'Updated description',
      })
    })

    it('should allow clearing the description with null', async () => {
      mockSectionFirst.mockResolvedValue(mockSection)

      const mockUpdate = vi.fn().mockResolvedValue({
        ...mockSection,
        description: null,
      })
      mockSectionWhere.mockReturnValue({ update: mockUpdate })

      await updateSection(1, {
        description: null,
      })

      expect(mockUpdate).toHaveBeenCalledWith({
        description: null,
      })
    })

    it('should return null when the section does not exist', async () => {
      mockSectionFirst.mockResolvedValue(null)

      const result = await updateSection(999, {
        title: 'Updated introduction',
      })

      expect(result).toBeNull()
      expect(mockSectionWhere).not.toHaveBeenCalled()
    })
  })

  describe('updateSectionPosition', () => {
    it('should update a section position', async () => {
      mockSectionFirst.mockResolvedValue(mockSection)

      const updatedSection = {
        ...mockSection,
        position: 2,
      }

      const mockUpdate = vi.fn().mockResolvedValue(updatedSection)
      mockSectionWhere.mockReturnValue({ update: mockUpdate })

      const result = await updateSectionPosition(1, 2)

      expect(mockSectionFirst).toHaveBeenCalledWith({ id: 1 })
      expect(mockSectionWhere).toHaveBeenCalledWith({ id: 1 })
      expect(mockUpdate).toHaveBeenCalledWith({ position: 2 })
      expect(result).toEqual(updatedSection)
    })

    it('should return null when the section does not exist', async () => {
      mockSectionFirst.mockResolvedValue(null)

      const result = await updateSectionPosition(999, 2)

      expect(result).toBeNull()
      expect(mockSectionWhere).not.toHaveBeenCalled()
    })
  })
})