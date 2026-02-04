import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

export const sendVerificationEmail = async (
  to: string,
  name: string,
  token: string
): Promise<void> => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

  try {
    await getTransporter().sendMail({
      from: `"Women Safety Platform" <${process.env.EMAIL_FROM}>`,
      to,
      subject: 'Verify your email address',
      html: `
        <h2>Hello ${name},</h2>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verifyUrl}" style="
          background: #e53e3e;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          display: inline-block;
          margin: 16px 0;
        ">Verify Email</a>
        <p>This link expires in 24 hours.</p>
        <p>If you didn't register, ignore this email.</p>
      `,
    });
    console.log(`Verification email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send verification email to ${to}:`, error);
    if (process.env.NODE_ENV === 'development') {
      console.log('\n--------------------------------------------------');
      console.log(`[DEV MODE] Verification link for ${to} (${name}):`);
      console.log(verifyUrl);
      console.log('--------------------------------------------------\n');
    } else {
      throw error;
    }
  }
};

export const sendPasswordResetEmail = async (
  to: string,
  name: string,
  token: string
): Promise<void> => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

  try {
    await getTransporter().sendMail({
      from: `"Women Safety Platform" <${process.env.EMAIL_FROM}>`,
      to,
      subject: 'Reset your password',
      html: `
        <h2>Hello ${name},</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="
          background: #e53e3e;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          display: inline-block;
          margin: 16px 0;
        ">Reset Password</a>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, ignore this email.</p>
      `,
    });
    console.log(`Password reset email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send password reset email to ${to}:`, error);
    if (process.env.NODE_ENV === 'development') {
      console.log('\n--------------------------------------------------');
      console.log(`[DEV MODE] Password reset link for ${to} (${name}):`);
      console.log(resetUrl);
      console.log('--------------------------------------------------\n');
    } else {
      throw error;
    }
  }
};