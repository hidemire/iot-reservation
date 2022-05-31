import { env } from '~/server/env';

import { Redis } from '~/server/lib/redis';
import { BullMQ } from '~/server/lib/bullmq';
import { DB } from '~/server/db';

const bootstrapGlobal = global as typeof global & {
  ssrBootstrapped?: boolean;
};

export const bootstrap = async (config: typeof env) => {
  if (bootstrapGlobal.ssrBootstrapped) return;

  await DB.init({ nodeEnv: env.NODE_ENV });
  const redis = await Redis.init({
    redisConnectionUrl: config.REDIS_CONNECTION_URL,
  });

  const bullMQ = await BullMQ.init({
    connection: redis.connection,
  });
  await bullMQ.repeatableQueue.add('station-status-check', null, {
    repeat: { cron: '* * * * *' },
  });
  bullMQ.on('repeatable', (job) => {
    console.log(
      '🚀 ~ file: bootstrap.ts ~ line 26 ~ bullMQ.on ~ job',
      job.name,
    );
  });

  bootstrapGlobal.ssrBootstrapped = true;
};
