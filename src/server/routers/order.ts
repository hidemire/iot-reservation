import { z } from 'zod';

import { createProtectedRouter } from '~/server/createRouter';

export const orderRouter = createProtectedRouter()
  .query('active', {
    async resolve({ ctx }) {
      const { scope, user } = ctx;
      const orderService = scope.resolve('orderService');
      const orders = await orderService.getActiveOrders({ userId: user.id });
      return orders;
    },
  })
  .query('info', {
    input: z.object({
      orderId: z.string().uuid(),
    }),
    async resolve({ ctx, input }) {
      const { scope, user } = ctx;
      const { orderId } = input;
      const orderService = scope.resolve('orderService');
      const info = await orderService.getInfo({ orderId, userId: user.id });
      return info;
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
      const orderService = scope.resolve('orderService');
      await orderService.createOrder({ stationId, startTime, userId: user.id });
    },
  })
  .mutation('decline', {
    input: z.object({
      orderId: z.string().uuid(),
    }),
    async resolve({ ctx, input }) {
      const { scope, user } = ctx;
      const { orderId } = input;
      const orderService = scope.resolve('orderService');
      await orderService.declineOrder({ orderId, userId: user.id });
    },
  });
