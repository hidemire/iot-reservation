import { MyEmitter } from '~/utils/MyEmitter';

import type { DB } from '~/server/db';
import type { Redis } from '~/server/lib/redis';

const activityServiceGlobal = global as typeof global & {
  activityService?: ActivityService;
};

type ActivityServiceConstructorParams = {
  db: DB;
  redis: Redis;
};

export class ActivityService extends MyEmitter<{ 'create-activity': null }> {
  static async init(
    params: ActivityServiceConstructorParams,
  ): Promise<ActivityService> {
    activityServiceGlobal.activityService = new ActivityService(params);
    await activityServiceGlobal.activityService._handleActivityCreations();
    return activityServiceGlobal.activityService;
  }

  static instance() {
    if (!activityServiceGlobal.activityService) {
      throw new Error(`${this.name} not initialized`);
    }
    return activityServiceGlobal.activityService;
  }

  db;
  redisPublisher;
  redisSubscriber;

  constructor({ db, redis }: ActivityServiceConstructorParams) {
    super();
    this.db = db;

    this.redisPublisher = redis.connection.duplicate();
    this.redisSubscriber = redis.connection.duplicate();
  }

  async createActivity(
    activity: Parameters<typeof this.db.client.activity.create>[0]['data'],
  ) {
    const prisma = this.db.client;

    await prisma.activity.create({ data: activity });
    await this.redisPublisher.publish('create-activity', '');
  }

  private async _handleActivityCreations() {
    await this.redisSubscriber.subscribe('create-activity', () => {
      this.emit('create-activity', null);
    });
  }
}
