import * as trpc from '@trpc/server';

import { Context } from './context';

export function createRouter() {
  return trpc.router<Context>();
}

export function createProtectedRouter() {
  return createRouter().middleware(async ({ ctx, next }) => {
    if (!ctx.session || !ctx.user) {
      throw new trpc.TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next({
      ctx: {
        ...ctx,
        session: ctx.session,
        user: ctx.user,
      },
    });
  });
}
