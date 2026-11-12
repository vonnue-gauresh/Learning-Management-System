import type { Request, Response } from 'express'
import {
  createCourseSchema,
  updateCourseSchema,
  courseIdSchema,
  updateCourseStatusSchema,
} from './course.validation.js'
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  updateCourseStatus,
} from './course.service.js'
import { flattenError } from 'zod/v4/core'

export async function createCourseHandler(req: Request, res: Response) {
  const validation = createCourseSchema.safeParse(req.body)

  if (!validation.success) {
    return res.status(400).json({
      message: 'Invalid course data',
      errors: validation.error.flatten().fieldErrors,
    })
  }

  try {
    const course = await createCourse(validation.data)

    return res.status(201).json({
      message: 'Course created successfully',
      data: course,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Category not found') {
      return res.status(404).json({ message: error.message })
    }

    throw error
  }
}

export async function listCourses(req: Request, res: Response) {
  const isAdmin = req.user?.role === 'ADMIN'
  const courses = await getCourses(isAdmin)

  return res.status(200).json({
    data: courses,
  })
}

export async function getCourse(req: Request, res: Response) {
  const validation = courseIdSchema.safeParse(req.params)

  if (!validation.success) {
    return res.status(400).json({ message: 'Invalid course ID' })
  }

  const isAdmin = req.user?.role === 'ADMIN'
  const course = await getCourseById(validation.data.id, isAdmin)

  if (!course) {
    return res.status(404).json({ message: 'Course not found' })
  }

  return res.status(200).json({ data: course })
}

export async function updateCourseHandler(req: Request, res: Response) {
  const paramsValidation = courseIdSchema.safeParse(req.params)

  if (!paramsValidation.success) {
    return res.status(400).json({ message: 'Invalid course ID' })
  }

  const bodyValidation = updateCourseSchema.safeParse(req.body)

  if (!bodyValidation.success) {
    return res.status(400).json({
      message: 'Invalid course data',
      errors: flattenError(bodyValidation.error).fieldErrors,
    })
  }

  try {
    const course = await updateCourse(
      paramsValidation.data.id,
      bodyValidation.data,
    )

    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }

    return res.status(200).json({
      message: 'Course updated successfully',
      data: course,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Category not found') {
      return res.status(404).json({ message: error.message })
    }

    throw error
  }
}

export async function updateCourseStatusHandler(req: Request, res: Response) {
  const paramsValidation = courseIdSchema.safeParse(req.params)

  if (!paramsValidation.success) {
    return res.status(400).json({ message: 'Invalid course ID' })
  }

  const bodyValidation = updateCourseStatusSchema.safeParse(req.body)

  if (!bodyValidation.success) {
    return res.status(400).json({
      message: 'Invalid course status',
      errors: flattenError(bodyValidation.error).fieldErrors,
    })
  }

  const course = await updateCourseStatus(
    paramsValidation.data.id,
    bodyValidation.data.status,
  )

  if (!course) {
    return res.status(404).json({ message: 'Course not found' })
  }

  return res.status(200).json({
    message: 'Course status updated successfully',
    data: course,
  })
}