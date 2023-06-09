import { z } from 'zod';
import {
  add,
  startOfDay,
  endOfDay,
  isBefore,
  isWithinInterval,
} from 'date-fns';
import { TRPCError } from '@trpc/server';

import { createProtectedRouter } from '~/server/createRouter';
import { TimeSpot } from '~/types';

export const stationRouter = createProtectedRouter()
  .query('all', {
    input: z.object({
      search: z.string().optional(),
    }),
    async resolve({ ctx, input }) {
      const prisma = ctx.scope.resolve('db').client;
      const { search } = input;
      const today = new Date();
      const endDay = endOfDay(today);

      const stations = await prisma.station.findMany({
        orderBy: { name: 'asc' },
        where: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
        include: {
          orders: {
            where: {
              bookingEndAt: {
                gte: today,
                lt: endDay,
              },
              status: 'ACTIVE',
            },
            select: {
              id: true,
            },
          },
        },
      });

      return stations.map((station) => ({
        id: station.id,
        name: station.name,
        status: station.status,
        description: station.description,
        queue: station.orders.length,
      }));
    },
  })
  .query('time-spots', {
    input: z.object({
      id: z.string().uuid(),
    }),
    async resolve({ ctx, input }) {
      const { scope } = ctx;
      const { id } = input;
      const prisma = scope.resolve('db').client;
      const { SESSION_DURATION_MIN: sessionDurationMin } =
        scope.resolve('config');

      const today = startOfDay(new Date());

      const station = await prisma.station.findUnique({
        where: { id },
        include: {
          orders: {
            where: {
              bookingStartAt: {
                gte: today,
              },
              status: 'ACTIVE',
            },
          },
        },
      });

      if (!station) {
        throw new TRPCError({ code: 'BAD_REQUEST' });
      }

      const timeSpots: TimeSpot[] = [];

      for (let days = 0; days < 7; days++) {
        let date = add(today, { days });
        const endDate = endOfDay(date);

        do {
          if (!isBefore(date, new Date())) {
            const booked = station.orders.find((order) =>
              isWithinInterval(date, {
                start: order.bookingStartAt,
                end: order.bookingEndAt,
              }),
            );
            timeSpots.push({
              startTime: date,
              status: !booked ? 'available' : 'booked',
            });
          }

          date = add(date, { minutes: sessionDurationMin });
        } while (date < endDate);
      }

      return timeSpots;
    },
  });
