import type { Request, Response } from 'express'
import {
  createLessonSchema,
  updateLessonSchema,
  lessonIdSchema,
  sectionIdSchema,
  updateLessonPositionSchema,
} from './lesson.validation.js'
import {
  createLesson,
  getSectionLessons,
  getLessonById,
  updateLesson,
  updateLessonPosition,
} from './lesson.service.js'

export async function createLessonHandler(req: Request, res: Response) {
  const paramsValidation = sectionIdSchema.safeParse(req.params)

  if (!paramsValidation.success) {
    return res.status(400).json({ message: 'Invalid section ID' })
  }

  const bodyValidation = createLessonSchema.safeParse(req.body)

  if (!bodyValidation.success) {
    return res.status(400).json({
      message: 'Invalid lesson data',
      errors: bodyValidation.error.flatten().fieldErrors,
    })
  }

  try {
    const lesson = await createLesson(
      paramsValidation.data.sectionId,
      bodyValidation.data,
    )

    return res.status(201).json({
      message: 'Lesson created successfully',
      data: lesson,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Section not found') {
      return res.status(404).json({ message: error.message })
    }

    throw error
  }
}

export async function listSectionLessons(req: Request, res: Response) {
  const paramsValidation = sectionIdSchema.safeParse(req.params)

  if (!paramsValidation.success) {
    return res.status(400).json({ message: 'Invalid section ID' })
  }

  const lessons = await getSectionLessons(
    paramsValidation.data.sectionId,
  )

  if (!lessons) {
    return res.status(404).json({
      message: 'Section not found or course unavailable',
    })
  }

  return res.status(200).json({ data: lessons })
}

export async function getLesson(req: Request, res: Response) {
  const paramsValidation = lessonIdSchema.safeParse(req.params)

  if (!paramsValidation.success) {
    return res.status(400).json({ message: 'Invalid lesson ID' })
  }

  const userId = req.user!.userId
  const isAdmin = req.user!.role === 'ADMIN'

  const lesson = await getLessonById(
    paramsValidation.data.id,
    userId,
    isAdmin,
  )

  if (!lesson) {
    return res.status(404).json({
      message: 'Lesson not found or access denied',
    })
  }

  return res.status(200).json({ data: lesson })
}

export async function updateLessonHandler(req: Request, res: Response) {
  const paramsValidation = lessonIdSchema.safeParse(req.params)

  if (!paramsValidation.success) {
    return res.status(400).json({ message: 'Invalid lesson ID' })
  }

  const bodyValidation = updateLessonSchema.safeParse(req.body)

  if (!bodyValidation.success) {
    return res.status(400).json({
      message: 'Invalid lesson data',
      errors: bodyValidation.error.flatten().fieldErrors,
    })
  }

  const lesson = await updateLesson(
    paramsValidation.data.id,
    bodyValidation.data,
  )

  if (!lesson) {
    return res.status(404).json({ message: 'Lesson not found' })
  }

  return res.status(200).json({
    message: 'Lesson updated successfully',
    data: lesson,
  })
}

export async function updateLessonPositionHandler(
  req: Request,
  res: Response,
) {
  const paramsValidation = lessonIdSchema.safeParse(req.params)

  if (!paramsValidation.success) {
    return res.status(400).json({ message: 'Invalid lesson ID' })
  }

  const bodyValidation = updateLessonPositionSchema.safeParse(req.body)

  if (!bodyValidation.success) {
    return res.status(400).json({
      message: 'Invalid lesson position',
      errors: bodyValidation.error.flatten().fieldErrors,
    })
  }

  const lesson = await updateLessonPosition(
    paramsValidation.data.id,
    bodyValidation.data.position,
  )

  if (!lesson) {
    return res.status(404).json({ message: 'Lesson not found' })
  }

  return res.status(200).json({
    message: 'Lesson position updated successfully',
    data: lesson,
  })
}