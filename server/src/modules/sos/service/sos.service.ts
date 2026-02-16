import { v4 as uuidv4 } from 'uuid';
import { SOS, SOSStatus, PoliceStation, Officer, User } from '../../../models/index.js';
import { getIO } from '../../../socket/socket.js';
import { addSOSJob } from '../../../queues/sos.queue.js';
import { getRedis } from '../../../config/redis.js';
import { VerificationStatus } from '../../../models/index.js';

export class SOSService {

  async triggerSOS(userId: string, latitude: number, longitude: number) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
      if (user.idVerificationStatus !== VerificationStatus.VERIFIED) {
    throw new Error('Identity verification required before using SOS');
  }

    // Find 5 nearest stations using MongoDB geo-query
    const nearbyStations = await PoliceStation.find({
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: 10000, // 10km radius
        },
      },
    }).limit(5);

    if (nearbyStations.length === 0) {
      throw new Error('No police stations found nearby');
    }

    const nearbyStationIds = nearbyStations.map((s) => s._id.toString());

    // Create SOS record
    const sos = await SOS.create({
      sosId: `SOS-${uuidv4().substring(0, 8).toUpperCase()}`,
      userId,
      latitude,
      longitude,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      status: SOSStatus.PENDING,
      notifiedStations: nearbyStationIds,
    });

    // Cache active SOS in Redis
    const redis = getRedis();
    if (redis) {
      await redis.set(
        `sos:active:${sos._id}`,
        JSON.stringify({ sosId: sos.sosId, userId, latitude, longitude }),
        'EX',
        3600 // 1 hour TTL
      );
    }

    // Emit Socket.io event to all nearby station rooms instantly
    try {
      const io = getIO();
      const sosPayload = {
        id: sos._id.toString(),      // MongoDB ObjectId — use this for PATCH /:id/accept
        sosId: sos.sosId,            // Human-readable SOS-XXXXXXXX
        userId,
        userName: user.name,
        latitude,
        longitude,
        mapsLink: `https://maps.google.com/?q=${latitude},${longitude}`,
        timestamp: sos.createdAt,
      };

      for (const stationId of nearbyStationIds) {
        io.to(`station:${stationId}`).emit('new_sos', sosPayload);
      }

      // Also update the female user's room with SOS status
      io.to(`user:${userId}`).emit('sos_created', {
        id: sos._id.toString(),
        sosId: sos.sosId,
        status: SOSStatus.PENDING,
        notifiedStations: nearbyStations.map((s) => s.name),
      });
    } catch {
      console.warn('Socket.io not ready yet — skipping real-time emit');
    }

    // Queue BullMQ job for WhatsApp + Email notifications
    await addSOSJob({
      sosId: sos.sosId,
      userId,
      userName: user.name,
      latitude,
      longitude,
      nearbyStationIds,
    });

    return {
      message: 'SOS triggered. Help is on the way.',
      sosId: sos.sosId,
      notifiedStations: nearbyStations.map((s) => ({
        name: s.name,
        city: s.city,
      })),
    };
  }

  async acceptSOS(id: string, officerId: string) {
    // id is the MongoDB ObjectId passed from PATCH /:id/accept
    const sos = await SOS.findById(id);
    if (!sos) throw new Error('SOS not found');
    if (sos.status !== SOSStatus.PENDING) {
      throw new Error('SOS already accepted or resolved');
    }

    const officer = await Officer.findOne({ userId: officerId });
    if (!officer) throw new Error('Officer profile not found');
    if (!officer.isOnDuty) throw new Error('You must be on duty to accept an SOS');
    if (!officer.isVerified) throw new Error('Unverified officers cannot accept SOS alerts');

    sos.status = SOSStatus.ACCEPTED;
    sos.assignedOfficerId = officer._id as any;
    sos.acceptedAt = new Date();
    await sos.save();

    // Notify female user in real time
    try {
      const io = getIO();
      io.to(`user:${sos.userId}`).emit('sos_accepted', {
        sosId: sos.sosId,
        officerId: officer._id.toString(),
        status: SOSStatus.ACCEPTED,
      });
    } catch {}

    return { message: 'SOS accepted', sos };
  }

  async updateSOSStatus(id: string, status: SOSStatus) {
    // id is the MongoDB ObjectId from PATCH /:id/status
    const sos = await SOS.findByIdAndUpdate(
      id,
      {
        status,
        ...(status === SOSStatus.RESOLVED && { resolvedAt: new Date() }),
      },
      { new: true }
    );
    if (!sos) throw new Error('SOS not found');

    // Remove from Redis cache if resolved
    if (status === SOSStatus.RESOLVED || status === SOSStatus.CANCELLED) {
      const redis = getRedis();
      if (redis) await redis.del(`sos:active:${sos._id}`);
    }

    try {
      const io = getIO();
      io.to(`user:${sos.userId}`).emit('sos_status_updated', {
        sosId: sos.sosId,
        status,
      });
    } catch {}

    return { message: 'SOS status updated', sos };
  }

  async getSOSHistory(userId: string) {
    return await SOS.find({ userId })
      .populate('assignedOfficerId')
      .sort({ createdAt: -1 });
  }

  async getActiveSOSForStation(stationId: string) {
    return await SOS.find({
      notifiedStations: stationId,
      status: { $in: [SOSStatus.PENDING, SOSStatus.ACCEPTED, SOSStatus.IN_PROGRESS] },
    })
      .populate('userId', 'name phone')
      .sort({ createdAt: -1 });
  }
}