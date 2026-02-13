import { Queue } from 'bullmq';
import { getRedis, getRedisOptions } from '../config/redis.js';

let whatsappQueue: Queue;

export const getWhatsappQueue = (): Queue => {
  if (!whatsappQueue) {
    const redis = getRedis();
    if (!redis) {
      throw new Error('Redis is not connected. Cannot create WhatsApp queue.');
    }

    whatsappQueue = new Queue('whatsappQueue', {
      connection: getRedisOptions(),
    });

    whatsappQueue.on('error', (err) =>
      console.error('WhatsApp queue error:', err?.message || err)
    );
  }
  return whatsappQueue;
};

export const addWhatsAppOTPJob = async (data: {
  officerId: string;
  phone: string;
  name: string;
  otp: string;
}) => {
  const queue = getWhatsappQueue();
  const job = await queue.add('send-otp', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });
  console.log(`Queued WhatsApp OTP job ${job.id} for officer ${data.officerId}`);
};

export const addWhatsAppSOSJob = async (data: {
  officerId: string;
  phone: string;
  name: string;
  sosId: string;
  location: { latitude: number; longitude: number };
  userName: string;
}) => {
  const queue = getWhatsappQueue();
  const job = await queue.add('send-sos', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });
  console.log(`Queued WhatsApp SOS job ${job.id} for officer ${data.officerId}`);
};