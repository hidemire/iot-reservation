import { inferQueryOutput } from '~/utils/trpc';
import type { env } from '~/server/env';

export type ValueOf<T> = T[keyof T];

export type TimeSpot = {
  startTime: Date;
  status: 'available' | 'booked';
};

export type StationsResponse = inferQueryOutput<'station.all'>;

export type Config = typeof env;
