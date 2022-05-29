import { z } from 'zod';
import { add, set, startOfDay, endOfDay, isBefore } from 'date-fns';
import { TRPCError } from '@trpc/server';

import { createRouter } from '~/server/createRouter';
import { prisma } from '~/server/prisma';
import { TimeSpot } from '~/types';

export const stationRouter = createRouter()
  .query('all', {
    async resolve() {
      const stations = await prisma.station.findMany({
        orderBy: { name: 'asc' },
      });

      return stations.map((station) => ({
        id: station.id,
        name: station.name,
        status: station.status,
        description: station.description,
        queue: 1,
      }));
    },
  })
  .query('time-spots', {
    input: z.object({
      id: z.string().uuid(),
    }),
    async resolve({ input }) {
      const { id } = input;

      const today = startOfDay(new Date());
      console.log('🚀 ~ file: station.ts ~ line 34 ~ resolve ~ today', today);

      const station = await prisma.station.findUnique({
        where: { id },
        include: {
          orders: {
            where: {
              bookingStartAt: {
                gte: today,
              },
            },
          },
        },
      });

      if (!station) {
        throw new TRPCError({ code: 'BAD_REQUEST' });
      }

      const timeSpots: TimeSpot[] = [];
      const sessionDurationMin = 15;

      for (let days = 0; days < 7; days++) {
        let date = add(today, { days });
        const endDate = endOfDay(date);

        do {
          if (!isBefore(date, new Date())) {
            timeSpots.push({
              startTime: date,
              status: 'available',
            });
          }

          date = add(date, { minutes: sessionDurationMin });
        } while (date < endDate);
      }

      return timeSpots;
    },
  });
