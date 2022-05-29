/**
 * This file contains the root router of your tRPC-backend
 */
import { createRouter } from '../createRouter';
import superjson from 'superjson';

import { stationRouter } from './station';
import { orderRouter } from './order';

export const appRouter = createRouter()
  .transformer(superjson)
  .query('healthz', {
    resolve() {
      return 'yay!';
    },
  })
  .merge('station.', stationRouter)
  .merge('order.', orderRouter);

export type AppRouter = typeof appRouter;
