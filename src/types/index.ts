export type ValueOf<T> = T[keyof T];

export type TimeSpot = {
  startTime: Date;
  status: 'available' | 'booked';
};
