import { Queue, QueueScheduler, Worker, Job } from 'bullmq';

import { MyEmitter } from '~/utils/MyEmitter';
import { DIContainer } from '~/server/bootstrap';

export class BullMQ extends MyEmitter<{ repeatable: Job }> {
  repeatableQueue;
  repeatableWorker;

  constructor({ redis }: DIContainer) {
    super();
    const connection = redis.connection;
    new QueueScheduler('repeatable', { connection });
    this.repeatableQueue = new Queue('repeatable', {
      connection,
    });
    this.repeatableWorker = new Worker(
      'repeatable',
      async (job) => {
        this.emit('repeatable', job);
      },
      { connection },
    );
  }
}
