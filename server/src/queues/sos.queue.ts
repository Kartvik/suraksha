import { Queue } from 'bullmq';
import { getRedis } from '../config/redis.js';

let sosQueue: Queue;

export const getSOSQueue = (): Queue => {
  if (!sosQueue) {
    sosQueue = new Queue('sosQueue', {
      connection: getRedis()!,
    });
  }
  return sosQueue;
};

export const addSOSJob = async (data: {
  sosId: string;
  userId: string;
  userName: string;
  latitude: number;
  longitude: number;
  nearbyStationIds: string[];
}) => {
  const queue = getSOSQueue();
  await queue.add('process-sos', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });
};