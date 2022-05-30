import { env } from '~/server/env';

import { Redis } from '~/server/lib/redis';
import { DB } from '~/server/db';

const bootstrapGlobal = global as typeof global & {
  ssrBootstrapped?: boolean;
};

export const bootstrap = async (config: typeof env) => {
  if (!bootstrapGlobal.ssrBootstrapped) {
    await DB.init({ nodeEnv: env.NODE_ENV });
    await Redis.init({
      redisConnectionUrl: config.REDIS_CONNECTION_URL,
    });
    bootstrapGlobal.ssrBootstrapped = true;
  }
};
