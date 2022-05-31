import { Queue, QueueScheduler, Worker, Job } from 'bullmq';
import type IORedis from 'ioredis';
import { EventEmitter } from 'stream';

const bullmqGlobal = global as typeof global & {
  bullmq?: BullMQ;
};

type BullMQConstructorParams = {
  connection: IORedis;
};

interface BullMQEventEmitterEvents {
  repeatable: (data: Job) => void;
}

declare interface BullMQEventEmitter {
  on<U extends keyof BullMQEventEmitterEvents>(
    event: U,
    listener: BullMQEventEmitterEvents[U],
  ): this;
  once<U extends keyof BullMQEventEmitterEvents>(
    event: U,
    listener: BullMQEventEmitterEvents[U],
  ): this;
  emit<U extends keyof BullMQEventEmitterEvents>(
    event: U,
    ...args: Parameters<BullMQEventEmitterEvents[U]>
  ): boolean;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class BullMQEventEmitter extends EventEmitter {}

export class BullMQ extends BullMQEventEmitter {
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
