import { db } from '../../prisma/db.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import type { RegisterInput, LoginInput } from './auth.validation.js';

export async function registerUser(input: RegisterInput) {
  const existingUser = await db.orm.public.User.first({
    email: input.email,
  });

  if (existingUser) {
    throw new Error('Email is already registered');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await db.orm.public.User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: 'LEARNER',
    isActive: true,
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function loginUser(input: LoginInput) {
  const user = await db.orm.public.User.first({
    email: input.email,
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    throw new Error('Account is inactive');
  }

  const isPasswordValid = await verifyPassword(user.passwordHash, input.password);

  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function getUserById(userId: number) {
  const user = await db.orm.public.User.first({
    id: userId,
  });

  if (!user || !user.isActive) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
