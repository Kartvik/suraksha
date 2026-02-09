import crypto from 'crypto';
import { User, UserRole, Officer, RefreshToken, VerificationToken, TokenType } from '../../../models/index.js';
import { hashPassword, comparePassword } from '../../../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../../utils/jwt.js';
import { sendVerificationEmail } from '../../../utils/email.js';

export class AuthService {

  async register(data: {
    name: string;
    email: string;
    password: string;
    phone: string;
  }) {
    const existingUser = await User.findOne({
      $or: [{ email: data.email }, { phone: data.phone }],
    });

    if (existingUser) {
      throw new Error('Email or phone already registered');
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await User.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      phone: data.phone,
      role: UserRole.FEMALE_USER,
    });

    // Generate email verification token
    const token = crypto.randomBytes(32).toString('hex');

    await VerificationToken.create({
      userId: user._id,
      token,
      type: TokenType.EMAIL_VERIFY,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    await sendVerificationEmail(user.email, user.name, token);

    return {
      message: 'Registration successful. Please verify your email.',
      userId: user._id,
    };
  }

  async verifyEmail(token: string) {
    const verificationToken = await VerificationToken.findOne({
      token,
      type: TokenType.EMAIL_VERIFY,
    });

    if (!verificationToken) {
      throw new Error('Invalid or expired verification token');
    }

    await User.findByIdAndUpdate(verificationToken.userId, {
      isEmailVerified: true,
    });

    await VerificationToken.deleteOne({ _id: verificationToken._id });

    return { message: 'Email verified successfully. You can now login.' };
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Your account has been deactivated');
    }

    if (!user.isEmailVerified) {
      throw new Error('Please verify your email before logging in');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    // Store refresh token in DB
    await RefreshToken.create({
      userId: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Auto set officer on duty on login
    if (user.role === UserRole.POLICE_OFFICER) {
      await Officer.findOneAndUpdate(
        { userId: user._id },
        { isOnDuty: true }
      );
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async refreshToken(token: string) {
    const decoded = verifyRefreshToken(token);

    const storedToken = await RefreshToken.findOne({ token });
    if (!storedToken) {
      throw new Error('Invalid refresh token');
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new Error('User not found');
    }

    // Delete old refresh token
    await RefreshToken.deleteOne({ token });

    // Issue new tokens
    const newAccessToken = generateAccessToken(user._id.toString(), user.role);
    const newRefreshToken = generateRefreshToken(user._id.toString());

    await RefreshToken.create({
      userId: user._id,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(token: string) {
    await RefreshToken.deleteOne({ token });
    return { message: 'Logged out successfully' };
  }
}