import { PrismaClient } from '@prisma/client';

import { DIContainer } from '~/server/bootstrap';

export class DB {
  client: PrismaClient;

  constructor({ config }: DIContainer) {
    this.client = new PrismaClient({
      log:
        config.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });
  }
}
