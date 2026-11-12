import { Router } from 'express'
import {
  createCourseHandler,
  listCourses,
  getCourse,
  updateCourseHandler,
  updateCourseStatusHandler,
} from './course.controller.js'
import { authenticate } from '../../middleware/authenticate.js'
import { optionalAuthenticate } from '../../middleware/optionalAuthenticate.js'
import { authorizeRole } from '../../middleware/authorizeRole.js'

const router = Router()

// Public routes
router.get('/', optionalAuthenticate, listCourses)
router.get('/:id', optionalAuthenticate, getCourse)

// Admin-only routes
router.post(
  '/',
  authenticate,
  authorizeRole('ADMIN'),
  createCourseHandler,
)

router.patch(
  '/:id',
  authenticate,
  authorizeRole('ADMIN'),
  updateCourseHandler,
)

router.patch(
  '/:id/status',
  authenticate,
  authorizeRole('ADMIN'),
  updateCourseStatusHandler,
)

export default router