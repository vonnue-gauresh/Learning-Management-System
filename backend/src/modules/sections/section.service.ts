import { db } from '../../prisma/db.js'
import type {
  CreateSectionInput,
  UpdateSectionInput,
} from './section.validation.js'

export async function createSection(
  courseId: number,
  input: CreateSectionInput,
) {
  const course = await db.orm.public.Course.first({
    id: courseId,
  })

  if (!course) {
    throw new Error('Course not found')
  }

  const section = await db.orm.public.CourseSection.create({
    title: input.title,
    description: input.description ?? null,
    position: input.position,
    courseId,
  })

  return section
}

export async function getCourseSections(
  courseId: number,
  isAdmin: boolean,
) {
  const course = await db.orm.public.Course.first({
    id: courseId,
  })

  if (!course) {
    return null
  }

  if (!isAdmin && course.status !== 'PUBLISHED') {
    return null
  }

  const sections = await db.orm.public.CourseSection.all()

  return sections
    .filter((section) => section.courseId === courseId)
    .sort((a, b) => a.position - b.position)
}

export async function updateSection(
  sectionId: number,
  input: UpdateSectionInput,
) {
  const existingSection = await db.orm.public.CourseSection.first({
    id: sectionId,
  })

  if (!existingSection) {
    return null
  }

  const updatedSection = await db.orm.public.CourseSection
    .where({ id: sectionId })
    .update({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
    })

  return updatedSection
}

export async function updateSectionPosition(
  sectionId: number,
  position: number,
) {
  const existingSection = await db.orm.public.CourseSection.first({
    id: sectionId,
  })

  if (!existingSection) {
    return null
  }

  const updatedSection = await db.orm.public.CourseSection
    .where({ id: sectionId })
    .update({ position })

  return updatedSection
}