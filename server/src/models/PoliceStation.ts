import mongoose, { Document, Schema } from 'mongoose';

export interface IPoliceStation extends Document {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  stationAdminId?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PoliceStationSchema = new Schema<IPoliceStation>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
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
    stationAdminId: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// This is the key index for geo-queries — finds nearest stations
PoliceStationSchema.index({ location: '2dsphere' });

export default mongoose.model<IPoliceStation>('PoliceStation', PoliceStationSchema);