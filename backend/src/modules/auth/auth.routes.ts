import { Router } from 'express'
import { register, login, me } from './auth.controller.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authRateLimiter } from '../../middleware/authRateLimiter.js'

const router = Router()

router.post('/register', register)
router.post('/login', authRateLimiter, login)
router.get('/me', authenticate, me)

export default router