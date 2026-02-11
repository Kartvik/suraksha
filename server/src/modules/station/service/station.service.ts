import crypto from 'crypto';
import { PoliceStation, User, UserRole, VerificationToken, TokenType } from '../../../models/index.js';
import { hashPassword } from '../../../utils/password.js';
import { sendVerificationEmail } from '../../../utils/email.js';

export class StationService {

  // SUPER_ADMIN: create a new police station
  async createStation(data: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    email: string;
    latitude: number;
    longitude: number;
  }) {
    const existing = await PoliceStation.findOne({ email: data.email });
    if (existing) throw new Error('Station with this email already exists');

    const station = await PoliceStation.create({
      ...data,
      location: {
        type: 'Point',
        coordinates: [data.longitude, data.latitude],
      },
    });

    return { message: 'Station created successfully', station };
  }

  // SUPER_ADMIN: create station admin and link to station
  async createStationAdmin(data: {
    name: string;
    email: string;
    phone: string;
    stationId: string;
  }) {
    const station = await PoliceStation.findById(data.stationId);
    if (!station) throw new Error('Station not found');
    if (!station.isActive) throw new Error('Station is inactive');

    if (station.stationAdminId) {
      throw new Error('This station already has an admin. Remove existing admin first.');
    }

    const existing = await User.findOne({
      $or: [{ email: data.email }, { phone: data.phone }],
    });
    if (existing) throw new Error('Email or phone already registered');

    const tempPassword = await hashPassword('TempPass@123');

    const admin = await User.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: tempPassword,
      role: UserRole.STATION_ADMIN,
      stationId: data.stationId,
      isEmailVerified: false,
      isActive: true,
    });

    await PoliceStation.findByIdAndUpdate(data.stationId, {
      stationAdminId: admin._id,
    });

    const token = crypto.randomBytes(32).toString('hex');
    await VerificationToken.create({
      userId: admin._id,
      token,
      type: TokenType.EMAIL_VERIFY,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await sendVerificationEmail(admin.email, admin.name, token);

    return {
      message: 'Station admin created. Verification email sent.',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        stationId: data.stationId,
        tempPassword: 'TempPass@123',
      },
    };
  }

  async getAllStations() {
    return await PoliceStation.find()
      .populate('stationAdminId', 'name email phone')
      .sort({ createdAt: -1 });
  }

  async getStationById(id: string) {
    const station = await PoliceStation.findById(id)
      .populate('stationAdminId', 'name email phone');
    if (!station) throw new Error('Station not found');
    return station;
  }

  async updateStation(id: string, data: Partial<{
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    latitude: number;
    longitude: number;
  }>) {
    const station = await PoliceStation.findById(id);
    if (!station) throw new Error('Station not found');

    const updateData: any = { ...data };
    if (data.latitude && data.longitude) {
      updateData.location = {
        type: 'Point',
        coordinates: [data.longitude, data.latitude],
      };
    }

    const updated = await PoliceStation.findByIdAndUpdate(id, updateData, { new: true });
    return { message: 'Station updated', station: updated };
  }

  async toggleStationStatus(id: string) {
    const station = await PoliceStation.findById(id);
    if (!station) throw new Error('Station not found');

    station.isActive = !station.isActive;
    await station.save();

    return {
      message: `Station ${station.isActive ? 'activated' : 'deactivated'}`,
      isActive: station.isActive,
    };
  }

  async removeStationAdmin(stationId: string) {
    const station = await PoliceStation.findById(stationId);
    if (!station) throw new Error('Station not found');
    if (!station.stationAdminId) throw new Error('No admin assigned to this station');

    await User.findByIdAndUpdate(station.stationAdminId, { isActive: false });
    await PoliceStation.findByIdAndUpdate(stationId, { stationAdminId: null });

    return { message: 'Station admin removed' };
  }
}