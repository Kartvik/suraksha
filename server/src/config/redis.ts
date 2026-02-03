import { Redis } from 'ioredis';

let redis: Redis | null = null;
let pubClient: Redis | null = null;
let subClient: Redis | null = null;

const createRedisClient = (): Redis => {
  const client = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
    retryStrategy: () => null,
    lazyConnect: true,
  });

  client.on('error', (err) =>
    console.warn('Redis error (non-fatal):', err.message)
  );

  return client;
};

export const connectRedis = async (): Promise<void> => {
  try {
    redis = createRedisClient();
    pubClient = createRedisClient();
    subClient = createRedisClient();

    await redis.connect();
    await pubClient.connect();
    await subClient.connect();

    console.log('Redis connected');
  } catch {
    console.warn('Redis not available, continuing without it');
    redis = null;
    pubClient = null;
    subClient = null;
  }
};

export const getRedis = (): Redis | null => redis;
export const getPubClient = (): Redis | null => pubClient;
export const getSubClient = (): Redis | null => subClient;

export const getRedisOptions = () => ({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
  retryStrategy: () => null,
});