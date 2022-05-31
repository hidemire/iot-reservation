import React from 'react';

import { ValueOf } from '~/types';
import { inferQueryOutput } from '~/utils/trpc';

type Activity = ValueOf<inferQueryOutput<'activity.all'>>[0];

const orderActivity = (activity: Activity) => {
  return (
    <>
      <div className="w-9 h-9 rounded-full flex-shrink-0 bg-indigo-500 my-2 mr-3">
        <svg
          className="w-9 h-9 fill-current text-indigo-50"
          viewBox="0 0 36 36"
        >
          <path d="M18 10c-4.4 0-8 3.1-8 7s3.6 7 8 7h.6l5.4 2v-4.4c1.2-1.2 2-2.8 2-4.6 0-3.9-3.6-7-8-7zm4 10.8v2.3L18.9 22H18c-3.3 0-6-2.2-6-5s2.7-5 6-5 6 2.2 6 5c0 2.2-2 3.8-2 3.8z"></path>
        </svg>
      </div>
      <div className="flex-grow flex items-center text-sm text-gray-600 dark:text-gray-100 py-2">
        <div className="flex-grow flex justify-between items-center">
          <div className="self-center">
            <a
              className="font-medium text-gray-800 hover:text-gray-900 dark:text-gray-50 dark:hover:text-gray-100"
              href="#0"
              style={{ outline: 'none' }}
            >
              {activity.user?.email.split('@')[0]}
            </a>{' '}
            booked station{' '}
            <a
              className="out font-medium text-gray-800 dark:text-gray-50 dark:hover:text-gray-100"
              href="#0"
              style={{ outline: 'none' }}
            >
              {activity.station?.name}
            </a>{' '}
          </div>
        </div>
      </div>
    </>
  );
};

const connectActivity = (activity: Activity) => {
  return (
    <>
      <div className="w-9 h-9 rounded-full flex-shrink-0 bg-green-500 my-2 mr-3">
        <svg className="w-9 h-9 fill-current text-green-50" viewBox="0 0 36 36">
          <path d="M25 24H11a1 1 0 01-1-1v-5h2v4h12v-4h2v5a1 1 0 01-1 1zM14 13h8v2h-8z"></path>
        </svg>
      </div>
      <div className="flex-grow flex items-center border-gray-100 text-sm text-gray-600 dark:text-gray-50 py-2">
        <div className="flex-grow flex justify-between items-center">
          <div className="self-center">
            The connection to the station has been restored{' '}
            <a
              className="font-medium text-gray-800 dark:text-gray-50 dark:hover:text-gray-100"
              href="#0"
              style={{ outline: 'none' }}
            >
              {activity.station?.name}
            </a>{' '}
          </div>
        </div>
      </div>
    </>
  );
};

const disconnectActivity = (activity: Activity) => {
  return (
    <>
      <div className="w-9 h-9 rounded-full flex-shrink-0 bg-red-500 my-2 mr-3">
        <svg className="w-9 h-9 fill-current text-red-50" viewBox="0 0 36 36">
          <path d="M25 24H11a1 1 0 01-1-1v-5h2v4h12v-4h2v5a1 1 0 01-1 1zM14 13h8v2h-8z"></path>
        </svg>
      </div>
      <div className="flex-grow flex items-center border-gray-100 text-sm text-gray-600 dark:text-gray-50 py-2">
        <div className="flex-grow flex justify-between items-center">
          <div className="self-center">
            Loss of connection to the station{' '}
            <a
              className="font-medium text-gray-800 dark:text-gray-50 dark:hover:text-gray-100"
              href="#0"
              style={{ outline: 'none' }}
            >
              {activity.station?.name}
            </a>{' '}
          </div>
        </div>
      </div>
    </>
  );
};

export const Activity: React.FC<{ activity: Activity }> = ({ activity }) => {
  switch (activity.type) {
    case 'ORDER':
      return orderActivity(activity);
    case 'CONNECT':
      return connectActivity(activity);
    case 'DISCONNECT':
      return disconnectActivity(activity);
    default:
      return <div></div>;
  }
};
