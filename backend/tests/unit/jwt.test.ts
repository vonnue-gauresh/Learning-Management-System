import { describe, expect, it } from 'vitest'
import { generateToken, verifyToken } from '../../src/utils/jwt.js'

describe('JWT utilities', () => {
  const payload = {
    userId: 1,
    role: 'LEARNER',
  }

  it('generates a JWT token', () => {
    const token = generateToken(payload)

    expect(token).toBeTruthy()
    expect(token.split('.')).toHaveLength(3)
  })

  it('verifies a valid token and returns its payload', () => {
    const token = generateToken(payload)

    expect(verifyToken(token)).toMatchObject(payload)
  })

  it('rejects an invalid token', () => {
    expect(() => verifyToken('invalid-token')).toThrow()
  })
})