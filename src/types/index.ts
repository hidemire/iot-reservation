import { inferQueryOutput } from '~/utils/trpc';

export type TimeSpot = {
  startTime: Date;
  status: 'available' | 'booked';
};
