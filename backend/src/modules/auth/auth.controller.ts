import type { Request, Response } from 'express';
import { registerUser, loginUser, getUserById } from './auth.service.js';
import { generateToken } from '../../utils/jwt.js';
import type { AuthenticatedRequest } from '../../middleware/authenticate.js';
import { registerSchema, loginSchema } from './auth.validation.js';

export async function register(req: Request, res: Response) {
  const validation = registerSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: validation.error.flatten().fieldErrors,
    });
  }

  try {
    const user = await registerUser(validation.data);

    return res.status(201).json({
      message: 'Registration successful',
      user,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Email is already registered') {
      return res.status(409).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Registration failed' });
  }
}

export async function login(req: Request, res: Response) {
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: validation.error.flatten().fieldErrors,
    });
  }

  try {
    const user = await loginUser(validation.data);
    const accessToken = generateToken({
      userId: user.id,
      role: user.role,
    });

    return res.status(200).json({
      message: 'Login successful',
      accessToken,
      user,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Invalid email or password') {
        return res.status(401).json({ message: error.message });
      }

      if (error.message === 'Account is inactive') {
        return res.status(403).json({ message: error.message });
      }
    }

    return res.status(500).json({ message: 'Login failed' });
  }
}

export async function me(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({
      message: 'Authentication required',
    });
  }

  const user = await getUserById(userId);

  if (!user) {
    return res.status(401).json({
      message: 'User not found or account inactive',
    });
  }

  return res.status(200).json({ user });
}
