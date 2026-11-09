import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

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

const { app } = await import('../../src/app.js')
const { generateToken } = await import('../../src/utils/jwt.js')

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

describe('POST /api/auth/register', () => {
  const input = {
    name: 'Gauresh',
    email: 'gauresh@example.com',
    password: 'LearnHub@123',
  }

  it('registers a new learner', async () => {
    mocks.userFirst.mockResolvedValue(null)
    mocks.userCreate.mockResolvedValue(validUser)

    const response = await request(app)
      .post('/api/auth/register')
      .send(input)

    expect(response.status).toBe(201)
    expect(response.body.user).toMatchObject({
      id: 1,
      name: 'Gauresh',
      email: 'gauresh@example.com',
      role: 'LEARNER',
    })
    expect(response.body.user).not.toHaveProperty('passwordHash')
  })

  it('rejects invalid registration data', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...input, email: 'invalid-email' })

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Validation failed')
    expect(mocks.userCreate).not.toHaveBeenCalled()
  })

  it('rejects an already registered email', async () => {
    mocks.userFirst.mockResolvedValue(validUser)

    const response = await request(app)
      .post('/api/auth/register')
      .send(input)

    expect(response.status).toBe(409)
    expect(response.body.message).toBe('Email is already registered')
  })
})

describe('POST /api/auth/login', () => {
  const input = {
    email: 'gauresh@example.com',
    password: 'LearnHub@123',
  }

  it('logs in an active user with valid credentials', async () => {
    mocks.userFirst.mockResolvedValue(validUser)

    const response = await request(app)
      .post('/api/auth/login')
      .send(input)

    expect(response.status).toBe(200)
    expect(response.body.accessToken).toBeTruthy()
    expect(response.body.user.email).toBe(input.email)
  })

  it('rejects incorrect credentials', async () => {
    mocks.userFirst.mockResolvedValue(validUser)
    mocks.verifyPassword.mockResolvedValue(false)

    const response = await request(app)
      .post('/api/auth/login')
      .send(input)

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('Invalid email or password')
  })
})

describe('GET /api/auth/me', () => {
  it('rejects requests without an authentication token', async () => {
    const response = await request(app).get('/api/auth/me')

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('Authentication required')
  })

  it('returns the authenticated user', async () => {
    mocks.userFirst.mockResolvedValue(validUser)

    const token = generateToken({
      userId: validUser.id,
      role: validUser.role,
    })

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.user).toMatchObject({
      id: 1,
      name: 'Gauresh',
      email: 'gauresh@example.com',
      role: 'LEARNER',
    })
  })

  it('rejects invalid tokens', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token')

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('Invalid or expired token')
  })

  it('rejects inactive users', async () => {
    mocks.userFirst.mockResolvedValue({
      ...validUser,
      isActive: false,
    })

    const token = generateToken({
      userId: validUser.id,
      role: validUser.role,
    })

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('Account not found or inactive')
  })
})