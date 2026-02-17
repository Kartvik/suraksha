import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Server as HttpServer } from 'http';
import { getPubClient, getSubClient, getRedis } from '../config/redis.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../models/index.js';
import { Officer } from '../models/index.js';

let io: Server;

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Redis adapter for horizontal scaling
  const pub = getPubClient();
  const sub = getSubClient();

  if (pub && sub) {
    io.adapter(createAdapter(pub, sub));
    console.log('Socket.io Redis adapter enabled');
  } else {
    console.warn('Socket.io running without Redis adapter (single instance only)');
  }

  // JWT auth middleware for socket
  io.use(async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('No token provided'));
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId);

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      // Attach user info to socket
      (socket as any).user = {
        userId: decoded.userId,
        role: decoded.role,
        stationId: user.stationId?.toString(),
      };

      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const user = (socket as any).user;
    console.log(`Socket connected: ${user.userId} | role: ${user.role}`);

    // Officer joins their station room automatically
    if (user.role === 'POLICE_OFFICER' && user.stationId) {
      const room = `station:${user.stationId}`;
      socket.join(room);
      console.log(`Officer ${user.userId} joined room ${room}`);

      // Mark officer online + on duty in DB and Redis
      await setOfficerOnline(user.userId, user.stationId);

      // Notify station room that officer is online
      io.to(room).emit('officer_online', {
        userId: user.userId,
        stationId: user.stationId,
      });
    }

    // Female user joins their own room for SOS updates
    if (user.role === 'FEMALE_USER') {
      socket.join(`user:${user.userId}`);
    }

    // Officer manually toggles duty status
    socket.on('toggle_duty', async (data: { isOnDuty: boolean }) => {
      if (user.role !== 'POLICE_OFFICER') return;

      await Officer.findOneAndUpdate(
        { userId: user.userId },
        { isOnDuty: data.isOnDuty }
      );

      if (user.stationId) {
        io.to(`station:${user.stationId}`).emit('officer_duty_changed', {
          userId: user.userId,
          isOnDuty: data.isOnDuty,
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${user.userId}`);

      if (user.role === 'POLICE_OFFICER' && user.stationId) {
        await setOfficerOffline(user.userId, user.stationId);

        io.to(`station:${user.stationId}`).emit('officer_offline', {
          userId: user.userId,
          stationId: user.stationId,
        });
      }
    });
  });

  return io;
};

// Mark officer online in DB + Redis
const setOfficerOnline = async (userId: string, stationId: string) => {
  const officer = await Officer.findOneAndUpdate(
    { userId },
    { isOnline: true, isOnDuty: true },
    { new: true }
  );

  const redis = getRedis();
  if (redis && officer) {
    await redis.set(
      `officer:online:${officer._id}`,
      JSON.stringify({ userId, stationId }),
      'EX',
      86400 // 24h TTL
    );
  }
};

// Mark officer offline in DB + Redis
const setOfficerOffline = async (userId: string, stationId: string) => {
  const officer = await Officer.findOneAndUpdate(
    { userId },
    { isOnline: false, isOnDuty: false },
    { new: true }
  );

  const redis = getRedis();
  if (redis && officer) {
    await redis.del(`officer:online:${officer._id}`);
  }
};

export const getIO = (): Server => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};