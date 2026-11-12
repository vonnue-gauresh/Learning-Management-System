import { Router } from 'express'
import {
  createLessonHandler,
  listSectionLessons,
  getLesson,
  updateLessonHandler,
  updateLessonPositionHandler,
} from './lesson.controller.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authorizeRole } from '../../middleware/authorizeRole.js'

const router = Router()

// Public: view lesson metadata for published courses
router.get(
  '/sections/:sectionId/lessons',
  listSectionLessons,
)

// Protected: actual lesson content
router.get(
  '/lessons/:id',
  authenticate,
  authorizeRole('ADMIN', 'LEARNER'),
  getLesson,
)

// Admin: manage lessons
router.post(
  '/sections/:sectionId/lessons',
  authenticate,
  authorizeRole('ADMIN'),
  createLessonHandler,
)

router.patch(
  '/lessons/:id',
  authenticate,
  authorizeRole('ADMIN'),
  updateLessonHandler,
)

router.patch(
  '/lessons/:id/position',
  authenticate,
  authorizeRole('ADMIN'),
  updateLessonPositionHandler,
)

export default router