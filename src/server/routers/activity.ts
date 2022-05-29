import { startOfDay } from 'date-fns';

import { createProtectedRouter } from '~/server/createRouter';

export const activityRouter = createProtectedRouter().query('all', {
  async resolve({ ctx }) {
    const { prisma } = ctx;
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
});
