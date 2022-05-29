import { z } from 'zod';
import { add, sub } from 'date-fns';
import { TRPCError } from '@trpc/server';

import { createProtectedRouter } from '~/server/createRouter';

const sessionDurationMin = 15;

export const orderRouter = createProtectedRouter()
  .query('active', {
    async resolve({ ctx }) {
      const { prisma } = ctx;
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
  .mutation('create', {
    input: z.object({
      stationId: z.string().uuid(),
      startTime: z.date(),
    }),
    async resolve({ ctx, input }) {
      const { prisma, user } = ctx;
      const { stationId, startTime } = input;

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
