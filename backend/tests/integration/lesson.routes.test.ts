import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

const {
  userFirst,
  courseSectionFirst,
  courseFirst,
  lessonFirst,
  lessonAll,
  lessonCreate,
  lessonWhere,
  enrollmentFirst,
  verifyToken,
} = vi.hoisted(() => ({
  userFirst: vi.fn(),
  courseSectionFirst: vi.fn(),
  courseFirst: vi.fn(),
  lessonFirst: vi.fn(),
  lessonAll: vi.fn(),
  lessonCreate: vi.fn(),
  lessonWhere: vi.fn(),
  enrollmentFirst: vi.fn(),
  verifyToken: vi.fn(),
}))

vi.mock('../../src/prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        User: { first: userFirst },
        CourseSection: { first: courseSectionFirst },
        Course: { first: courseFirst },
        Lesson: {
          first: lessonFirst,
          all: lessonAll,
          create: lessonCreate,
          where: lessonWhere,
        },
        Enrollment: { first: enrollmentFirst },
      },
    },
  },
}))

vi.mock('../../src/utils/jwt.js', () => ({
  verifyToken,
}))

import {app} from '../../src/app.js'

describe('Lesson Routes', () => {
  const admin = {
    id: 1,
    email: 'admin@example.com',
    role: 'ADMIN',
    isActive: true,
  }

  const learner = {
    id: 2,
    email: 'learner@example.com',
    role: 'LEARNER',
    isActive: true,
  }

  const section = {
    id: 5,
    courseId: 10,
  }

  const publishedCourse = {
    id: 10,
    status: 'PUBLISHED',
  }

  const draftCourse = {
    id: 10,
    status: 'DRAFT',
  }

  const lesson = {
    id: 1,
    title: 'Introduction to React',
    description: 'Learn React basics',
    content: 'React is a JavaScript library.',
    videoUrl: 'https://example.com/video',
    position: 1,
    sectionId: 5,
  }

  const adminToken = 'admin-token'
  const learnerToken = 'learner-token'

  beforeEach(() => {
    vi.clearAllMocks()

    verifyToken.mockImplementation((token: string) => {
      if (token === adminToken) return { userId: admin.id }
      if (token === learnerToken) return { userId: learner.id }

      throw new Error('Invalid token')
    })

    userFirst.mockImplementation(({ id }: { id: number }) => {
      if (id === admin.id) return Promise.resolve(admin)
      if (id === learner.id) return Promise.resolve(learner)

      return Promise.resolve(null)
    })
  })

  describe('GET /api/sections/:sectionId/lessons', () => {
    it('should return lesson metadata for a published course', async () => {
      courseSectionFirst.mockResolvedValue(section)
      courseFirst.mockResolvedValue(publishedCourse)

      lessonAll.mockResolvedValue([
        {
          ...lesson,
          id: 2,
          title: 'Second lesson',
          content: 'Private content',
          videoUrl: 'https://example.com/second',
          position: 2,
        },
        lesson,
      ])

      const response = await request(app)
        .get('/api/sections/5/lessons')

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.data[0]).toEqual({
        id: 1,
        title: 'Introduction to React',
        description: 'Learn React basics',
        position: 1,
        sectionId: 5,
      })
      expect(response.body.data[0]).not.toHaveProperty('content')
      expect(response.body.data[0]).not.toHaveProperty('videoUrl')
    })

    it('should reject an invalid section ID', async () => {
      const response = await request(app)
        .get('/api/sections/invalid/lessons')

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Invalid section ID')
    })

    it('should return 404 when the section does not exist', async () => {
      courseSectionFirst.mockResolvedValue(null)

      const response = await request(app)
        .get('/api/sections/999/lessons')

      expect(response.status).toBe(404)
      expect(response.body.message).toBe(
        'Section not found or course unavailable',
      )
    })

    it('should return 404 when the course is not published', async () => {
      courseSectionFirst.mockResolvedValue(section)
      courseFirst.mockResolvedValue(draftCourse)

      const response = await request(app)
        .get('/api/sections/5/lessons')

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/lessons/:id', () => {
    it('should allow an admin to access lesson content', async () => {
      userFirst.mockResolvedValue(admin)
      lessonFirst.mockResolvedValue(lesson)
      courseSectionFirst.mockResolvedValue(section)
      courseFirst.mockResolvedValue(draftCourse)

      const response = await request(app)
        .get('/api/lessons/1')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual(lesson)
    })

    it('should allow an enrolled learner to access lesson content', async () => {
      userFirst.mockResolvedValue(learner)
      lessonFirst.mockResolvedValue(lesson)
      courseSectionFirst.mockResolvedValue(section)
      courseFirst.mockResolvedValue(publishedCourse)
      enrollmentFirst.mockResolvedValue({
        userId: learner.id,
        courseId: 10,
        status: 'ACTIVE',
      })

      const response = await request(app)
        .get('/api/lessons/1')
        .set('Authorization', `Bearer ${learnerToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual(lesson)
    })

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/lessons/1')

      expect(response.status).toBe(401)
    })

    it('should reject an invalid lesson ID', async () => {
      const response = await request(app)
        .get('/api/lessons/invalid')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Invalid lesson ID')
    })

    it('should return 404 when the lesson does not exist', async () => {
      userFirst.mockResolvedValue(admin)
      lessonFirst.mockResolvedValue(null)

      const response = await request(app)
        .get('/api/lessons/999')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(404)
    })

    it('should deny access to a learner who is not enrolled', async () => {
      userFirst.mockResolvedValue(learner)
      lessonFirst.mockResolvedValue(lesson)
      courseSectionFirst.mockResolvedValue(section)
      courseFirst.mockResolvedValue(publishedCourse)
      enrollmentFirst.mockResolvedValue(null)

      const response = await request(app)
        .get('/api/lessons/1')
        .set('Authorization', `Bearer ${learnerToken}`)

      expect(response.status).toBe(404)
    })

    it('should deny access when the learner enrollment is inactive', async () => {
      userFirst.mockResolvedValue(learner)
      lessonFirst.mockResolvedValue(lesson)
      courseSectionFirst.mockResolvedValue(section)
      courseFirst.mockResolvedValue(publishedCourse)
      enrollmentFirst.mockResolvedValue({
        userId: learner.id,
        courseId: 10,
        status: 'INACTIVE',
      })

      const response = await request(app)
        .get('/api/lessons/1')
        .set('Authorization', `Bearer ${learnerToken}`)

      expect(response.status).toBe(404)
    })

    it('should deny learner access to a draft course', async () => {
      userFirst.mockResolvedValue(learner)
      lessonFirst.mockResolvedValue(lesson)
      courseSectionFirst.mockResolvedValue(section)
      courseFirst.mockResolvedValue(draftCourse)

      const response = await request(app)
        .get('/api/lessons/1')
        .set('Authorization', `Bearer ${learnerToken}`)

      expect(response.status).toBe(404)
      expect(enrollmentFirst).not.toHaveBeenCalled()
    })
  })

  describe('POST /api/sections/:sectionId/lessons', () => {
    const validLesson = {
      title: 'Introduction to React',
      description: 'Learn React basics',
      content: 'React is a JavaScript library.',
      videoUrl: 'https://example.com/video',
      position: 1,
    }

    it('should allow an admin to create a lesson', async () => {
      userFirst.mockResolvedValue(admin)
      courseSectionFirst.mockResolvedValue(section)
      lessonCreate.mockResolvedValue(lesson)

      const response = await request(app)
        .post('/api/sections/5/lessons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validLesson)

      expect(response.status).toBe(201)
      expect(response.body.message).toBe('Lesson created successfully')
      expect(response.body.data).toEqual(lesson)
    })

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/sections/5/lessons')
        .send(validLesson)

      expect(response.status).toBe(401)
    })

    it('should reject learner requests', async () => {
      userFirst.mockResolvedValue(learner)

      const response = await request(app)
        .post('/api/sections/5/lessons')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send(validLesson)

      expect(response.status).toBe(403)
    })

    it('should reject an invalid section ID', async () => {
      userFirst.mockResolvedValue(admin)

      const response = await request(app)
        .post('/api/sections/invalid/lessons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validLesson)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Invalid section ID')
    })

    it('should reject invalid lesson data', async () => {
      userFirst.mockResolvedValue(admin)

      const response = await request(app)
        .post('/api/sections/5/lessons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'A', position: 1 })

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Invalid lesson data')
    })

    it('should return 404 when the section does not exist', async () => {
      userFirst.mockResolvedValue(admin)
      courseSectionFirst.mockResolvedValue(null)

      const response = await request(app)
        .post('/api/sections/999/lessons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validLesson)

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Section not found')
    })
  })

  describe('PATCH /api/lessons/:id', () => {
    it('should allow an admin to update a lesson', async () => {
      userFirst.mockResolvedValue(admin)

      const updatedLesson = {
        ...lesson,
        title: 'Updated lesson',
      }

      lessonFirst.mockResolvedValue(lesson)
      lessonWhere.mockReturnValue({
        update: vi.fn().mockResolvedValue(updatedLesson),
      })

      const response = await request(app)
        .patch('/api/lessons/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated lesson' })

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Lesson updated successfully')
      expect(response.body.data).toEqual(updatedLesson)
    })

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .patch('/api/lessons/1')
        .send({ title: 'Updated lesson' })

      expect(response.status).toBe(401)
    })

    it('should reject learner requests', async () => {
      userFirst.mockResolvedValue(learner)

      const response = await request(app)
        .patch('/api/lessons/1')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({ title: 'Updated lesson' })

      expect(response.status).toBe(403)
    })

    it('should reject an invalid lesson ID', async () => {
      userFirst.mockResolvedValue(admin)

      const response = await request(app)
        .patch('/api/lessons/invalid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated lesson' })

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Invalid lesson ID')
    })

    it('should reject an empty update body', async () => {
      userFirst.mockResolvedValue(admin)

      const response = await request(app)
        .patch('/api/lessons/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Invalid lesson data')
    })

    it('should return 404 when the lesson does not exist', async () => {
      userFirst.mockResolvedValue(admin)
      lessonFirst.mockResolvedValue(null)

      const response = await request(app)
        .patch('/api/lessons/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated lesson' })

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Lesson not found')
    })
  })

  describe('PATCH /api/lessons/:id/position', () => {
    it('should allow an admin to update lesson position', async () => {
      userFirst.mockResolvedValue(admin)
      lessonFirst.mockResolvedValue(lesson)

      const updatedLesson = { ...lesson, position: 3 }

      lessonWhere.mockReturnValue({
        update: vi.fn().mockResolvedValue(updatedLesson),
      })

      const response = await request(app)
        .patch('/api/lessons/1/position')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ position: 3 })

      expect(response.status).toBe(200)
      expect(response.body.message).toBe(
        'Lesson position updated successfully',
      )
      expect(response.body.data).toEqual(updatedLesson)
    })

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .patch('/api/lessons/1/position')
        .send({ position: 3 })

      expect(response.status).toBe(401)
    })

    it('should reject learner requests', async () => {
      userFirst.mockResolvedValue(learner)

      const response = await request(app)
        .patch('/api/lessons/1/position')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({ position: 3 })

      expect(response.status).toBe(403)
    })

    it('should reject an invalid lesson ID', async () => {
      userFirst.mockResolvedValue(admin)

      const response = await request(app)
        .patch('/api/lessons/invalid/position')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ position: 3 })

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Invalid lesson ID')
    })

    it('should reject an invalid position', async () => {
      userFirst.mockResolvedValue(admin)

      const response = await request(app)
        .patch('/api/lessons/1/position')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ position: 0 })

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Invalid lesson position')
    })

    it('should return 404 when the lesson does not exist', async () => {
      userFirst.mockResolvedValue(admin)
      lessonFirst.mockResolvedValue(null)

      const response = await request(app)
        .patch('/api/lessons/999/position')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ position: 3 })

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Lesson not found')
    })
  })
})