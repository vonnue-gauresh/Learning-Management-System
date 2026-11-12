import type { Request, Response } from 'express'
import {
  createSectionSchema,
  updateSectionSchema,
  sectionIdSchema,
  courseIdSchema,
  updateSectionPositionSchema,
} from './section.validation.js'
import {
  createSection,
  getCourseSections,
  updateSection,
  updateSectionPosition,
} from './section.service.js'

export async function createSectionHandler(req: Request, res: Response) {
  const paramsValidation = courseIdSchema.safeParse(req.params)

  if (!paramsValidation.success) {
    return res.status(400).json({ message: 'Invalid course ID' })
  }

  const bodyValidation = createSectionSchema.safeParse(req.body)

  if (!bodyValidation.success) {
    return res.status(400).json({
      message: 'Invalid section data',
      errors: bodyValidation.error.flatten().fieldErrors,
    })
  }

  try {
    const section = await createSection(
      paramsValidation.data.courseId,
      bodyValidation.data,
    )

    return res.status(201).json({
      message: 'Section created successfully',
      data: section,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Course not found') {
      return res.status(404).json({ message: error.message })
    }

    throw error
  }
}

export async function listCourseSections(req: Request, res: Response) {
  const paramsValidation = courseIdSchema.safeParse(req.params)

  if (!paramsValidation.success) {
    return res.status(400).json({ message: 'Invalid course ID' })
  }

  const isAdmin = req.user?.role === 'ADMIN'

  const sections = await getCourseSections(
    paramsValidation.data.courseId,
    isAdmin,
  )

  if (!sections) {
    return res.status(404).json({ message: 'Course not found' })
  }

  return res.status(200).json({ data: sections })
}

export async function updateSectionHandler(req: Request, res: Response) {
  const paramsValidation = sectionIdSchema.safeParse(req.params)

  if (!paramsValidation.success) {
    return res.status(400).json({ message: 'Invalid section ID' })
  }

  const bodyValidation = updateSectionSchema.safeParse(req.body)

  if (!bodyValidation.success) {
    return res.status(400).json({
      message: 'Invalid section data',
      errors: bodyValidation.error.flatten().fieldErrors,
    })
  }

  const section = await updateSection(
    paramsValidation.data.id,
    bodyValidation.data,
  )

  if (!section) {
    return res.status(404).json({ message: 'Section not found' })
  }

  return res.status(200).json({
    message: 'Section updated successfully',
    data: section,
  })
}

export async function updateSectionPositionHandler(
  req: Request,
  res: Response,
) {
  const paramsValidation = sectionIdSchema.safeParse(req.params)

  if (!paramsValidation.success) {
    return res.status(400).json({ message: 'Invalid section ID' })
  }

  const bodyValidation = updateSectionPositionSchema.safeParse(req.body)

  if (!bodyValidation.success) {
    return res.status(400).json({
      message: 'Invalid position',
      errors: bodyValidation.error.flatten().fieldErrors,
    })
  }

  const section = await updateSectionPosition(
    paramsValidation.data.id,
    bodyValidation.data.position,
  )

  if (!section) {
    return res.status(404).json({ message: 'Section not found' })
  }

  return res.status(200).json({
    message: 'Section position updated successfully',
    data: section,
  })
}