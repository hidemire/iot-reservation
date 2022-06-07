import { MyEmitter } from '~/utils/MyEmitter';

import { DIContainer } from '~/server/bootstrap';

export class ActivityService extends MyEmitter<{ 'create-activity': null }> {
  db;
  redisPublisher;
  redisSubscriber;

  constructor({ db, redis }: DIContainer) {
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

  async handleActivityCreations() {
    await this.redisSubscriber.subscribe('create-activity', (err) => {
      if (err) throw err;
    });
    this.redisSubscriber.on('message', () => {
      this.emit('create-activity', null);
    });
  }
}
