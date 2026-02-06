import mongoose, { Document, Schema } from 'mongoose';

export enum OfficerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  RETIRED = 'RETIRED',
  SUSPENDED = 'SUSPENDED',
}

export interface IOfficer extends Document {
  userId: mongoose.Types.ObjectId;
  stationId: mongoose.Types.ObjectId;
  badgeNumber: string;
  rank: string;
  status: OfficerStatus;
  isVerified: boolean;
  isOnDuty: boolean;
  isOnline: boolean;
  verificationOtp?: string;
  verificationOtpExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OfficerSchema = new Schema<IOfficer>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stationId: { type: Schema.Types.ObjectId, ref: 'PoliceStation', required: true },
    badgeNumber: { type: String, required: true, unique: true },
    rank: { type: String, required: true, default: 'Constable' },
    status: {
      type: String,
      enum: Object.values(OfficerStatus),
      default: OfficerStatus.ACTIVE,
    },
    isVerified: { type: Boolean, default: false },
    isOnDuty: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    verificationOtp: { type: String },
    verificationOtpExpiry: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IOfficer>('Officer', OfficerSchema);