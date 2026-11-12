import type { Response, NextFunction } from 'express'
import {
  type AuthenticatedRequest,
} from './authenticate.js'
import { verifyToken } from '../utils/jwt.js'
import { db } from '../prisma/db.js'

export async function optionalAuthenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization

  // No token: continue as a public request.
  if (!authHeader) {
    return next()
  }

  // A supplied token must be valid.
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Invalid authentication token',
    })
  }

  const token = authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      message: 'Invalid authentication token',
    })
  }

  try {
    const payload = verifyToken(token)

    const user = await db.orm.public.User.first({
      id: payload.userId,
    })

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: 'Account not found or inactive',
      })
    }

    req.user = {
      userId: user.id,
      role: user.role,
    }

    return next()
  } catch {
    return res.status(401).json({
      message: 'Invalid or expired token',
    })
  }
}