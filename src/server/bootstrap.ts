import { asClass, AwilixContainer, createContainer } from 'awilix';

import type { env } from '~/server/env';

import { Redis } from '~/server/lib/redis';
import { BullMQ } from '~/server/lib/bullmq';
import { DB } from '~/server/db';

import { ActivityService } from '~/server/services/ActivityService';
import { StationService } from '~/server/services/StationService';

type DIContainer = {
  db: DB;
  redis: Redis;
  bullMQ: BullMQ;
  activityService: ActivityService;
  stationService: StationService;
};

const bootstrapGlobal = global as typeof global & {
  container?: AwilixContainer<DIContainer>;
};

export const bootstrap = async (config: typeof env) => {
  if (bootstrapGlobal.container) return;

  const container = createContainer<DIContainer>().register({
    db: asClass(DB)
      .singleton()
      .inject(() => ({ nodeEnv: config.NODE_ENV }))
      .disposer((db) => db.client.$disconnect()),
    redis: asClass(Redis)
      .singleton()
      .inject(() => ({ redisConnectionUrl: config.REDIS_CONNECTION_URL }))
      .disposer((redis) => redis.connection.quit()),
    bullMQ: asClass(BullMQ)
      .singleton()
      .inject((c) => ({
        connection: c.resolve<Redis>('redis').connection,
      }))
      .disposer((bullMQ) =>
        Promise.allSettled([
          bullMQ.repeatableQueue.close(),
          bullMQ.repeatableWorker.close(),
        ]),
      ),
    // Services
    activityService: asClass(ActivityService).singleton(),
    stationService: asClass(StationService).singleton(),
  });

  await container.resolve('db').client.$connect();
  await container.resolve('activityService').handleActivityCreations();
  await container.resolve('stationService').startStationsStatusCheck();

  bootstrapGlobal.container = container;
};

export const getDIContainer = () => {
  if (!bootstrapGlobal.container) throw new Error('di container not exists');
  return bootstrapGlobal.container;
};
