import { startOfDay } from 'date-fns';
import { Subscription } from '@trpc/server';

import { createProtectedRouter } from '~/server/createRouter';

export const activityRouter = createProtectedRouter()
  .query('all', {
    async resolve({ ctx }) {
      const prisma = ctx.scope.resolve('db').client;

      const activities = await prisma.activity.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: true,
          station: true,
        },
        take: 5,
      });

      const days: { [dayTime: number]: typeof activities } = {};

      activities.forEach((activity) => {
        const day = startOfDay(activity.createdAt).getTime();
        !days[day] && (days[day] = []);
        days[day]?.push(activity);
      });
      return days;
    },
  })
  .subscription('onCreated', {
    resolve({ ctx }) {
      const activityService = ctx.scope.resolve('activityService');
      return new Subscription<null>((emit) => {
        const onActivityCreated = () => {
          emit.data(null);
        };
        activityService.on('create-activity', onActivityCreated);
        return () => activityService.off('create-activity', onActivityCreated);
      });
    },
  });
