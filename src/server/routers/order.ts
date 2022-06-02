import { z } from 'zod';
import { add, sub } from 'date-fns';
import { TRPCError } from '@trpc/server';

import { createProtectedRouter } from '~/server/createRouter';

const sessionDurationMin = 15;

export const orderRouter = createProtectedRouter()
  .query('active', {
    async resolve({ ctx }) {
      const prisma = ctx.scope.resolve('db').client;
      const today = new Date();
      const orders = await prisma.order.findMany({
        where: { userId: ctx.user?.id, bookingEndAt: { gt: today } },
        include: {
          station: true,
        },
        orderBy: {
          bookingStartAt: 'asc',
        },
      });
      return orders;
    },
  })
  .query('info', {
    input: z.object({
      orderId: z.string().uuid(),
    }),
    async resolve({ ctx, input }) {
      const prisma = ctx.scope.resolve('db').client;
      const stationService = ctx.scope.resolve('stationService');
      const order = await prisma.order.findUnique({
        where: { id: input.orderId },
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
        id: orderId,
        bookingStartAt,
        bookingEndAt,
        status: orderStatus,
        station,
      } = order;
      const {
        id: stationId,
        name,
        status: stationStatus,
        description,
      } = station;

      const connectionConfig = await stationService.getStationConnectionConfig(
        stationId,
      );

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
    },
  })
  .mutation('create', {
    input: z.object({
      stationId: z.string().uuid(),
      startTime: z.date(),
    }),
    async resolve({ ctx, input }) {
      const { scope, user } = ctx;
      const { stationId, startTime } = input;
      const prisma = scope.resolve('db').client;

      await prisma.$transaction(async (p) => {
        const stationOrders = await p.order.findMany({
          where: {
            stationId,
            bookingStartAt: { lte: startTime },
            bookingEndAt: { gt: startTime },
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
            bookingEndAt: sub(add(startTime, { minutes: sessionDurationMin }), {
              seconds: 1,
            }),
            userId: user.id,
            stationId,
          },
        });

        await p.activity.create({
          data: {
            type: 'ORDER',
            stationId: stationId,
            userId: user.id,
          },
        });
      });
    },
  });
