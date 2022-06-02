import IORedis from 'ioredis';

type RedisConstructorParams = {
  redisConnectionUrl: string;
};

export class Redis {
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
