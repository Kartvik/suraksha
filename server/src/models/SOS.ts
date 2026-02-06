import mongoose, { Document, Schema } from 'mongoose';

export enum SOSStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CANCELLED = 'CANCELLED',
}

export interface ISOS extends Document {
  sosId: string;
  userId: mongoose.Types.ObjectId;
  latitude: number;
  longitude: number;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  status: SOSStatus;
  assignedOfficerId?: mongoose.Types.ObjectId;
  notifiedStations: mongoose.Types.ObjectId[];
  notifiedOfficers: mongoose.Types.ObjectId[];
  acceptedAt?: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SOSSchema = new Schema<ISOS>(
  {
    sosId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    status: {
      type: String,
      enum: Object.values(SOSStatus),
      default: SOSStatus.PENDING,
    },
    assignedOfficerId: { type: Schema.Types.ObjectId, ref: 'Officer' },
    notifiedStations: [{ type: Schema.Types.ObjectId, ref: 'PoliceStation' }],
    notifiedOfficers: [{ type: Schema.Types.ObjectId, ref: 'Officer' }],
    acceptedAt: { type: Date },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

SOSSchema.index({ location: '2dsphere' });
SOSSchema.index({ userId: 1 });
SOSSchema.index({ status: 1 });

export default mongoose.model<ISOS>('SOS', SOSSchema);