import { asClass, asValue, AwilixContainer, createContainer } from 'awilix';

import { Redis } from '~/server/lib/redis';
import { BullMQ } from '~/server/lib/bullmq';
import { DB } from '~/server/db';

import { ActivityService } from '~/server/services/ActivityService';
import { StationService } from '~/server/services/StationService';
import { OrderService } from '~/server/services/OrderService';
import { Config } from '~/types';

export type DIContainer = {
  db: DB;
  redis: Redis;
  bullMQ: BullMQ;
  activityService: ActivityService;
  stationService: StationService;
  orderService: OrderService;
  config: Config;
};

const bootstrapGlobal = global as typeof global & {
  container?: AwilixContainer<DIContainer>;
};

export const bootstrap = async (config: Config) => {
  if (bootstrapGlobal.container) return;

  const container = createContainer<DIContainer>().register({
    config: asValue(config),
    db: asClass(DB)
      .singleton()
      .disposer((db) => db.client.$disconnect()),
    redis: asClass(Redis)
      .singleton()
      .disposer((redis) => redis.connection.quit()),
    bullMQ: asClass(BullMQ)
      .singleton()
      .disposer((bullMQ) =>
        Promise.allSettled([
          bullMQ.repeatableQueue.close(),
          bullMQ.repeatableWorker.close(),
        ]),
      ),
    // Services
    activityService: asClass(ActivityService).singleton(),
    stationService: asClass(StationService).singleton(),
    orderService: asClass(OrderService).singleton(),
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
