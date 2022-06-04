import { inferQueryOutput } from '~/utils/trpc';

export type ValueOf<T> = T[keyof T];

export type TimeSpot = {
  startTime: Date;
  status: 'available' | 'booked';
};

export type StationsResponse = inferQueryOutput<'station.all'>;
