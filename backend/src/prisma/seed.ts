import 'dotenv/config';
import argon2 from 'argon2';
import { db } from './db.js';

async function seedAdmin() {
  try {
    const name = process.env['ADMIN_NAME'];
    const email = process.env['ADMIN_EMAIL'];
    const password = process.env['ADMIN_PASSWORD'];

    if (!name || !email || !password) {
      throw new Error('Missing admin credentials in .env');
    }

    // Check whether the admin already exists
    const existingAdmin = await db.orm.public.User.first({ email });

    if (existingAdmin) {
      console.log('Admin account already exists.');
      return;
    }

    // Hash the password
    const passwordHash = await argon2.hash(password);

    // Create admin account
    const admin = await db.orm.public.User.create({
      name,
      email,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    });

    console.log('Admin account created successfully!');
    console.log({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });
  } catch (error) {
    console.error('Admin seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
}

seedAdmin();
