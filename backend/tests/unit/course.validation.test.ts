import { describe, expect, it } from 'vitest'
import {
  createCourseSchema,
  updateCourseSchema,
  courseIdSchema,
  updateCourseStatusSchema,
} from '../../src/modules/courses/course.validation.js'

describe('createCourseSchema', () => {
  const validCourse = {
    title: 'JavaScript Fundamentals',
    description: 'Learn the fundamentals of JavaScript programming.',
    thumbnail: 'https://example.com/thumbnail.jpg',
    categoryId: 1,
  }

  it('accepts valid course data', () => {
    expect(createCourseSchema.safeParse(validCourse).success).toBe(true)
  })

  it('trims whitespace from title and description', () => {
    const result = createCourseSchema.safeParse({
      ...validCourse,
      title: '  JavaScript Fundamentals  ',
      description: '  Learn the fundamentals of JavaScript programming.  ',
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.title).toBe('JavaScript Fundamentals')
      expect(result.data.description).toBe(
        'Learn the fundamentals of JavaScript programming.',
      )
    }
  })

  it('allows an omitted thumbnail', () => {
    const { thumbnail, ...course } = validCourse

    expect(createCourseSchema.safeParse(course).success).toBe(true)
  })

  it('rejects titles shorter than 3 characters', () => {
    expect(
      createCourseSchema.safeParse({
        ...validCourse,
        title: 'JS',
      }).success,
    ).toBe(false)
  })

  it('rejects titles longer than 150 characters', () => {
    expect(
      createCourseSchema.safeParse({
        ...validCourse,
        title: 'A'.repeat(151),
      }).success,
    ).toBe(false)
  })

  it('rejects descriptions shorter than 10 characters', () => {
    expect(
      createCourseSchema.safeParse({
        ...validCourse,
        description: 'Too short',
      }).success,
    ).toBe(false)
  })

  it('rejects descriptions longer than 5000 characters', () => {
    expect(
      createCourseSchema.safeParse({
        ...validCourse,
        description: 'A'.repeat(5001),
      }).success,
    ).toBe(false)
  })

  it('rejects invalid thumbnail URLs', () => {
    expect(
      createCourseSchema.safeParse({
        ...validCourse,
        thumbnail: 'not-a-url',
      }).success,
    ).toBe(false)
  })

  it('rejects non-positive category IDs', () => {
    expect(
      createCourseSchema.safeParse({
        ...validCourse,
        categoryId: 0,
      }).success,
    ).toBe(false)

    expect(
      createCourseSchema.safeParse({
        ...validCourse,
        categoryId: -1,
      }).success,
    ).toBe(false)
  })

  it('rejects non-integer category IDs', () => {
    expect(
      createCourseSchema.safeParse({
        ...validCourse,
        categoryId: 1.5,
      }).success,
    ).toBe(false)
  })
})

describe('updateCourseSchema', () => {
  it('accepts a title-only update', () => {
    expect(
      updateCourseSchema.safeParse({
        title: 'Advanced JavaScript',
      }).success,
    ).toBe(true)
  })

  it('accepts a description-only update', () => {
    expect(
      updateCourseSchema.safeParse({
        description: 'An updated course description.',
      }).success,
    ).toBe(true)
  })

  it('accepts a thumbnail-only update', () => {
    expect(
      updateCourseSchema.safeParse({
        thumbnail: 'https://example.com/new-thumbnail.jpg',
      }).success,
    ).toBe(true)
  })

  it('accepts a null thumbnail', () => {
    expect(
      updateCourseSchema.safeParse({
        thumbnail: null,
      }).success,
    ).toBe(true)
  })

  it('accepts a category-only update', () => {
    expect(
      updateCourseSchema.safeParse({
        categoryId: 2,
      }).success,
    ).toBe(true)
  })

  it('accepts multiple fields in an update', () => {
    expect(
      updateCourseSchema.safeParse({
        title: 'Advanced JavaScript',
        description: 'An updated course description.',
        categoryId: 2,
      }).success,
    ).toBe(true)
  })

  it('rejects an empty update', () => {
    expect(updateCourseSchema.safeParse({}).success).toBe(false)
  })

  it('rejects an invalid title', () => {
    expect(
      updateCourseSchema.safeParse({
        title: 'JS',
      }).success,
    ).toBe(false)
  })

  it('rejects an invalid description', () => {
    expect(
      updateCourseSchema.safeParse({
        description: 'Too short',
      }).success,
    ).toBe(false)
  })

  it('rejects an invalid thumbnail URL', () => {
    expect(
      updateCourseSchema.safeParse({
        thumbnail: 'not-a-url',
      }).success,
    ).toBe(false)
  })

  it('rejects non-positive category IDs', () => {
    expect(
      updateCourseSchema.safeParse({
        categoryId: 0,
      }).success,
    ).toBe(false)
  })
})

describe('courseIdSchema', () => {
  it('accepts a positive integer ID', () => {
    expect(courseIdSchema.safeParse({ id: '1' }).success).toBe(true)
  })

  it('rejects zero and negative IDs', () => {
    expect(courseIdSchema.safeParse({ id: '0' }).success).toBe(false)
    expect(courseIdSchema.safeParse({ id: '-1' }).success).toBe(false)
  })

  it('rejects non-numeric IDs', () => {
    expect(courseIdSchema.safeParse({ id: 'abc' }).success).toBe(false)
  })

  it('rejects decimal IDs', () => {
    expect(courseIdSchema.safeParse({ id: '1.5' }).success).toBe(false)
  })
})

describe('updateCourseStatusSchema', () => {
  it.each(['DRAFT', 'PUBLISHED', 'ARCHIVED'])(
    'accepts the %s status',
    (status) => {
      expect(
        updateCourseStatusSchema.safeParse({ status }).success,
      ).toBe(true)
    },
  )

  it('rejects an unsupported status', () => {
    expect(
      updateCourseStatusSchema.safeParse({
        status: 'PENDING',
      }).success,
    ).toBe(false)
  })

  it('rejects a missing status', () => {
    expect(updateCourseStatusSchema.safeParse({}).success).toBe(false)
  })
})