import { PrismaClient } from '@prisma/client';

type DBConstructorParams = {
  nodeEnv: string;
};
export class DB {
  client: PrismaClient;

  constructor({ nodeEnv }: DBConstructorParams) {
    this.client = new PrismaClient({
      log: nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
}
