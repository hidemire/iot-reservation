import { env } from '~/server/env';

import { Redis } from '~/server/lib/redis';
import { BullMQ } from '~/server/lib/bullmq';
import { DB } from '~/server/db';

import { ActivityService } from '~/server/services/ActivityService';
import { StationService } from '~/server/services/StationService';

const bootstrapGlobal = global as typeof global & {
  ssrBootstrapped?: boolean;
};

export const bootstrap = async (config: typeof env) => {
  if (bootstrapGlobal.ssrBootstrapped) return;

  const db = await DB.init({ nodeEnv: env.NODE_ENV });
  const redis = await Redis.init({
    redisConnectionUrl: config.REDIS_CONNECTION_URL,
  });

  const bullMQ = await BullMQ.init({
    connection: redis.connection,
  });

  const activityService = await ActivityService.init({ db, redis });
  const stationService = await StationService.init({
    activityService,
    bullMQ,
    db,
  });

  await stationService.startStationsStatusCheck();

  bootstrapGlobal.ssrBootstrapped = true;
};
