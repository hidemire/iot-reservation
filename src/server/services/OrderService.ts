import { TRPCError } from '@trpc/server';
import { add, isBefore, sub } from 'date-fns';

import type { DB } from '~/server/db';
import type { StationService } from '~/server/services/StationService';

type OrderServiceConstructorParams = {
  db: DB;
  stationService: StationService;
  sessionDurationMin: number;
};

export class OrderService {
  db;
  stationService;
  sessionDurationMin;

  constructor({
    db,
    stationService,
    sessionDurationMin,
  }: OrderServiceConstructorParams) {
    this.db = db;
    this.stationService = stationService;
    this.sessionDurationMin = sessionDurationMin;
  }

  async getActiveOrders({ userId }: { userId?: string }) {
    const prisma = this.db.client;

    const today = new Date();
    const orders = await prisma.order.findMany({
      where: { userId, bookingEndAt: { gt: today }, status: 'ACTIVE' },
      include: { station: true },
      orderBy: { bookingStartAt: 'asc' },
    });
    return orders;
  }

  async getInfo({ orderId, userId }: { orderId: string; userId?: string }) {
    const prisma = this.db.client;

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        station: true,
      },
    });
    if (!order) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'order not found',
      });
    }

    const {
      bookingStartAt,
      bookingEndAt,
      status: orderStatus,
      station,
    } = order;
    const { id: stationId, name, status: stationStatus, description } = station;

    const connectionConfig =
      await this.stationService.getStationConnectionConfig(stationId);

    return {
      order: {
        id: orderId,
        bookingStartAt,
        bookingEndAt,
        status: orderStatus,
      },
      station: {
        id: stationId,
        name,
        status: stationStatus,
        description,
        connectionConfig,
      },
    };
  }

  async createOrder({
    stationId,
    userId,
    startTime,
  }: {
    stationId: string;
    userId: string;
    startTime: Date;
  }) {
    const prisma = this.db.client;

    await prisma.$transaction(async (p) => {
      const stationOrders = await p.order.findMany({
        where: {
          stationId,
          bookingStartAt: { lte: startTime },
          bookingEndAt: { gt: startTime },
          status: 'ACTIVE',
        },
      });
      if (stationOrders.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'order time collision',
        });
      }
      await p.order.create({
        data: {
          bookingStartAt: startTime,
          bookingEndAt: sub(
            add(startTime, { minutes: this.sessionDurationMin }),
            {
              seconds: 1,
            },
          ),
          userId,
          stationId,
        },
      });

      await p.activity.create({
        data: {
          type: 'ORDER',
          stationId: stationId,
          userId,
        },
      });
    });
  }

  async declineOrder({
    orderId,
    userId,
  }: {
    orderId: string;
    userId?: string;
  }) {
    const prisma = this.db.client;

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
    });
    if (!order) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'order not found',
      });
    }

    const today = new Date();
    if (isBefore(order.bookingStartAt, today)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'bookingStartAt is before today',
      });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'DECLINED' },
    });
  }
}
