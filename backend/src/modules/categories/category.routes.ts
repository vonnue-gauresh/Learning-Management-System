import { Router } from 'express'
import {
  createCategoryHandler,
  listCategories,
  updateCategoryHandler,
} from './category.controller.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authorizeRole } from '../../middleware/authorizeRole.js'

const router = Router()

// Public route
router.get('/', listCategories)

// Admin-only routes
router.post(
  '/',
  authenticate,
  authorizeRole('ADMIN'),
  createCategoryHandler,
)

router.patch(
  '/:id',
  authenticate,
  authorizeRole('ADMIN'),
  updateCategoryHandler,
)

export default router