import { describe, it, expect } from 'vitest'
import {
  createSectionSchema,
  updateSectionSchema,
  sectionIdSchema,
  courseIdSchema,
  updateSectionPositionSchema,
} from '../../src/modules/sections/section.validation.js'

describe('Section Validation', () => {
  describe('createSectionSchema', () => {
    const validSection = {
      title: 'Introduction',
      description: 'Introduction to the course',
      position: 1,
    }

    it('should accept valid section data', () => {
      expect(createSectionSchema.safeParse(validSection).success).toBe(true)
    })

    it('should trim the title and description', () => {
      const result = createSectionSchema.safeParse({
        title: '  Introduction  ',
        description: '  Section description  ',
        position: 1,
      })

      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.title).toBe('Introduction')
        expect(result.data.description).toBe('Section description')
      }
    })

    it('should reject a title shorter than 2 characters', () => {
      expect(
        createSectionSchema.safeParse({
          ...validSection,
          title: 'A',
        }).success,
      ).toBe(false)
    })

    it('should reject a title longer than 150 characters', () => {
      expect(
        createSectionSchema.safeParse({
          ...validSection,
          title: 'A'.repeat(151),
        }).success,
      ).toBe(false)
    })

    it('should reject a description longer than 1000 characters', () => {
      expect(
        createSectionSchema.safeParse({
          ...validSection,
          description: 'A'.repeat(1001),
        }).success,
      ).toBe(false)
    })

    it('should allow an omitted description', () => {
      const { description, ...section } = validSection

      expect(createSectionSchema.safeParse(section).success).toBe(true)
    })

    it.each([0, -1, 1.5, '1'])(
      'should reject an invalid position: %s',
      (position) => {
        expect(
          createSectionSchema.safeParse({
            ...validSection,
            position,
          }).success,
        ).toBe(false)
      },
    )
  })

  describe('updateSectionSchema', () => {
    it('should accept a valid partial update', () => {
      expect(
        updateSectionSchema.safeParse({ title: 'Updated section' }).success,
      ).toBe(true)
    })

    it('should accept a null description', () => {
      expect(
        updateSectionSchema.safeParse({ description: null }).success,
      ).toBe(true)
    })

    it('should accept an omitted description', () => {
      expect(
        updateSectionSchema.safeParse({ title: 'Updated section' }).success,
      ).toBe(true)
    })

    it('should reject an empty update object', () => {
      expect(updateSectionSchema.safeParse({}).success).toBe(false)
    })

    it('should reject an invalid title', () => {
      expect(
        updateSectionSchema.safeParse({ title: 'A' }).success,
      ).toBe(false)
    })

    it('should reject a description longer than 1000 characters', () => {
      expect(
        updateSectionSchema.safeParse({
          description: 'A'.repeat(1001),
        }).success,
      ).toBe(false)
    })
  })

  describe('sectionIdSchema', () => {
    it('should accept a valid section ID', () => {
      expect(sectionIdSchema.safeParse({ id: 1 }).success).toBe(true)
    })

    it('should coerce a numeric string into a number', () => {
      const result = sectionIdSchema.safeParse({ id: '10' })

      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.id).toBe(10)
      }
    })

    it.each(['abc', '0', '-1', '1.5'])(
      'should reject an invalid section ID: %s',
      (id) => {
        expect(sectionIdSchema.safeParse({ id }).success).toBe(false)
      },
    )
  })

  describe('courseIdSchema', () => {
    it('should accept a valid course ID', () => {
      expect(courseIdSchema.safeParse({ courseId: 1 }).success).toBe(true)
    })

    it('should coerce a numeric string into a number', () => {
      const result = courseIdSchema.safeParse({ courseId: '10' })

      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.courseId).toBe(10)
      }
    })

    it.each(['abc', '0', '-1', '1.5'])(
      'should reject an invalid course ID: %s',
      (courseId) => {
        expect(courseIdSchema.safeParse({ courseId }).success).toBe(false)
      },
    )
  })

  describe('updateSectionPositionSchema', () => {
    it('should accept a valid positive integer position', () => {
      expect(
        updateSectionPositionSchema.safeParse({ position: 2 }).success,
      ).toBe(true)
    })

    it.each([0, -1, 1.5, '2'])(
      'should reject an invalid position: %s',
      (position) => {
        expect(
          updateSectionPositionSchema.safeParse({ position }).success,
        ).toBe(false)
      },
    )
  })
})