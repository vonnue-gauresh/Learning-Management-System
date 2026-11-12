import { Router } from 'express'
import {
  createSectionHandler,
  listCourseSections,
  updateSectionHandler,
  updateSectionPositionHandler,
} from './section.controller.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authorizeRole } from '../../middleware/authorizeRole.js'

const router = Router()

// Public: view sections of published courses
router.get(
  '/courses/:courseId/sections',
  listCourseSections,
)

// Admin: manage sections
router.post(
  '/courses/:courseId/sections',
  authenticate,
  authorizeRole('ADMIN'),
  createSectionHandler,
)

router.patch(
  '/sections/:id',
  authenticate,
  authorizeRole('ADMIN'),
  updateSectionHandler,
)

router.patch(
  '/sections/:id/position',
  authenticate,
  authorizeRole('ADMIN'),
  updateSectionPositionHandler,
)

export default router