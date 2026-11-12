import { describe, expect, it } from 'vitest'
import {
  createLessonSchema,
  updateLessonSchema,
  lessonIdSchema,
  sectionIdSchema,
  updateLessonPositionSchema,
} from '../../src/modules/lessons/lesson.validation'

describe('Lesson Validation', () => {
  describe('createLessonSchema', () => {
    const validLesson = {
      title: 'Introduction to React',
      position: 1,
    }

    it('should accept valid lesson data', () => {
      expect(createLessonSchema.safeParse(validLesson).success).toBe(true)
    })

    it('should accept all optional fields', () => {
      const result = createLessonSchema.safeParse({
        ...validLesson,
        description: 'Learn the basics of React',
        content: 'React is a JavaScript library.',
        videoUrl: 'https://example.com/video',
      })

      expect(result.success).toBe(true)
    })

    it('should trim string fields', () => {
      const result = createLessonSchema.safeParse({
        title: '  Introduction to React  ',
        description: '  Learn React  ',
        content: '  React content  ',
        position: 1,
      })

      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.title).toBe('Introduction to React')
        expect(result.data.description).toBe('Learn React')
        expect(result.data.content).toBe('React content')
      }
    })

    it('should reject a title shorter than 2 characters', () => {
      expect(
        createLessonSchema.safeParse({
          ...validLesson,
          title: 'A',
        }).success,
      ).toBe(false)
    })

    it('should reject a title longer than 150 characters', () => {
      expect(
        createLessonSchema.safeParse({
          ...validLesson,
          title: 'A'.repeat(151),
        }).success,
      ).toBe(false)
    })

    it('should reject a description longer than 1000 characters', () => {
      expect(
        createLessonSchema.safeParse({
          ...validLesson,
          description: 'A'.repeat(1001),
        }).success,
      ).toBe(false)
    })

    it('should reject an invalid video URL', () => {
      expect(
        createLessonSchema.safeParse({
          ...validLesson,
          videoUrl: 'not-a-url',
        }).success,
      ).toBe(false)
    })

    it('should accept an empty content string after trimming', () => {
      expect(
        createLessonSchema.safeParse({
          ...validLesson,
          content: '   ',
        }).success,
      ).toBe(true)
    })

    it('should reject a missing title', () => {
      expect(
        createLessonSchema.safeParse({
          position: 1,
        }).success,
      ).toBe(false)
    })

    it('should reject a missing position', () => {
      expect(
        createLessonSchema.safeParse({
          title: 'Introduction to React',
        }).success,
      ).toBe(false)
    })

    it('should reject a non-integer position', () => {
      expect(
        createLessonSchema.safeParse({
          ...validLesson,
          position: 1.5,
        }).success,
      ).toBe(false)
    })

    it('should reject a zero or negative position', () => {
      for (const position of [0, -1]) {
        expect(
          createLessonSchema.safeParse({
            ...validLesson,
            position,
          }).success,
        ).toBe(false)
      }
    })
  })

  describe('updateLessonSchema', () => {
    it('should accept a title update', () => {
      expect(
        updateLessonSchema.safeParse({ title: 'Updated lesson' }).success,
      ).toBe(true)
    })

    it('should accept updates to all editable fields', () => {
      expect(
        updateLessonSchema.safeParse({
          title: 'Updated lesson',
          description: 'Updated description',
          content: 'Updated content',
          videoUrl: 'https://example.com/updated-video',
        }).success,
      ).toBe(true)
    })

    it('should accept null for nullable fields', () => {
      expect(
        updateLessonSchema.safeParse({
          description: null,
          content: null,
          videoUrl: null,
        }).success,
      ).toBe(true)
    })

    it('should reject an empty update object', () => {
      expect(updateLessonSchema.safeParse({}).success).toBe(false)
    })

    it('should trim updated string fields', () => {
      const result = updateLessonSchema.safeParse({
        title: '  Updated lesson  ',
        description: '  Updated description  ',
        content: '  Updated content  ',
      })

      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.title).toBe('Updated lesson')
        expect(result.data.description).toBe('Updated description')
        expect(result.data.content).toBe('Updated content')
      }
    })

    it('should reject an invalid updated title', () => {
      expect(
        updateLessonSchema.safeParse({ title: 'A' }).success,
      ).toBe(false)
    })

    it('should reject an invalid updated video URL', () => {
      expect(
        updateLessonSchema.safeParse({ videoUrl: 'invalid-url' }).success,
      ).toBe(false)
    })

    it('should reject a description longer than 1000 characters', () => {
      expect(
        updateLessonSchema.safeParse({
          description: 'A'.repeat(1001),
        }).success,
      ).toBe(false)
    })
  })

  describe('lessonIdSchema', () => {
    it('should accept a valid numeric ID', () => {
      expect(lessonIdSchema.safeParse({ id: 1 }).success).toBe(true)
    })

    it('should coerce a numeric string ID', () => {
      const result = lessonIdSchema.safeParse({ id: '12' })

      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.id).toBe(12)
      }
    })

    it('should reject zero, negative, and non-numeric IDs', () => {
      for (const id of [0, -1, 'invalid']) {
        expect(lessonIdSchema.safeParse({ id }).success).toBe(false)
      }
    })
  })

  describe('sectionIdSchema', () => {
    it('should accept a valid numeric section ID', () => {
      expect(sectionIdSchema.safeParse({ sectionId: 1 }).success).toBe(true)
    })

    it('should coerce a numeric string section ID', () => {
      const result = sectionIdSchema.safeParse({ sectionId: '12' })

      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.sectionId).toBe(12)
      }
    })

    it('should reject zero, negative, and non-numeric section IDs', () => {
      for (const sectionId of [0, -1, 'invalid']) {
        expect(sectionIdSchema.safeParse({ sectionId }).success).toBe(false)
      }
    })
  })

  describe('updateLessonPositionSchema', () => {
    it('should accept a valid positive integer position', () => {
      expect(
        updateLessonPositionSchema.safeParse({ position: 2 }).success,
      ).toBe(true)
    })

    it('should reject zero and negative positions', () => {
      for (const position of [0, -1]) {
        expect(
          updateLessonPositionSchema.safeParse({ position }).success,
        ).toBe(false)
      }
    })

    it('should reject a decimal position', () => {
      expect(
        updateLessonPositionSchema.safeParse({ position: 1.5 }).success,
      ).toBe(false)
    })

    it('should reject a missing position', () => {
      expect(updateLessonPositionSchema.safeParse({}).success).toBe(false)
    })
  })
})