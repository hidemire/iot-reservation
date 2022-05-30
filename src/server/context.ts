import * as trpc from '@trpc/server';
import * as trpcNext from '@trpc/server/adapters/next';
import { NodeHTTPCreateContextFnOptions } from '@trpc/server/adapters/node-http';
import { IncomingMessage } from 'http';
import { getSession } from 'next-auth/react';
import ws from 'ws';

import { Redis } from '~/server/lib/redis';

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export const createContext = async ({
  req,
  res,
}:
  | trpcNext.CreateNextContextOptions
  | NodeHTTPCreateContextFnOptions<IncomingMessage, ws>) => {
  const redis = Redis.instance();
  const session = await getSession({ req });
  console.log('createContext for', session?.user?.name ?? 'unknown user');
  let user;
  if (session?.user?.email) {
    user = await prisma.user.findUnique({
      where: { email: session?.user?.email },
    });
  }
  return {
    req,
    res,
    prisma,
    redis,
    session,
    user,
  };
};

export type Context = trpc.inferAsyncReturnType<typeof createContext>;
