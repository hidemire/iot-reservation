import IORedis from 'ioredis';

const redisGlobal = global as typeof global & {
  redis?: Redis;
};

type RedisConstructorParams = {
  redisConnectionUrl: string;
};

export class Redis {
  static async init(params: RedisConstructorParams): Promise<Redis> {
    redisGlobal.redis = new Redis(params);
    console.log(`redis service connected to: ${params.redisConnectionUrl}`);
    return redisGlobal.redis;
  }

  static instance() {
    if (!redisGlobal.redis) {
      throw new Error(`${Redis.name} not initialized`);
    }

    return redisGlobal.redis;
  }

  connection;

  constructor({ redisConnectionUrl }: RedisConstructorParams) {
    this.connection = new IORedis(redisConnectionUrl, {
      maxRetriesPerRequest: null,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
  }
}
