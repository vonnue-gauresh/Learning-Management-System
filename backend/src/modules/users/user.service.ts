import { db } from '../../prisma/db.js';
import { hashPassword } from '../../utils/password.js';
import type { CreateUserInput, UpdateUserInput } from './user.validation.js';

export async function createLearner(input: CreateUserInput) {
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
    isActive: user.isActive,
  };
}

export async function getUsers(page: number, limit: number) {
  const offset = (page - 1) * limit;
  const users = await db.orm.public.User.all();
  const total = users.length;
  const paginatedUsers = users.slice(offset, offset + limit);

  return {
    users: paginatedUsers.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    })),

    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getUserById(userId: number) {
    const user = await db.orm.public.User.first({
        id: userId,
    })

    if(!user) {
        return null
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
    }
}

export async function updateUser(userId: number, input: UpdateUserInput) {
    const existingUser = await db.orm.public.User.first({
        id: userId,
    })

    if (!existingUser) {
        return null
    }

    if (input.email && input.email !== existingUser.email) {
        const emailExists = await db.orm.public.User.first({
            email: input.email,
        })

        if (emailExists) {
            throw new Error("Email is already registered")
        }
    }

    const updatedUser = await db.orm.public.User
        .where({ id: userId })
        .update({
            ...(input.name !== undefined && { name: input.name }),
            ...(input.email !== undefined && { email: input.email })
        })

    if (!updatedUser) {
        return null
    }

    return {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive
    }
}

export async function updateUserStatus(userId: number, isActive: boolean) {
    const updatedUser = await db.orm.public.User
        .where({ id: userId })
        .update({ isActive })

    if (!updatedUser) {
        return null
    }

    return {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive
    }
}