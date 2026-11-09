import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockFirst, mockCreate, mockAll, mockWhere, mockUpdate, mockHashPassword } =
  vi.hoisted(() => ({
    mockFirst: vi.fn(),
    mockCreate: vi.fn(),
    mockAll: vi.fn(),
    mockWhere: vi.fn(),
    mockUpdate: vi.fn(),
    mockHashPassword: vi.fn(),
  }))

vi.mock('../../src/prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        User: {
          first: mockFirst,
          create: mockCreate,
          all: mockAll,
          where: mockWhere,
        },
      },
    },
  },
}))

vi.mock('../../src/utils/password.js', () => ({
  hashPassword: mockHashPassword,
}))

import {
  createLearner,
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
} from '../../src/modules/users/user.service.js'

describe('User Management service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createLearner', () => {
    const input = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
    }

    it('creates a learner with a hashed password', async () => {
      mockFirst.mockResolvedValue(null)
      mockHashPassword.mockResolvedValue('hashed-password')
      mockCreate.mockResolvedValue({
        id: 1,
        name: input.name,
        email: input.email,
        role: 'LEARNER',
        isActive: true,
      })

      const result = await createLearner(input)

      expect(mockFirst).toHaveBeenCalledWith({ email: input.email })
      expect(mockHashPassword).toHaveBeenCalledWith(input.password)
      expect(mockCreate).toHaveBeenCalledWith({
        name: input.name,
        email: input.email,
        passwordHash: 'hashed-password',
        role: 'LEARNER',
        isActive: true,
      })
      expect(result).toEqual({
        id: 1,
        name: input.name,
        email: input.email,
        role: 'LEARNER',
        isActive: true,
      })
    })

    it('rejects an already registered email', async () => {
      mockFirst.mockResolvedValue({ id: 1 })

      await expect(createLearner(input)).rejects.toThrow(
        'Email is already registered',
      )

      expect(mockCreate).not.toHaveBeenCalled()
      expect(mockHashPassword).not.toHaveBeenCalled()
    })
  })

  describe('getUsers', () => {
    it('returns paginated users', async () => {
      mockAll.mockResolvedValue([
        { id: 1, email: 'one@example.com', role: 'LEARNER', isActive: true },
        { id: 2, email: 'two@example.com', role: 'ADMIN', isActive: true },
        { id: 3, email: 'three@example.com', role: 'LEARNER', isActive: false },
      ])

      const result = await getUsers(2, 2)

      expect(result).toEqual({
        users: [
          { id: 3, email: 'three@example.com', role: 'LEARNER', isActive: false },
        ],
        pagination: {
          total: 3,
          page: 2,
          limit: 2,
          totalPages: 2,
        },
      })
    })

    it('returns an empty list when the requested page has no users', async () => {
      mockAll.mockResolvedValue([])

      const result = await getUsers(1, 10)

      expect(result.users).toEqual([])
      expect(result.pagination.total).toBe(0)
      expect(result.pagination.totalPages).toBe(0)
    })
  })

  describe('getUserById', () => {
    it('returns a user when found', async () => {
      const user = {
        id: 1,
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'LEARNER',
        isActive: true,
      }

      mockFirst.mockResolvedValue(user)

      await expect(getUserById(1)).resolves.toEqual(user)
    })

    it('returns null when the user does not exist', async () => {
      mockFirst.mockResolvedValue(null)

      await expect(getUserById(999)).resolves.toBeNull()
    })
  })

  describe('updateUser', () => {
    it('updates the supplied user fields', async () => {
      mockFirst.mockResolvedValue({
        id: 1,
        name: 'Jane Doe',
        email: 'jane@example.com',
      })

      const updatedUser = {
        id: 1,
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'LEARNER',
        isActive: true,
      }

      mockWhere.mockReturnValue({
        update: mockUpdate.mockResolvedValue(updatedUser),
      })

      const result = await updateUser(1, { name: 'Jane Smith' })

      expect(mockWhere).toHaveBeenCalledWith({ id: 1 })
      expect(mockUpdate).toHaveBeenCalledWith({ name: 'Jane Smith' })
      expect(result).toEqual(updatedUser)
    })

    it('returns null when the user does not exist', async () => {
      mockFirst.mockResolvedValue(null)

      await expect(updateUser(999, { name: 'Jane Smith' })).resolves.toBeNull()
      expect(mockWhere).not.toHaveBeenCalled()
    })

    it('rejects an email already used by another user', async () => {
      mockFirst
        .mockResolvedValueOnce({
          id: 1,
          name: 'Jane Doe',
          email: 'jane@example.com',
        })
        .mockResolvedValueOnce({ id: 2 })

      await expect(
        updateUser(1, { email: 'other@example.com' }),
      ).rejects.toThrow('Email is already registered')

      expect(mockWhere).not.toHaveBeenCalled()
    })

    it('does not check for duplicates when the email is unchanged', async () => {
      mockFirst.mockResolvedValue({
        id: 1,
        name: 'Jane Doe',
        email: 'jane@example.com',
      })

      const updatedUser = {
        id: 1,
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'LEARNER',
        isActive: true,
      }

      mockWhere.mockReturnValue({
        update: mockUpdate.mockResolvedValue(updatedUser),
      })

      await updateUser(1, { email: 'jane@example.com' })

      expect(mockFirst).toHaveBeenCalledTimes(1)
    })
  })

  describe('updateUserStatus', () => {
    it('deactivates a user', async () => {
      const updatedUser = {
        id: 1,
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'LEARNER',
        isActive: false,
      }

      mockWhere.mockReturnValue({
        update: mockUpdate.mockResolvedValue(updatedUser),
      })

      await expect(updateUserStatus(1, false)).resolves.toEqual(updatedUser)

      expect(mockWhere).toHaveBeenCalledWith({ id: 1 })
      expect(mockUpdate).toHaveBeenCalledWith({ isActive: false })
    })

    it('returns null when the user does not exist', async () => {
      mockWhere.mockReturnValue({
        update: mockUpdate.mockResolvedValue(null),
      })

      await expect(updateUserStatus(999, true)).resolves.toBeNull()
    })
  })
})