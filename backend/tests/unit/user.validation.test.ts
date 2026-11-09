import { describe, expect, it } from 'vitest'
import {
  createUserSchema,
  paginationSchema,
  userIdSchema,
  updateUserSchema,
  updateUserStatusSchema,
} from '../../src/modules/users/user.validation.js'

describe('createUserSchema', () => {
  const validUser = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
  }

  it('accepts valid user data', () => {
    expect(createUserSchema.safeParse(validUser).success).toBe(true)
  })

  it('trims whitespace from the name', () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      name: '  John Doe  ',
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.name).toBe('John Doe')
    }
  })

  it('rejects names shorter than 2 characters', () => {
    expect(
      createUserSchema.safeParse({ ...validUser, name: 'J' }).success,
    ).toBe(false)
  })

  it('rejects invalid email addresses', () => {
    expect(
      createUserSchema.safeParse({
        ...validUser,
        email: 'invalid-email',
      }).success,
    ).toBe(false)
  })

  it('rejects passwords shorter than 8 characters', () => {
    expect(
      createUserSchema.safeParse({
        ...validUser,
        password: 'short',
      }).success,
    ).toBe(false)
  })
})

describe('paginationSchema', () => {
  it('uses default pagination values', () => {
    expect(paginationSchema.parse({})).toEqual({
      page: 1,
      limit: 10,
    })
  })

  it('coerces string values into numbers', () => {
    expect(paginationSchema.parse({ page: '2', limit: '20' })).toEqual({
      page: 2,
      limit: 20,
    })
  })

  it('rejects page numbers below 1', () => {
    expect(paginationSchema.safeParse({ page: '0' }).success).toBe(false)
  })

  it('rejects limits above 100', () => {
    expect(paginationSchema.safeParse({ limit: '101' }).success).toBe(false)
  })
})

describe('userIdSchema', () => {
  it('accepts a positive integer ID', () => {
    expect(userIdSchema.safeParse({ id: '5' }).success).toBe(true)
  })

  it('rejects non-numeric IDs', () => {
    expect(userIdSchema.safeParse({ id: 'abc' }).success).toBe(false)
  })

  it('rejects zero and negative IDs', () => {
    expect(userIdSchema.safeParse({ id: '0' }).success).toBe(false)
    expect(userIdSchema.safeParse({ id: '-1' }).success).toBe(false)
  })
})

describe('updateUserSchema', () => {
  it('accepts a name update', () => {
    expect(updateUserSchema.safeParse({ name: 'Jane Doe' }).success).toBe(true)
  })

  it('accepts an email update', () => {
    expect(
      updateUserSchema.safeParse({ email: 'jane@example.com' }).success,
    ).toBe(true)
  })

  it('rejects an empty update', () => {
    expect(updateUserSchema.safeParse({}).success).toBe(false)
  })

  it('rejects invalid email addresses', () => {
    expect(
      updateUserSchema.safeParse({ email: 'invalid-email' }).success,
    ).toBe(false)
  })
})

describe('updateUserStatusSchema', () => {
  it('accepts a boolean active status', () => {
    expect(updateUserStatusSchema.safeParse({ isActive: false }).success).toBe(
      true,
    )
  })

  it('rejects non-boolean active statuses', () => {
    expect(
      updateUserStatusSchema.safeParse({ isActive: 'false' }).success,
    ).toBe(false)
  })
})