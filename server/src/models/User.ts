import mongoose, { Document, Schema } from 'mongoose';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  STATION_ADMIN = 'STATION_ADMIN',
  POLICE_OFFICER = 'POLICE_OFFICER',
  FEMALE_USER = 'FEMALE_USER',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  idVerificationStatus: VerificationStatus;
  idProofUrl?: string;
  isActive: boolean;
  stationId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    role: { type: String, enum: Object.values(UserRole), required: true },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    idVerificationStatus: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PENDING,
    },
    idProofUrl: { type: String },
    isActive: { type: Boolean, default: true },
    stationId: { type: Schema.Types.ObjectId, ref: 'PoliceStation' },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);