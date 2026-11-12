import { Temporal } from 'temporal-polyfill'
import { db } from '../../prisma/db.js'
import type {
  CreateLessonInput,
  UpdateLessonInput,
} from './lesson.validation.js'

export async function createLesson(
  sectionId: number,
  input: CreateLessonInput,
) {
  const section = await db.orm.public.CourseSection.first({
    id: sectionId,
  })

  if (!section) {
    throw new Error('Section not found')
  }

  const lesson = await db.orm.public.Lesson.create({
    title: input.title,
    description: input.description ?? null,
    content: input.content ?? null,
    videoUrl: input.videoUrl ?? null,
    position: input.position,
    sectionId,
    updatedAt: Temporal.Now.instant(),
  })

  return lesson
}

export async function getSectionLessons(sectionId: number) {
  const section = await db.orm.public.CourseSection.first({
    id: sectionId,
  })

  if (!section) return null

  const course = await db.orm.public.Course.first({
    id: section.courseId,
  })

  if (!course || course.status !== 'PUBLISHED') {
    return null
  }

  const lessons = await db.orm.public.Lesson.all()

  return lessons
    .filter((lesson) => lesson.sectionId === sectionId)
    .sort((a, b) => a.position - b.position)
    .map(({ id, title, description, position, sectionId }) => ({
      id,
      title,
      description,
      position,
      sectionId,
    }))
}

export async function getLessonById(
  lessonId: number,
  userId: number,
  isAdmin: boolean,
) {
  const lesson = await db.orm.public.Lesson.first({
    id: lessonId,
  })

  if (!lesson) {
    return null
  }

  const section = await db.orm.public.CourseSection.first({
    id: lesson.sectionId,
  })

  if (!section) {
    return null
  }

  const course = await db.orm.public.Course.first({
    id: section.courseId,
  })

  if (!course || (!isAdmin && course.status !== 'PUBLISHED')) {
    return null
  }

  if (!isAdmin) {
    const enrollment = await db.orm.public.Enrollment.first({
      userId,
      courseId: course.id,
    })

    if (!enrollment || enrollment.status !== 'ACTIVE') {
      return null
    }
  }

  return lesson
}

export async function updateLesson(
  lessonId: number,
  input: UpdateLessonInput,
) {
  const existingLesson = await db.orm.public.Lesson.first({
    id: lessonId,
  })

  if (!existingLesson) {
    return null
  }

  const updatedLesson = await db.orm.public.Lesson
    .where({ id: lessonId })
    .update({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.videoUrl !== undefined && {
        videoUrl: input.videoUrl,
      }),
      updatedAt: Temporal.Now.instant(),
    })

  return updatedLesson
}

export async function updateLessonPosition(
  lessonId: number,
  position: number,
) {
  const existingLesson = await db.orm.public.Lesson.first({
    id: lessonId,
  })

  if (!existingLesson) {
    return null
  }

  const updatedLesson = await db.orm.public.Lesson
    .where({ id: lessonId })
    .update({
      position,
      updatedAt: Temporal.Now.instant(),
    })

  return updatedLesson
}