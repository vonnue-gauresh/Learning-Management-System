import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockCreateLearner,
  mockGetUsers,
  mockGetUserById,
  mockUpdateUser,
  mockUpdateUserStatus,
} = vi.hoisted(() => ({
  mockCreateLearner: vi.fn(),
  mockGetUsers: vi.fn(),
  mockGetUserById: vi.fn(),
  mockUpdateUser: vi.fn(),
  mockUpdateUserStatus: vi.fn(),
}))

vi.mock('../../src/modules/users/user.service.js', () => ({
  createLearner: mockCreateLearner,
  getUsers: mockGetUsers,
  getUserById: mockGetUserById,
  updateUser: mockUpdateUser,
  updateUserStatus: mockUpdateUserStatus,
}))

import {
  createUser,
  listUsers,
  getUser,
  updateUserDetails,
  changeUserStatus,
} from '../../src/modules/users/user.controller.js'

function createResponse() {
  const res: any = {}

  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)

  return res
}

describe('User Management controller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createUser', () => {
    const validInput = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
    }

    it('creates a learner successfully', async () => {
      const user = { id: 1, ...validInput, role: 'LEARNER', isActive: true }
      mockCreateLearner.mockResolvedValue(user)

      const req: any = { body: validInput }
      const res = createResponse()

      await createUser(req, res)

      expect(mockCreateLearner).toHaveBeenCalledWith(validInput)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Learner created successfully',
        user,
      })
    })

    it('returns 400 for invalid input', async () => {
      const req: any = { body: { name: 'J', email: 'invalid', password: '123' } }
      const res = createResponse()

      await createUser(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(mockCreateLearner).not.toHaveBeenCalled()
    })

    it('returns 409 when the email is already registered', async () => {
      mockCreateLearner.mockRejectedValue(
        new Error('Email is already registered'),
      )

      const req: any = { body: validInput }
      const res = createResponse()

      await createUser(req, res)

      expect(res.status).toHaveBeenCalledWith(409)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email is already registered',
      })
    })

    it('returns 500 for unexpected creation errors', async () => {
      mockCreateLearner.mockRejectedValue(new Error('Database unavailable'))

      const req: any = { body: validInput }
      const res = createResponse()

      await createUser(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to create learner',
      })
    })
  })

  describe('listUsers', () => {
    it('returns paginated users', async () => {
      const result = {
        users: [{ id: 1, email: 'jane@example.com', role: 'LEARNER', isActive: true }],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      }

      mockGetUsers.mockResolvedValue(result)

      const req: any = { query: { page: '1', limit: '10' } }
      const res = createResponse()

      await listUsers(req, res)

      expect(mockGetUsers).toHaveBeenCalledWith(1, 10)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(result)
    })

    it('returns 400 for invalid pagination parameters', async () => {
      const req: any = { query: { page: '0', limit: '10' } }
      const res = createResponse()

      await listUsers(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(mockGetUsers).not.toHaveBeenCalled()
    })
  })

  describe('getUser', () => {
    it('returns a user by ID', async () => {
      const user = {
        id: 1,
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'LEARNER',
        isActive: true,
      }

      mockGetUserById.mockResolvedValue(user)

      const req: any = { params: { id: '1' } }
      const res = createResponse()

      await getUser(req, res)

      expect(mockGetUserById).toHaveBeenCalledWith(1)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ user })
    })

    it('returns 400 for an invalid user ID', async () => {
      const req: any = { params: { id: 'abc' } }
      const res = createResponse()

      await getUser(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(mockGetUserById).not.toHaveBeenCalled()
    })

    it('returns 404 when the user does not exist', async () => {
      mockGetUserById.mockResolvedValue(null)

      const req: any = { params: { id: '999' } }
      const res = createResponse()

      await getUser(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'User not found',
      })
    })
  })

  describe('updateUserDetails', () => {
    it('updates user details successfully', async () => {
      const user = {
        id: 1,
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'LEARNER',
        isActive: true,
      }

      mockUpdateUser.mockResolvedValue(user)

      const req: any = {
        params: { id: '1' },
        body: { name: 'Jane Smith' },
      }
      const res = createResponse()

      await updateUserDetails(req, res)

      expect(mockUpdateUser).toHaveBeenCalledWith(1, { name: 'Jane Smith' })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'User updated successfully',
        user,
      })
    })

    it('returns 400 for an invalid user ID', async () => {
      const req: any = {
        params: { id: 'abc' },
        body: { name: 'Jane Smith' },
      }
      const res = createResponse()

      await updateUserDetails(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(mockUpdateUser).not.toHaveBeenCalled()
    })

    it('returns 400 for an invalid request body', async () => {
      const req: any = {
        params: { id: '1' },
        body: {},
      }
      const res = createResponse()

      await updateUserDetails(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(mockUpdateUser).not.toHaveBeenCalled()
    })

    it('returns 404 when the user does not exist', async () => {
      mockUpdateUser.mockResolvedValue(null)

      const req: any = {
        params: { id: '999' },
        body: { name: 'Jane Smith' },
      }
      const res = createResponse()

      await updateUserDetails(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
    })

    it('returns 409 when the updated email is already registered', async () => {
      mockUpdateUser.mockRejectedValue(
        new Error('Email is already registered'),
      )

      const req: any = {
        params: { id: '1' },
        body: { email: 'existing@example.com' },
      }
      const res = createResponse()

      await updateUserDetails(req, res)

      expect(res.status).toHaveBeenCalledWith(409)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email is already registered',
      })
    })

    it('rethrows unexpected errors', async () => {
      const error = new Error('Database unavailable')
      mockUpdateUser.mockRejectedValue(error)

      const req: any = {
        params: { id: '1' },
        body: { name: 'Jane Smith' },
      }
      const res = createResponse()

      await expect(updateUserDetails(req, res)).rejects.toThrow(error)
    })
  })

  describe('changeUserStatus', () => {
    it('deactivates a user successfully', async () => {
      mockUpdateUserStatus.mockResolvedValue({
        id: 1,
        isActive: false,
      })

      const req: any = {
        params: { id: '1' },
        body: { isActive: false },
      }
      const res = createResponse()

      await changeUserStatus(req, res)

      expect(mockUpdateUserStatus).toHaveBeenCalledWith(1, false)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'User deactivated successfully',
      })
    })

    it('returns 400 for an invalid user ID', async () => {
      const req: any = {
        params: { id: 'abc' },
        body: { isActive: false },
      }
      const res = createResponse()

      await changeUserStatus(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(mockUpdateUserStatus).not.toHaveBeenCalled()
    })

    it('returns 400 for an invalid status body', async () => {
      const req: any = {
        params: { id: '1' },
        body: { isActive: 'false' },
      }
      const res = createResponse()

      await changeUserStatus(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(mockUpdateUserStatus).not.toHaveBeenCalled()
    })

    it('returns 400 when the user does not exist', async () => {
      mockUpdateUserStatus.mockResolvedValue(null)

      const req: any = {
        params: { id: '999' },
        body: { isActive: true },
      }
      const res = createResponse()

      await changeUserStatus(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'User not found',
      })
    })

    it('activates a user successfully', async () => {
      mockUpdateUserStatus.mockResolvedValue({
        id: 1,
        isActive: true,
      })

      const req: any = {
        params: { id: '1' },
        body: { isActive: true },
      }
      const res = createResponse()

      await changeUserStatus(req, res)

      expect(res.json).toHaveBeenCalledWith({
        message: 'User activated successfully',
      })
    })
  })
})