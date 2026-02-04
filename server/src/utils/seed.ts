import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User, UserRole } from '../models/index.js';
import { hashPassword } from './password.js';

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);

  const existing = await User.findOne({ role: UserRole.SUPER_ADMIN });
  if (existing) {
    console.log('Super admin already exists:', existing.email);
    process.exit(0);
  }

  const password = await hashPassword('SuperAdmin@123');

  await User.create({
    name: 'Super Admin',
    email: 'superadmin@womensafety.com',
    password,
    phone: '9000000000',
    role: UserRole.SUPER_ADMIN,
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
  });

  console.log('✓ Super admin created');
  console.log('  Email:    superadmin@womensafety.com');
  console.log('  Password: SuperAdmin@123');
  process.exit(0);
};

seed().catch(console.error);