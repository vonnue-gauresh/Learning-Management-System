import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

const {
  mockFirst,
  mockAll,
  mockCreate,
  mockWhere,
  mockUpdate,
  mockHashPassword,
  mockVerifyToken,
} = vi.hoisted(() => ({
  mockFirst: vi.fn(),
  mockAll: vi.fn(),
  mockCreate: vi.fn(),
  mockWhere: vi.fn(),
  mockUpdate: vi.fn(),
  mockHashPassword: vi.fn(),
  mockVerifyToken: vi.fn(),
}))

vi.mock('../../src/prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        User: {
          first: mockFirst,
          all: mockAll,
          create: mockCreate,
          where: mockWhere,
        },
      },
    },
  },
}))

vi.mock('../../src/utils/password.js', () => ({
  hashPassword: mockHashPassword,
}))

vi.mock('../../src/utils/jwt.js', () => ({
  verifyToken: mockVerifyToken,
}))

import { app } from '../../src/app.js'

const adminUser = {
  id: 1,
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'ADMIN',
  isActive: true,
}

const learnerUser = {
  id: 2,
  name: 'Jane Doe',
  email: 'jane@example.com',
  role: 'LEARNER',
  isActive: true,
}

describe('User Management API', () => {
  const adminAuth = { Authorization: 'Bearer admin-token' }
  const learnerAuth = { Authorization: 'Bearer learner-token' }

  beforeEach(() => {
    vi.clearAllMocks()

    mockVerifyToken.mockImplementation((token: string) => {
      if (token === 'admin-token') return { userId: 1 }
      if (token === 'learner-token') return { userId: 2 }
      throw new Error('Invalid token')
    })

    mockFirst.mockImplementation(({ id, email }: { id?: number; email?: string }) => {
      if (id === 1) return Promise.resolve(adminUser)
      if (id === 2) return Promise.resolve(learnerUser)

      if (email === 'existing@example.com') {
        return Promise.resolve({ id: 3, email })
      }

      return Promise.resolve(null)
    })

    mockWhere.mockReturnValue({
      update: mockUpdate,
    })

    mockHashPassword.mockResolvedValue('hashed-password')
  })

  describe('Authentication and authorization', () => {
    it('rejects requests without an authentication token', async () => {
      const response = await request(app).get('/api/users')

      expect(response.status).toBe(401)
      expect(response.body.message).toBe('Authentication required')
    })

    it('rejects requests from learners', async () => {
      const response = await request(app)
        .get('/api/users')
        .set(learnerAuth)

      expect(response.status).toBe(403)
    })
  })

  describe('POST /api/users', () => {
    it('allows an admin to create a learner', async () => {
      mockCreate.mockResolvedValue({
        id: 3,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'LEARNER',
        isActive: true,
      })

      const response = await request(app)
        .post('/api/users')
        .set(adminAuth)
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        })

      expect(response.status).toBe(201)
      expect(response.body.message).toBe('Learner created successfully')
      expect(response.body.user.role).toBe('LEARNER')
      expect(mockHashPassword).toHaveBeenCalledWith('password123')
    })

    it('rejects invalid user data', async () => {
      const response = await request(app)
        .post('/api/users')
        .set(adminAuth)
        .send({
          name: 'J',
          email: 'invalid-email',
          password: '123',
        })

      expect(response.status).toBe(400)
      expect(mockCreate).not.toHaveBeenCalled()
    })

    it('rejects duplicate email addresses', async () => {
      mockFirst.mockImplementation(({ id, email }) => {
        if (id === 1) return Promise.resolve(adminUser)
        if (email === 'existing@example.com') {
          return Promise.resolve({ id: 3, email })
        }
        return Promise.resolve(null)
      })

      const response = await request(app)
        .post('/api/users')
        .set(adminAuth)
        .send({
          name: 'John Doe',
          email: 'existing@example.com',
          password: 'password123',
        })

      expect(response.status).toBe(409)
      expect(response.body.message).toBe('Email is already registered')
    })
  })

  describe('GET /api/users', () => {
    it('returns a paginated user list for admins', async () => {
      mockAll.mockResolvedValue([adminUser, learnerUser])

      const response = await request(app)
        .get('/api/users?page=1&limit=10')
        .set(adminAuth)

      expect(response.status).toBe(200)
      expect(response.body.users).toHaveLength(2)
      expect(response.body.pagination).toEqual({
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      })
    })

    it('rejects invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/users?page=0')
        .set(adminAuth)

      expect(response.status).toBe(400)
      expect(mockAll).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/users/:id', () => {
    it('returns an individual user', async () => {
      const response = await request(app)
        .get('/api/users/2')
        .set(adminAuth)

      expect(response.status).toBe(200)
      expect(response.body.user).toEqual(learnerUser)
    })

    it('returns 404 when the user does not exist', async () => {
      const response = await request(app)
        .get('/api/users/999')
        .set(adminAuth)

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('User not found')
    })
  })

  describe('PATCH /api/users/:id', () => {
    it('updates user details', async () => {
      const updatedUser = {
        ...learnerUser,
        name: 'Jane Smith',
      }

      mockUpdate.mockResolvedValue(updatedUser)

      const response = await request(app)
        .patch('/api/users/2')
        .set(adminAuth)
        .send({ name: 'Jane Smith' })

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('User updated successfully')
      expect(response.body.user.name).toBe('Jane Smith')
    })

    it('rejects an empty update body', async () => {
      const response = await request(app)
        .patch('/api/users/2')
        .set(adminAuth)
        .send({})

      expect(response.status).toBe(400)
      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })

  describe('PATCH /api/users/:id/status', () => {
    it('deactivates a user', async () => {
      mockUpdate.mockResolvedValue({
        ...learnerUser,
        isActive: false,
      })

      const response = await request(app)
        .patch('/api/users/2/status')
        .set(adminAuth)
        .send({ isActive: false })

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('User deactivated successfully')
    })

    it('activates a user', async () => {
      mockUpdate.mockResolvedValue({
        ...learnerUser,
        isActive: true,
      })

      const response = await request(app)
        .patch('/api/users/2/status')
        .set(adminAuth)
        .send({ isActive: true })

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('User activated successfully')
    })
  })
})