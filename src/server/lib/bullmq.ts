import { Queue, QueueScheduler, Worker, Job } from 'bullmq';
import type IORedis from 'ioredis';

import { MyEmitter } from '~/utils/MyEmitter';

type BullMQConstructorParams = {
  connection: IORedis;
};
export class BullMQ extends MyEmitter<{ repeatable: Job }> {
  repeatableQueue;
  repeatableWorker;

  constructor({ connection }: BullMQConstructorParams) {
    super();
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
