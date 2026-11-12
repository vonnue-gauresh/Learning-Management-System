import { date } from 'zod'
import { db } from '../../prisma/db.js'
import type {
  CreateCourseInput,
  UpdateCourseInput,
} from './course.validation.js'
import { Temporal } from 'temporal-polyfill'

export async function createCourse(input: CreateCourseInput) {
  const category = await db.orm.public.Category.first({
    id: input.categoryId,
  })

  if (!category) {
    throw new Error('Category not found')
  }

  const course = await db.orm.public.Course.create({
    title: input.title,
    description: input.description,
    thumbnail: input.thumbnail ?? null,
    status: 'DRAFT',
    categoryId: input.categoryId,
    updatedAt: Temporal.Now.instant()
  })

  return course
}

export async function getCourses(isAdmin: boolean) {
  const courses = await db.orm.public.Course.all()

  const filteredCourses = isAdmin
    ? courses
    : courses.filter((course) => course.status === 'PUBLISHED')

  return filteredCourses
}

export async function getCourseById(courseId: number, isAdmin: boolean) {
  const course = await db.orm.public.Course.first({
    id: courseId,
  })

  if (!course) {
    return null
  }

  if (!isAdmin && course.status !== 'PUBLISHED') {
    return null
  }

  return course
}

export async function updateCourse(
  courseId: number,
  input: UpdateCourseInput,
) {
  const existingCourse = await db.orm.public.Course.first({
    id: courseId,
  })

  if (!existingCourse) {
    return null
  }

  if (input.categoryId !== undefined) {
    const category = await db.orm.public.Category.first({
      id: input.categoryId,
    })

    if (!category) {
      throw new Error('Category not found')
    }
  }

  const updatedCourse = await db.orm.public.Course
    .where({ id: courseId })
    .update({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.thumbnail !== undefined && {
        thumbnail: input.thumbnail,
      }),
      ...(input.categoryId !== undefined && {
        categoryId: input.categoryId,
      }),
      updatedAt: Temporal.Now.instant()
    })

  return updatedCourse
}

export async function updateCourseStatus(
  courseId: number,
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
) {
  const existingCourse = await db.orm.public.Course.first({
    id: courseId,
  })

  if (!existingCourse) {
    return null
  }

  const updatedCourse = await db.orm.public.Course
    .where({ id: courseId })
    .update({
      status,
      updatedAt: Temporal.Now.instant()
    })

  return updatedCourse
}