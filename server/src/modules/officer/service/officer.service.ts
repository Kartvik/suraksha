import crypto from 'crypto';
import {
  User, UserRole, Officer, OfficerStatus,
  VerificationToken, TokenType, PoliceStation
} from '../../../models/index.js';
import { hashPassword } from '../../../utils/password.js';
import { sendVerificationEmail } from '../../../utils/email.js';
import { addWhatsAppOTPJob } from '../../../queues/whatsapp.queue.js';

export class OfficerService {

  // STATION_ADMIN creates officer
  async createOfficer(data: {
    name: string;
    email: string;
    phone: string;
    badgeNumber: string;
    rank: string;
    stationId: string;
  }) {
    const station = await PoliceStation.findById(data.stationId);
    if (!station) throw new Error('Station not found');
    if (!station.isActive) throw new Error('Station is inactive');

    const existingUser = await User.findOne({
      $or: [{ email: data.email }, { phone: data.phone }],
    });
    if (existingUser) throw new Error('Email or phone already registered');

    const existingBadge = await Officer.findOne({ badgeNumber: data.badgeNumber });
    if (existingBadge) throw new Error('Badge number already in use');

    const tempPassword = await hashPassword('TempPass@123');

    const user = await User.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: tempPassword,
      role: UserRole.POLICE_OFFICER,
      stationId: data.stationId,
      isEmailVerified: false,
      isPhoneVerified: false,
      isActive: true,
    });

    const officer = await Officer.create({
      userId: user._id,
      stationId: data.stationId,
      badgeNumber: data.badgeNumber,
      rank: data.rank || 'Constable',
      status: OfficerStatus.ACTIVE,
      isVerified: false,
      isOnDuty: false,
      isOnline: false,
    });

    // Step 1 — send email verification
    const emailToken = crypto.randomBytes(32).toString('hex');
    await VerificationToken.create({
      userId: user._id,
      token: emailToken,
      type: TokenType.EMAIL_VERIFY,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    await sendVerificationEmail(user.email, user.name, emailToken);

    // Step 2 — queue WhatsApp OTP job via BullMQ
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await Officer.findByIdAndUpdate(officer._id, {
      verificationOtp: otp,
      verificationOtpExpiry: otpExpiry,
    });

    await addWhatsAppOTPJob({
      officerId: officer._id.toString(),
      phone: data.phone,
      name: data.name,
      otp,
    });

    return {
      message: 'Officer created. Email and WhatsApp OTP sent.',
      officer: {
        id: officer._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        badgeNumber: officer.badgeNumber,
        rank: officer.rank,
        stationId: officer.stationId,
      },
    };
  }

  // Officer submits WhatsApp OTP to verify phone
  async verifyOfficerOTP(officerId: string, otp: string) {
    const officer = await Officer.findById(officerId);
    if (!officer) throw new Error('Officer not found');

    if (!officer.verificationOtp || !officer.verificationOtpExpiry) {
      throw new Error('No OTP found. Request a new one.');
    }

    if (new Date() > officer.verificationOtpExpiry) {
      throw new Error('OTP expired. Request a new one.');
    }

    if (officer.verificationOtp !== otp) {
      throw new Error('Invalid OTP');
    }

    await Officer.findByIdAndUpdate(officerId, {
      isVerified: true,
      verificationOtp: undefined,
      verificationOtpExpiry: undefined,
    });

    await User.findByIdAndUpdate(officer.userId, {
      isPhoneVerified: true,
    });

    return { message: 'Phone verified. Officer is now fully active.' };
  }

  // Resend WhatsApp OTP
  async resendOTP(officerId: string) {
    const officer = await Officer.findById(officerId).populate('userId');
    if (!officer) throw new Error('Officer not found');

    const user = await User.findById(officer.userId);
    if (!user) throw new Error('User not found');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await Officer.findByIdAndUpdate(officerId, {
      verificationOtp: otp,
      verificationOtpExpiry: otpExpiry,
    });

    await addWhatsAppOTPJob({
      officerId: officer._id.toString(),
      phone: user.phone,
      name: user.name,
      otp,
    });

    return { message: 'OTP resent on WhatsApp' };
  }

  async getOfficersByStation(stationId: string) {
    return await Officer.find({ stationId })
      .populate('userId', 'name email phone isEmailVerified isPhoneVerified isActive')
      .sort({ createdAt: -1 });
  }

  async getOfficerById(officerId: string) {
    const officer = await Officer.findById(officerId)
      .populate('userId', 'name email phone isEmailVerified isPhoneVerified')
      .populate('stationId', 'name city');
    if (!officer) throw new Error('Officer not found');
    return officer;
  }

  async updateOfficer(officerId: string, data: Partial<{
    name: string;
    phone: string;
    rank: string;
    badgeNumber: string;
  }>) {
    const officer = await Officer.findById(officerId);
    if (!officer) throw new Error('Officer not found');

    if (data.name || data.phone) {
      await User.findByIdAndUpdate(officer.userId, {
        ...(data.name && { name: data.name }),
        ...(data.phone && { phone: data.phone }),
      });
    }

    if (data.rank) officer.rank = data.rank;
    if (data.badgeNumber) {
      const existing = await Officer.findOne({ badgeNumber: data.badgeNumber });
      if (existing && existing._id.toString() !== officerId) {
        throw new Error('Badge number already in use');
      }
      officer.badgeNumber = data.badgeNumber;
    }

    await officer.save();
    return { message: 'Officer updated', officer };
  }

  async toggleDutyStatus(officerId: string) {
    const officer = await Officer.findById(officerId);
    if (!officer) throw new Error('Officer not found');
    if (officer.status === OfficerStatus.RETIRED) {
      throw new Error('Retired officer cannot be put on duty');
    }
    if (!officer.isVerified) {
      throw new Error('Officer must complete verification first');
    }

    officer.isOnDuty = !officer.isOnDuty;
    await officer.save();

    return {
      message: `Officer is now ${officer.isOnDuty ? 'ON DUTY' : 'OFF DUTY'}`,
      isOnDuty: officer.isOnDuty,
    };
  }

  async retireOfficer(officerId: string) {
    const officer = await Officer.findById(officerId);
    if (!officer) throw new Error('Officer not found');

    officer.status = OfficerStatus.RETIRED;
    officer.isOnDuty = false;
    officer.isOnline = false;
    await officer.save();

    await User.findByIdAndUpdate(officer.userId, { isActive: false });

    return { message: 'Officer retired. Record preserved.' };
  }

  async deleteOfficer(officerId: string) {
    const officer = await Officer.findById(officerId);
    if (!officer) throw new Error('Officer not found');

    await User.findByIdAndDelete(officer.userId);
    await Officer.findByIdAndDelete(officerId);

    return { message: 'Officer permanently deleted' };
  }

  async transferOfficer(officerId: string, newStationId: string) {
    const station = await PoliceStation.findById(newStationId);
    if (!station) throw new Error('Target station not found');
    if (!station.isActive) throw new Error('Target station is inactive');

    const officer = await Officer.findByIdAndUpdate(
      officerId,
      { stationId: newStationId },
      { new: true }
    );
    if (!officer) throw new Error('Officer not found');

    await User.findByIdAndUpdate(officer.userId, { stationId: newStationId });

    return { message: `Officer transferred to ${station.name}` };
  }
}