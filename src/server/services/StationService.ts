import { StationStatus } from '@prisma/client';
import * as ping from 'ping';

import { DIContainer } from '~/server/bootstrap';

const TRAEFIK_TCP_ROUTERS_KEYS = {
  ENTRYPOINTS: 'traefik/tcp/routers/*/entrypoints/0',
  RULE: 'traefik/tcp/routers/*/rule',
  SERVICE: 'traefik/tcp/routers/*/service',
};

const TRAEFIK_TCP_SERVICES_KEYS = {
  LOAD_BALANCER_ADDRESS:
    'traefik/tcp/services/*/loadBalancer/servers/0/address',
};

const STATION_ORDER_KEY = 'app/station/*/current-order';

type TRAEFIK_TCP_ROUTERS_KEYS_TYPE = typeof TRAEFIK_TCP_ROUTERS_KEYS;

export class StationService {
  db;
  bullMQ;
  redis;
  activityService;
  traefikPublicHost;
  traefikEntryPoints;
  pingDeadlineSec;
  repeatableCron;

  constructor({ db, bullMQ, redis, activityService, config }: DIContainer) {
    this.db = db;
    this.bullMQ = bullMQ;
    this.redis = redis;
    this.activityService = activityService;
    this.traefikPublicHost = config.TRAEFIK_PUBLIC_HOST;
    this.traefikEntryPoints = config.TRAEFIK_ENTRY_POINTS;
    this.pingDeadlineSec = config.PING_DEADLINE_SEC;
    this.repeatableCron = config.REPEATABLE_CRON;
  }

  async startStationsStatusCheck() {
    await this.bullMQ.repeatableQueue.add('station-status-check', null, {
      repeat: { cron: this.repeatableCron },
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
            status: 'ACTIVE',
          },
        },
      },
    });

    await Promise.allSettled(
      stations.map(async (station) => {
        const { alive: stationIsReachable } = await ping.promise.probe(
          station.ip,
          {
            deadline: this.pingDeadlineSec,
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

    const stationDevicesTraefikServices = new Map();
    (await r.keys(TRAEFIK_TCP_SERVICES_KEYS.LOAD_BALANCER_ADDRESS)).forEach(
      (key) => {
        const deviceId = key.match(/services\/(.*)\/loadBalancer/)![1];
        stationDevicesTraefikServices.set(deviceId, key);
      },
    );

    const today = new Date();
    const stations = await prisma.station.findMany({
      include: {
        orders: {
          where: {
            bookingStartAt: { lte: today },
            bookingEndAt: { gt: today },
          },
        },
        devices: true,
      },
    });

    const usedEntryPointsKeys = await r.keys(
      TRAEFIK_TCP_ROUTERS_KEYS.ENTRYPOINTS,
    );

    const usedEntryPointsNames = await Promise.all(
      usedEntryPointsKeys.map((key) => r.get(key)),
    );

    const availableEntryPoints = this.traefikEntryPoints.filter(
      (entryPoint) => !usedEntryPointsNames.includes(entryPoint),
    );

    await Promise.all(
      stations.map(async (station) => {
        await Promise.all(
          station.devices.map(async (device) => {
            await r.set(
              TRAEFIK_TCP_SERVICES_KEYS.LOAD_BALANCER_ADDRESS.replace(
                '*',
                device.id,
              ),
              `${station.ip}:${device.port}`,
            );
            stationDevicesTraefikServices.delete(device.id);
          }),
        );

        const stationConfigKeys = new Map<
          string,
          TRAEFIK_TCP_ROUTERS_KEYS_TYPE
        >();

        station.devices.forEach((device) => {
          const deviceConfigKeys = Object.fromEntries(
            Object.entries(TRAEFIK_TCP_ROUTERS_KEYS).map(
              ([key, traefikKey]) => [key, traefikKey.replace('*', device.id)],
            ),
          ) as TRAEFIK_TCP_ROUTERS_KEYS_TYPE;
          stationConfigKeys.set(device.id, deviceConfigKeys);
        });

        const currentStationOrderIdFromRedis = await r.get(
          STATION_ORDER_KEY.replace('*', station.id),
        );

        if (station.status !== 'USED') {
          const keys = Array.from(stationConfigKeys.values()).flatMap((keys) =>
            Object.values(keys),
          );
          await r.del([...keys, STATION_ORDER_KEY.replace('*', station.id)]);
          return;
        }

        if (
          !station.orders[0] ||
          currentStationOrderIdFromRedis === station.orders[0].id
        ) {
          return;
        }

        await r.set(
          `app/station/${station.id}/current-order`,
          station.orders[0].id,
        );

        const devicesConfig = new Map<string, string>();

        try {
          station.devices.forEach((device) => {
            const deviceConfigKeys = stationConfigKeys.get(device.id);
            if (!deviceConfigKeys) {
              throw new Error(
                `missed device ${device.id} in the stationConfigKeys ${station.id}`,
              );
            }
            const entryPoint = availableEntryPoints.pop();
            if (!entryPoint) {
              throw new Error(
                `there are not free entry point for device ${device.id}`,
              );
            }
            devicesConfig.set(deviceConfigKeys.ENTRYPOINTS, entryPoint);
            devicesConfig.set(deviceConfigKeys.RULE, 'HostSNI(`*`)');
            devicesConfig.set(deviceConfigKeys.SERVICE, device.id);
          });

          console.log(`Update station config: ${station.name}`, devicesConfig);

          const rSetPromises = Array.from(devicesConfig.entries()).map(
            ([key, value]) => r.set(key, value),
          );
          await Promise.all(rSetPromises);
        } catch (error) {
          // update order status
          console.error('Station config update error', error);
        }
      }),
    );

    if (stationDevicesTraefikServices.size) {
      console.log(
        'Found extra device configurations. Deleting...',
        stationDevicesTraefikServices,
      );
      await r.del(Array.from(stationDevicesTraefikServices.values()));
    }
  }

  async getStationConnectionConfig(stationId: string) {
    const r = this.redis.connection;
    const prisma = this.db.client;
    const station = await prisma.station.findUnique({
      where: { id: stationId },
      include: { devices: true },
    });

    if (!station) {
      throw new Error('station not found');
    }

    const devicesConfig = await Promise.all(
      station.devices.map(async (device) => {
        const entryPoint = await r.get(
          TRAEFIK_TCP_ROUTERS_KEYS.ENTRYPOINTS.replace('*', device.id),
        );

        return {
          port: entryPoint,
          host: this.traefikPublicHost,
          deviceName: device.name,
          deviceId: device.id,
        };
      }),
    );

    return devicesConfig;
  }
}
