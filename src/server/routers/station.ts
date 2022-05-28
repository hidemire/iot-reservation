import { createRouter } from '~/server/createRouter';
import { prisma } from '~/server/prisma';

export const stationRouter = createRouter().query('get-all', {
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
});
