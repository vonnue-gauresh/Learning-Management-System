import { describe, expect, it } from 'vitest'
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
} from '../../src/modules/categories/category.validation.js'

describe('createCategorySchema', () => {
  it('accepts valid category data', () => {
    expect(
      createCategorySchema.safeParse({
        name: 'Programming',
        description: 'Programming courses',
      }).success,
    ).toBe(true)
  })

  it('trims whitespace from fields', () => {
    const result = createCategorySchema.safeParse({
      name: '  Programming  ',
      description: '  Programming courses  ',
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.name).toBe('Programming')
      expect(result.data.description).toBe('Programming courses')
    }
  })

  it('rejects names shorter than 2 characters', () => {
    expect(createCategorySchema.safeParse({ name: 'A' }).success).toBe(false)
  })

  it('rejects names longer than 100 characters', () => {
    expect(
      createCategorySchema.safeParse({ name: 'A'.repeat(101) }).success,
    ).toBe(false)
  })

  it('rejects descriptions longer than 500 characters', () => {
    expect(
      createCategorySchema.safeParse({
        name: 'Programming',
        description: 'A'.repeat(501),
      }).success,
    ).toBe(false)
  })

  it('allows an omitted description', () => {
    expect(
      createCategorySchema.safeParse({ name: 'Programming' }).success,
    ).toBe(true)
  })
})

describe('updateCategorySchema', () => {
  it('accepts a name-only update', () => {
    expect(
      updateCategorySchema.safeParse({ name: 'Development' }).success,
    ).toBe(true)
  })

  it('accepts a description-only update', () => {
    expect(
      updateCategorySchema.safeParse({
        description: 'Updated description',
      }).success,
    ).toBe(true)
  })

  it('rejects an empty update', () => {
    expect(updateCategorySchema.safeParse({}).success).toBe(false)
  })

  it('rejects an invalid name', () => {
    expect(
      updateCategorySchema.safeParse({ name: 'A' }).success,
    ).toBe(false)
  })

  it('rejects a description longer than 500 characters', () => {
    expect(
      updateCategorySchema.safeParse({
        description: 'A'.repeat(501),
      }).success,
    ).toBe(false)
  })
})

describe('categoryIdSchema', () => {
  it('accepts a positive integer ID', () => {
    expect(categoryIdSchema.safeParse({ id: '1' }).success).toBe(true)
  })

  it('rejects zero and negative IDs', () => {
    expect(categoryIdSchema.safeParse({ id: '0' }).success).toBe(false)
    expect(categoryIdSchema.safeParse({ id: '-1' }).success).toBe(false)
  })

  it('rejects non-numeric IDs', () => {
    expect(categoryIdSchema.safeParse({ id: 'abc' }).success).toBe(false)
  })

  it('rejects decimal IDs', () => {
    expect(categoryIdSchema.safeParse({ id: '1.5' }).success).toBe(false)
  })
})