import { PrismaClient } from '@prisma/client';

const dbGlobal = global as typeof global & {
  db?: DB;
};

type DBConstructorParams = {
  nodeEnv: string;
};

export class DB {
  static async init(params: DBConstructorParams): Promise<DB> {
    dbGlobal.db = new DB(params);
    await dbGlobal.db.client.$connect();
    console.log('db connected');
    return dbGlobal.db;
  }

  static instance() {
    if (!dbGlobal.db) {
      throw new Error(`${DB.name} not initialized`);
    }

    return dbGlobal.db;
  }

  client: PrismaClient;

  constructor({ nodeEnv }: DBConstructorParams) {
    this.client = new PrismaClient({
      log: nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
}
