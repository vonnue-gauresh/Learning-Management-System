import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  userFirst: vi.fn(),
  userCreate: vi.fn(),
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}))

vi.mock('../../src/prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        User: {
          first: mocks.userFirst,
          create: mocks.userCreate,
        },
      },
    },
  },
}))

vi.mock('../../src/utils/password.js', () => ({
  hashPassword: mocks.hashPassword,
  verifyPassword: mocks.verifyPassword,
}))

import {
  getUserById,
  loginUser,
  registerUser,
} from '../../src/modules/auth/auth.service.js'

const validUser = {
  id: 1,
  name: 'Gauresh',
  email: 'gauresh@example.com',
  passwordHash: 'hashed-password',
  role: 'LEARNER',
  isActive: true,
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.hashPassword.mockResolvedValue('hashed-password')
  mocks.verifyPassword.mockResolvedValue(true)
})

describe('registerUser', () => {
  const input = {
    name: 'Gauresh',
    email: 'gauresh@example.com',
    password: 'LearnHub@123',
  }

  it('registers a new learner', async () => {
    mocks.userFirst.mockResolvedValue(null)
    mocks.userCreate.mockResolvedValue(validUser)

    const result = await registerUser(input)

    expect(mocks.hashPassword).toHaveBeenCalledWith(input.password)
    expect(mocks.userCreate).toHaveBeenCalledWith({
      name: input.name,
      email: input.email,
      passwordHash: 'hashed-password',
      role: 'LEARNER',
      isActive: true,
    })

    expect(result).toEqual({
      id: 1,
      name: 'Gauresh',
      email: 'gauresh@example.com',
      role: 'LEARNER',
    })
    expect(result).not.toHaveProperty('passwordHash')
  })

  it('rejects an already registered email', async () => {
    mocks.userFirst.mockResolvedValue(validUser)

    await expect(registerUser(input)).rejects.toThrow(
      'Email is already registered',
    )

    expect(mocks.userCreate).not.toHaveBeenCalled()
    expect(mocks.hashPassword).not.toHaveBeenCalled()
  })
})

describe('loginUser', () => {
  const input = {
    email: 'gauresh@example.com',
    password: 'LearnHub@123',
  }

  it('logs in an active user with a valid password', async () => {
    mocks.userFirst.mockResolvedValue(validUser)

    const result = await loginUser(input)

    expect(mocks.verifyPassword).toHaveBeenCalledWith(
      validUser.passwordHash,
      input.password,
    )
    expect(result).toEqual({
      id: 1,
      name: 'Gauresh',
      email: 'gauresh@example.com',
      role: 'LEARNER',
    })
    expect(result).not.toHaveProperty('passwordHash')
  })

  it('rejects an unknown email', async () => {
    mocks.userFirst.mockResolvedValue(null)

    await expect(loginUser(input)).rejects.toThrow(
      'Invalid email or password',
    )

    expect(mocks.verifyPassword).not.toHaveBeenCalled()
  })

  it('rejects an inactive account', async () => {
    mocks.userFirst.mockResolvedValue({
      ...validUser,
      isActive: false,
    })

    await expect(loginUser(input)).rejects.toThrow('Account is inactive')

    expect(mocks.verifyPassword).not.toHaveBeenCalled()
  })

  it('rejects an incorrect password', async () => {
    mocks.userFirst.mockResolvedValue(validUser)
    mocks.verifyPassword.mockResolvedValue(false)

    await expect(loginUser(input)).rejects.toThrow(
      'Invalid email or password',
    )
  })
})

describe('getUserById', () => {
  it('returns an active user', async () => {
    mocks.userFirst.mockResolvedValue(validUser)

    const result = await getUserById(1)

    expect(result).toEqual({
      id: 1,
      name: 'Gauresh',
      email: 'gauresh@example.com',
      role: 'LEARNER',
    })
  })

  it('returns null when the user does not exist', async () => {
    mocks.userFirst.mockResolvedValue(null)

    await expect(getUserById(999)).resolves.toBeNull()
  })

  it('returns null for an inactive user', async () => {
    mocks.userFirst.mockResolvedValue({
      ...validUser,
      isActive: false,
    })

    await expect(getUserById(1)).resolves.toBeNull()
  })
})