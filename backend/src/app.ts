import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import authRoutes from './modules/auth/auth.routes.js'
import userRoutes from './modules/users/user.routes.js'
import categoryRoutes from './modules/categories/category.routes.js'
import courseRoutes from './modules/courses/course.routes.js'
import sectionRoutes from './modules/sections/section.routes.js'
import lessonRoutes from './modules/lessons/lesson.routes.js'
import { errorHandler } from './middleware/errorHandler.js'

export const app = express()

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    message: 'Too many requests. Please try again later.',
  },
})

app.use(helmet())

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
)

app.use(express.json({ limit: '10kb' }))
app.use('/api', apiLimiter)

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'LearnHub API is running',
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/courses/', courseRoutes)
app.use('/api', sectionRoutes)
app.use('/api', lessonRoutes)

app.use(errorHandler)
