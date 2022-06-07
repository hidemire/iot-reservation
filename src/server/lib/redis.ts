import IORedis from 'ioredis';

import { DIContainer } from '~/server/bootstrap';

export class Redis {
  connection;

  constructor({ config }: DIContainer) {
    this.connection = new IORedis(config.REDIS_CONNECTION_URL, {
      maxRetriesPerRequest: null,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
  }
}
