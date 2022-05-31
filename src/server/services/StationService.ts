import { StationStatus } from '@prisma/client';
import * as ping from 'ping';

import type { DB } from '~/server/db';
import type { BullMQ } from '~/server/lib/bullmq';
import type { ActivityService } from '~/server/services/ActivityService';

const stationServiceGlobal = global as typeof global & {
  stationService?: StationService;
};

type StationServiceConstructorParams = {
  db: DB;
  bullMQ: BullMQ;
  activityService: ActivityService;
};

export class StationService {
  static async init(
    params: StationServiceConstructorParams,
  ): Promise<StationService> {
    stationServiceGlobal.stationService = new StationService(params);
    return stationServiceGlobal.stationService;
  }

  static instance() {
    if (!stationServiceGlobal.stationService) {
      throw new Error(`${this.name} not initialized`);
    }
    return stationServiceGlobal.stationService;
  }

  db;
  bullMQ;
  activityService;

  constructor({
    db,
    bullMQ,
    activityService,
  }: StationServiceConstructorParams) {
    this.db = db;
    this.bullMQ = bullMQ;
    this.activityService = activityService;
  }

  async startStationsStatusCheck() {
    await this.bullMQ.repeatableQueue.add('station-status-check', null, {
      repeat: { cron: '*/10 * * * * *' },
    });

    this.bullMQ.on('repeatable', (job) => {
      if (job.name === 'station-status-check') {
        this._handleStationsStatusUpdate();
      }
    });
  }

  private async _handleStationsStatusUpdate() {
    const prisma = this.db.client;

    const today = new Date();
    const stations = await prisma.station.findMany({
      include: {
        orders: {
          where: {
            bookingStartAt: { lte: today },
            bookingEndAt: { gt: today },
          },
        },
      },
    });

    await Promise.allSettled(
      stations.map(async (station) => {
        const { alive: stationIsReachable } = await ping.promise.probe(
          station.ip,
          {
            timeout: 1,
          },
        );

        let currentStatus: StationStatus;
        if (stationIsReachable) {
          currentStatus = 'ACTIVE';
          if (station.orders.length) currentStatus = 'USED';
        } else {
          currentStatus = 'INACTIVE';
        }

        if (station.status !== currentStatus) {
          await prisma.station.update({
            where: { id: station.id },
            data: { status: currentStatus },
          });

          if (
            ['ACTIVE', 'INACTIVE'].includes(currentStatus) ||
            station.status === 'INACTIVE'
          ) {
            const activityType =
              currentStatus === 'INACTIVE' ? 'DISCONNECT' : 'CONNECT';
            await this.activityService.createActivity({
              type: activityType,
              stationId: station.id,
              userId: null,
            });
          }
        }
      }),
    );
  }
}
