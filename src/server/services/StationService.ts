import { StationStatus } from '@prisma/client';
import * as ping from 'ping';

import type { DB } from '~/server/db';
import type { BullMQ } from '~/server/lib/bullmq';
import type { Redis } from '~/server/lib/redis';
import type { ActivityService } from '~/server/services/ActivityService';

type StationServiceConstructorParams = {
  db: DB;
  bullMQ: BullMQ;
  redis: Redis;
  activityService: ActivityService;
  traefikPublicHost: string;
  traefikEntryPoints: string[];
};

const TRAEFIK_TCP_ROUTERS_KEYS = {
  ENTRYPOINTS: 'traefik/tcp/routers/$1/entrypoints/0',
  RULE: 'traefik/tcp/routers/$1/rule',
  SERVICE: 'traefik/tcp/routers/$1/service',
};

const STATION_ORDER_KEY = 'app/station/$1/current-order';

type TRAEFIK_TCP_ROUTERS_KEYS_TYPE = typeof TRAEFIK_TCP_ROUTERS_KEYS;

export class StationService {
  db;
  bullMQ;
  redis;
  activityService;
  traefikPublicHost;
  traefikEntryPoints;

  constructor({
    db,
    bullMQ,
    redis,
    activityService,
    traefikPublicHost,
    traefikEntryPoints,
  }: StationServiceConstructorParams) {
    this.db = db;
    this.bullMQ = bullMQ;
    this.redis = redis;
    this.activityService = activityService;
    this.traefikPublicHost = traefikPublicHost;
    this.traefikEntryPoints = traefikEntryPoints;
  }

  async startStationsStatusCheck() {
    await this.bullMQ.repeatableQueue.add('station-status-check', null, {
      repeat: { cron: '*/10 * * * * *' },
    });

    this.bullMQ.on('repeatable', async (job) => {
      if (job.name === 'station-status-check') {
        await this._handleStationsStatusUpdate();
        await this._handleStationNetworkConfigCheck();
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
            timeout: 5,
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

          if (station.status === 'INACTIVE' || currentStatus === 'INACTIVE') {
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

  private async _handleStationNetworkConfigCheck() {
    const r = this.redis.connection;
    const prisma = this.db.client;

    const stationTraefikServices = new Map();
    (
      await r.keys('traefik/tcp/services/*/loadBalancer/servers/0/address')
    ).forEach((key) => {
      const stationId = key.match(/services\/(.*)\/loadBalancer/)![1];
      stationTraefikServices.set(stationId, key);
    });

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
    const stationsWithTraefikServiceConfig = stations.filter(({ id }) =>
      stationTraefikServices.has(id),
    );

    if (stations.length != stationsWithTraefikServiceConfig.length) {
      console.warn(
        'The configuration of traefik services does not match the number of stations added',
      );
    }

    const usedEntryPointsKeys = await r.keys(
      TRAEFIK_TCP_ROUTERS_KEYS.ENTRYPOINTS.replace('$1', '*'),
    );

    const usedEntryPointsNames = await Promise.all(
      usedEntryPointsKeys.map((key) => r.get(key)),
    );

    const availableEntypoins = this.traefikEntryPoints.filter(
      (entryPoint) => !usedEntryPointsNames.includes(entryPoint),
    );

    await Promise.all(
      stationsWithTraefikServiceConfig.map(async (station) => {
        const stationConfigKeys = Object.fromEntries(
          Object.entries(TRAEFIK_TCP_ROUTERS_KEYS).map(([key, traefikKey]) => [
            key,
            traefikKey.replace('$1', station.id),
          ]),
        ) as TRAEFIK_TCP_ROUTERS_KEYS_TYPE;

        const currentStationOrderIdFromRedis = await r.get(
          STATION_ORDER_KEY.replace('$1', station.id),
        );

        if (station.status !== 'USED') {
          const keys = Object.values(stationConfigKeys);
          await r.del([...keys, STATION_ORDER_KEY.replace('$1', station.id)]);
          return;
        }
        const currentRouterConfig = await r.keys(
          `traefik/tcp/routers/${station.id}/*`,
        );

        if (
          currentRouterConfig.length ===
            Object.keys(stationConfigKeys).length &&
          currentStationOrderIdFromRedis === station.orders[0]!.id
        ) {
          return;
        }

        await r.set(
          `app/station/${station.id}/current-order`,
          station.orders[0]!.id,
        );

        if (availableEntypoins.length) {
          const config = {
            [stationConfigKeys.ENTRYPOINTS]: availableEntypoins.pop()!,
            [stationConfigKeys.RULE]: 'HostSNI(`*`)',
            [stationConfigKeys.SERVICE]: station.id,
          };
          console.log(`Update station config: ${station.name}`, config);

          await Promise.all(
            Object.entries(config).map(([key, value]) => r.set(key, value)),
          );
        } else {
          // update order status
        }
      }),
    );
  }

  async getStationConnectionConfig(stationId: string) {
    const r = this.redis.connection;
    const prisma = this.db.client;
    const station = await prisma.station.findUnique({
      where: { id: stationId },
    });

    if (!station) {
      throw new Error('station not found');
    }

    const stationConfigKeys = Object.fromEntries(
      Object.entries(TRAEFIK_TCP_ROUTERS_KEYS).map(([key, traefikKey]) => [
        key,
        traefikKey.replace('$1', station.id),
      ]),
    ) as TRAEFIK_TCP_ROUTERS_KEYS_TYPE;

    const entrypoint = await r.get(stationConfigKeys.ENTRYPOINTS);
    if (!entrypoint) return [];

    return [{ port: parseInt(entrypoint, 10), host: this.traefikPublicHost }];
  }
}
