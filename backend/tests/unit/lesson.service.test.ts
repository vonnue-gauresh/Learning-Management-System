import { beforeEach, describe, expect, it, vi } from 'vitest'

const { courseSectionFirst, courseFirst, lessonFirst, lessonAll, lessonCreate, lessonWhere, enrollmentFirst } =
  vi.hoisted(() => ({
    courseSectionFirst: vi.fn(),
    courseFirst: vi.fn(),
    lessonFirst: vi.fn(),
    lessonAll: vi.fn(),
    lessonCreate: vi.fn(),
    lessonWhere: vi.fn(),
    enrollmentFirst: vi.fn(),
  }))

vi.mock('../../src/prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        CourseSection: {
          first: courseSectionFirst,
        },
        Course: {
          first: courseFirst,
        },
        Lesson: {
          first: lessonFirst,
          all: lessonAll,
          create: lessonCreate,
          where: lessonWhere,
        },
        Enrollment: {
          first: enrollmentFirst,
        },
      },
    },
  },
}))

import {
  createLesson,
  getSectionLessons,
  getLessonById,
  updateLesson,
  updateLessonPosition,
} from '../../src/modules/lessons/lesson.service.js'

describe('Lesson Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createLesson', () => {
    const input = {
      title: 'Introduction to React',
      description: 'Learn React basics',
      content: 'React is a JavaScript library.',
      videoUrl: 'https://example.com/video',
      position: 1,
    }

    it('should create a lesson successfully', async () => {
      courseSectionFirst.mockResolvedValue({ id: 1, courseId: 10 })

      const createdLesson = { id: 1, ...input, sectionId: 1 }
      lessonCreate.mockResolvedValue(createdLesson)

      const result = await createLesson(1, input)

      expect(courseSectionFirst).toHaveBeenCalledWith({ id: 1 })
      expect(lessonCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: input.title,
          description: input.description,
          content: input.content,
          videoUrl: input.videoUrl,
          position: input.position,
          sectionId: 1,
          updatedAt: expect.anything(),
        }),
      )
      expect(result).toEqual(createdLesson)
    })

    it('should set optional fields to null when omitted', async () => {
      courseSectionFirst.mockResolvedValue({ id: 1, courseId: 10 })
      lessonCreate.mockResolvedValue({ id: 1 })

      await createLesson(1, {
        title: 'Introduction to React',
        position: 1,
      })

      expect(lessonCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          description: null,
          content: null,
          videoUrl: null,
        }),
      )
    })

    it('should throw an error when the section does not exist', async () => {
      courseSectionFirst.mockResolvedValue(null)

      await expect(createLesson(999, input)).rejects.toThrow(
        'Section not found',
      )

      expect(lessonCreate).not.toHaveBeenCalled()
    })
  })

  describe('getSectionLessons', () => {
    const section = { id: 1, courseId: 10 }

    it('should return lessons for a section in position order', async () => {
      courseSectionFirst.mockResolvedValue(section)
      courseFirst.mockResolvedValue({ id: 10, status: 'PUBLISHED' })

      lessonAll.mockResolvedValue([
        {
          id: 3,
          title: 'Lesson 3',
          description: 'Third lesson',
          content: 'Private content 3',
          videoUrl: 'https://example.com/3',
          position: 3,
          sectionId: 1,
        },
        {
          id: 1,
          title: 'Lesson 1',
          description: 'First lesson',
          content: 'Private content 1',
          videoUrl: 'https://example.com/1',
          position: 1,
          sectionId: 1,
        },
        {
          id: 2,
          title: 'Lesson 2',
          description: 'Second lesson',
          content: 'Private content 2',
          videoUrl: 'https://example.com/2',
          position: 2,
          sectionId: 1,
        },
        {
          id: 4,
          title: 'Other section lesson',
          description: null,
          position: 1,
          sectionId: 2,
        },
      ])

      const result = await getSectionLessons(1)

      expect(result).toEqual([
        {
          id: 1,
          title: 'Lesson 1',
          description: 'First lesson',
          position: 1,
          sectionId: 1,
        },
        {
          id: 2,
          title: 'Lesson 2',
          description: 'Second lesson',
          position: 2,
          sectionId: 1,
        },
        {
          id: 3,
          title: 'Lesson 3',
          description: 'Third lesson',
          position: 3,
          sectionId: 1,
        },
      ])

      // Public lesson metadata must not expose lesson content or video URLs.
      expect(result?.[0]).not.toHaveProperty('content')
      expect(result?.[0]).not.toHaveProperty('videoUrl')
    })

    it('should return null when the section does not exist', async () => {
      courseSectionFirst.mockResolvedValue(null)

      const result = await getSectionLessons(999)

      expect(result).toBeNull()
      expect(courseFirst).not.toHaveBeenCalled()
      expect(lessonAll).not.toHaveBeenCalled()
    })

    it('should return null when the course does not exist', async () => {
      courseSectionFirst.mockResolvedValue(section)
      courseFirst.mockResolvedValue(null)

      const result = await getSectionLessons(1)

      expect(result).toBeNull()
      expect(lessonAll).not.toHaveBeenCalled()
    })

    it('should return null when the course is not published', async () => {
      courseSectionFirst.mockResolvedValue(section)
      courseFirst.mockResolvedValue({ id: 10, status: 'DRAFT' })

      const result = await getSectionLessons(1)

      expect(result).toBeNull()
      expect(lessonAll).not.toHaveBeenCalled()
    })
  })

  describe('getLessonById', () => {
    const lesson = {
      id: 1,
      title: 'Introduction to React',
      sectionId: 5,
      content: 'Lesson content',
    }

    const section = { id: 5, courseId: 10 }
    const publishedCourse = { id: 10, status: 'PUBLISHED' }

    it('should return null when the lesson does not exist', async () => {
      lessonFirst.mockResolvedValue(null)

      const result = await getLessonById(1, 20, false)

      expect(result).toBeNull()
      expect(courseSectionFirst).not.toHaveBeenCalled()
    })

    it('should return null when the section does not exist', async () => {
      lessonFirst.mockResolvedValue(lesson)
      courseSectionFirst.mockResolvedValue(null)

      const result = await getLessonById(1, 20, false)

      expect(result).toBeNull()
      expect(courseFirst).not.toHaveBeenCalled()
    })

    it('should return null when the course does not exist', async () => {
      lessonFirst.mockResolvedValue(lesson)
      courseSectionFirst.mockResolvedValue(section)
      courseFirst.mockResolvedValue(null)

      const result = await getLessonById(1, 20, false)

      expect(result).toBeNull()
      expect(enrollmentFirst).not.toHaveBeenCalled()
    })

    it('should allow an admin to access a lesson in a draft course', async () => {
      lessonFirst.mockResolvedValue(lesson)
      courseSectionFirst.mockResolvedValue(section)
      courseFirst.mockResolvedValue({ id: 10, status: 'DRAFT' })

      const result = await getLessonById(1, 20, true)

      expect(result).toEqual(lesson)
      expect(enrollmentFirst).not.toHaveBeenCalled()
    })

    it('should allow an admin to access a lesson in a published course', async () => {
      lessonFirst.mockResolvedValue(lesson)
      courseSectionFirst.mockResolvedValue(section)
      courseFirst.mockResolvedValue(publishedCourse)

      const result = await getLessonById(1, 20, true)

      expect(result).toEqual(lesson)
      expect(enrollmentFirst).not.toHaveBeenCalled()
    })

    it('should return null for a learner when the course is not published', async () => {
      lessonFirst.mockResolvedValue(lesson)
      courseSectionFirst.mockResolvedValue(section)
      courseFirst.mockResolvedValue({ id: 10, status: 'DRAFT' })

      const result = await getLessonById(1, 20, false)

      expect(result).toBeNull()
      expect(enrollmentFirst).not.toHaveBeenCalled()
    })

    it('should allow an enrolled learner to access a published course lesson', async () => {
      lessonFirst.mockResolvedValue(lesson)
      courseSectionFirst.mockResolvedValue(section)
      courseFirst.mockResolvedValue(publishedCourse)
      enrollmentFirst.mockResolvedValue({
        userId: 20,
        courseId: 10,
        status: 'ACTIVE',
      })

      const result = await getLessonById(1, 20, false)

      expect(enrollmentFirst).toHaveBeenCalledWith({
        userId: 20,
        courseId: 10,
      })
      expect(result).toEqual(lesson)
    })

    it('should deny access when the learner is not enrolled', async () => {
      lessonFirst.mockResolvedValue(lesson)
      courseSectionFirst.mockResolvedValue(section)
      courseFirst.mockResolvedValue(publishedCourse)
      enrollmentFirst.mockResolvedValue(null)

      const result = await getLessonById(1, 20, false)

      expect(result).toBeNull()
    })

    it('should deny access when the enrollment is inactive', async () => {
      lessonFirst.mockResolvedValue(lesson)
      courseSectionFirst.mockResolvedValue(section)
      courseFirst.mockResolvedValue(publishedCourse)
      enrollmentFirst.mockResolvedValue({
        userId: 20,
        courseId: 10,
        status: 'INACTIVE',
      })

      const result = await getLessonById(1, 20, false)

      expect(result).toBeNull()
    })
  })

  describe('updateLesson', () => {
    const lesson = { id: 1, title: 'Old title', sectionId: 5 }

    it('should update lesson details successfully', async () => {
      lessonFirst.mockResolvedValue(lesson)
      const updatedLesson = { ...lesson, title: 'Updated title' }

      lessonWhere.mockReturnValue({
        update: vi.fn().mockResolvedValue(updatedLesson),
      })

      const result = await updateLesson(1, {
        title: 'Updated title',
      })

      expect(lessonFirst).toHaveBeenCalledWith({ id: 1 })
      expect(lessonWhere).toHaveBeenCalledWith({ id: 1 })
      expect(result).toEqual(updatedLesson)
    })

    it('should update nullable fields to null', async () => {
      lessonFirst.mockResolvedValue(lesson)

      const update = vi.fn().mockResolvedValue({
        ...lesson,
        description: null,
        content: null,
        videoUrl: null,
      })

      lessonWhere.mockReturnValue({ update })

      await updateLesson(1, {
        description: null,
        content: null,
        videoUrl: null,
      })

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          description: null,
          content: null,
          videoUrl: null,
          updatedAt: expect.anything(),
        }),
      )
    })

    it('should return null when the lesson does not exist', async () => {
      lessonFirst.mockResolvedValue(null)

      const result = await updateLesson(999, {
        title: 'Updated title',
      })

      expect(result).toBeNull()
      expect(lessonWhere).not.toHaveBeenCalled()
    })
  })

  describe('updateLessonPosition', () => {
    it('should update lesson position successfully', async () => {
      lessonFirst.mockResolvedValue({ id: 1, position: 1 })

      const updatedLesson = { id: 1, position: 3 }
      const update = vi.fn().mockResolvedValue(updatedLesson)

      lessonWhere.mockReturnValue({ update })

      const result = await updateLessonPosition(1, 3)

      expect(lessonWhere).toHaveBeenCalledWith({ id: 1 })
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          position: 3,
          updatedAt: expect.anything(),
        }),
      )
      expect(result).toEqual(updatedLesson)
    })

    it('should return null when the lesson does not exist', async () => {
      lessonFirst.mockResolvedValue(null)

      const result = await updateLessonPosition(999, 3)

      expect(result).toBeNull()
      expect(lessonWhere).not.toHaveBeenCalled()
    })
  })
})