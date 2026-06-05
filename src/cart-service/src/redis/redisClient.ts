import { createClient, RedisClientType } from 'redis';
import { RedisConfig } from './types';

class RedisConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RedisConnectionError';
  }
}

class RedisClient {
  private client: RedisClientType | null = null;
  private config: RedisConfig;

  constructor(config: RedisConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      const clientOptions: RedisClientOptions = {
        url: `redis://${this.config.host}:${this.config.port}`,
        password: this.config.password,
        socket: {
          reconnectStrategy: (retries: number) => {
            if (retries > 10) {
              return null; // Stop reconnecting after 10 attempts
            }
            return Math.min(retries * 100, 3000);
          }
        }
      };

      this.client = createClient(clientOptions);

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        console.log('Connected to Redis');
      });

      this.client.on('reconnecting', () => {
        console.log('Reconnecting to Redis...');
      });

      await this.client.connect();

      // Check if JSON module is available
      try {
        await this.client.debug();
      } catch (err) {
        console.warn('Redis JSON module may not be available');
      }
    } catch (err) {
      throw new RedisConnectionError(`Failed to connect to Redis: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) {
      throw new RedisConnectionError('Redis client not connected');
    }
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) {
      throw new RedisConnectionError('Redis client not connected');
    }
    if (ttlSeconds) {
      await this.client.set(key, value, { EX: ttlSeconds });
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<number> {
    if (!this.client) {
      throw new RedisConnectionError('Redis client not connected');
    }
    return await this.client.del(key);
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.client) {
      throw new RedisConnectionError('Redis client not connected');
    }
    return await this.client.expire(key, seconds);
  }

  async jsonGet(key: string): Promise<unknown> {
    if (!this.client) {
      throw new RedisConnectionError('Redis client not connected');
    }
    return await this.client.json.get(key);
  }

  async jsonSet(key: string, path: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!this.client) {
      throw new RedisConnectionError('Redis client not connected');
    }
    await this.client.json.set(key, path, value);
    if (ttlSeconds) {
      await this.client.expire(key, ttlSeconds);
    }
  }

  async jsonDel(key: string): Promise<number> {
    if (!this.client) {
      throw new RedisConnectionError('Redis client not connected');
    }
    return await this.client.json.del(key);
  }

  getClient(): RedisClientType | null {
    return this.client;
  }
}

export const redisClient = new RedisClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD
});
