import { Queue, QueueScheduler, Worker, Job } from 'bullmq';
import type IORedis from 'ioredis';

import { MyEmitter } from '~/utils/MyEmitter';

const bullmqGlobal = global as typeof global & {
  bullmq?: BullMQ;
};

type BullMQConstructorParams = {
  connection: IORedis;
};
export class BullMQ extends MyEmitter<{ repeatable: Job }> {
  static async init(params: BullMQConstructorParams): Promise<BullMQ> {
    bullmqGlobal.bullmq = new BullMQ(params);
    return bullmqGlobal.bullmq;
  }

  static instance() {
    if (!bullmqGlobal.bullmq) {
      throw new Error(`${BullMQ.name} not initialized`);
    }

    return bullmqGlobal.bullmq;
  }

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
