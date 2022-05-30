import { RedisClientType } from '@redis/client';
import * as redis from 'redis';

const redisGlobal = global as typeof global & {
  redis?: Redis;
};

type RedisConstructorParams = {
  redisConnectionUrl: string;
};

export class Redis {
  static async init(params: RedisConstructorParams) {
    redisGlobal.redis = new Redis(params);
    await redisGlobal.redis.client.connect();
    console.log(`redis service connected to: ${params.redisConnectionUrl}`);
  }

  static instance() {
    if (!redisGlobal.redis) {
      throw new Error(`${Redis.name} not initialized`);
    }

    return redisGlobal.redis;
  }

  client: RedisClientType;

  constructor({ redisConnectionUrl }: RedisConstructorParams) {
    this.client = redis.createClient({ url: redisConnectionUrl });
  }
}
