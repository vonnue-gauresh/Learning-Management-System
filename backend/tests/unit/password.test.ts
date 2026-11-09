import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '../../src/utils/password.js'

describe('Password utilities', () => {
  it('hashes a password without storing the plain text', async () => {
    const password = 'LearnHub@123'
    const hash = await hashPassword(password)

    expect(hash).toBeTruthy()
    expect(hash).not.toBe(password)
  })

  it('verifies the correct password', async () => {
    const password = 'LearnHub@123'
    const hash = await hashPassword(password)

    await expect(verifyPassword(hash, password)).resolves.toBe(true)
  })

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('LearnHub@123')

    await expect(verifyPassword(hash, 'WrongPassword')).resolves.toBe(false)
  })
})