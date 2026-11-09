import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema } from '../../src/modules/auth/auth.validation.js'

describe('Registration validation', () => {
  const validInput = {
    name: 'Gauresh',
    email: 'gauresh@example.com',
    password: 'LearnHub@123',
  }

  it('accepts valid registration data', () => {
    expect(registerSchema.safeParse(validInput).success).toBe(true)
  })

  it('trims whitespace from the name', () => {
    const result = registerSchema.safeParse({
      ...validInput,
      name: '  Gauresh  ',
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.name).toBe('Gauresh')
    }
  })

  it('rejects a name shorter than 2 characters', () => {
    expect(
      registerSchema.safeParse({ ...validInput, name: 'G' }).success,
    ).toBe(false)
  })

  it('rejects an invalid email', () => {
    expect(
      registerSchema.safeParse({ ...validInput, email: 'invalid-email' }).success,
    ).toBe(false)
  })

  it('rejects a password shorter than 8 characters', () => {
    expect(
      registerSchema.safeParse({ ...validInput, password: 'short' }).success,
    ).toBe(false)
  })
})

describe('Login validation', () => {
  const validInput = {
    email: 'gauresh@example.com',
    password: 'LearnHub@123',
  }

  it('accepts valid login data', () => {
    expect(loginSchema.safeParse(validInput).success).toBe(true)
  })

  it('rejects an invalid email', () => {
    expect(
      loginSchema.safeParse({ ...validInput, email: 'invalid-email' }).success,
    ).toBe(false)
  })

  it('rejects an empty password', () => {
    expect(
      loginSchema.safeParse({ ...validInput, password: '' }).success,
    ).toBe(false)
  })
})