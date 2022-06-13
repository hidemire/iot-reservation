import { FC, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSession, signIn, signOut } from 'next-auth/react';
import NiceModal from '@ebay/nice-modal-react';
import type { StationStatus } from '@prisma/client';
import { add, format, isAfter } from 'date-fns';

import { trpc } from '~/utils/trpc';
import { NextPageWithLayout } from '~/pages/_app';
import { ThemeChanger } from '~/components/ThemeChanger';
import { StationBookModal } from '~/components/StationBookModal';
import { Activity } from '~/components/Activity';
import { StationsResponse } from '~/types';

const StationViewModal = dynamic(
  async () => {
    const m = await import('~/components/StationViewModal');
    return m.StationViewModal;
  },
  { ssr: false },
);

const spotTextFormat = 'HH:mm';

const stationStatusMapper: {
  [key in StationStatus]: { text: string; color: string };
} = {
  ACTIVE: {
    text: 'available',
    color: 'text-green-700 bg-green-100 dark:bg-green-700 dark:text-green-100',
  },
  INACTIVE: {
    text: 'unavailable',
    color: 'text-red-700 bg-red-100 dark:text-red-100 dark:bg-red-700',
  },
  USED: {
    text: 'used',
    color: 'text-yellow-700 bg-yellow-100',
  },
};

const refreshParams = {
  refetchInterval: 60 * 1000,
  refetchIntervalInBackground: true,
};

const IndexPage: NextPageWithLayout = () => {
  const utils = trpc.useContext();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!session) {
    if (mounted) signIn('google');
    return <></>;
  }

  const { data: stations } = trpc.useQuery(['station.all'], {
    ...refreshParams,
  });

  const { data: activeOrders } = trpc.useQuery(['order.active'], {
    ...refreshParams,
  });

  const { data: activities } = trpc.useQuery(['activity.all'], {
    ...refreshParams,
  });

  const declineOrder = trpc.useMutation('order.decline', {
    async onSuccess() {
      await utils.invalidateQueries('order.active');
      await utils.invalidateQueries('station.all');
    },
    onError(error) {
      alert(error.message);
    },
  });

  trpc.useSubscription(['activity.onCreated'], {
    async onNext() {
      await utils.invalidateQueries('station.all');
      await utils.invalidateQueries('activity.all');
    },
  });

  const showBookModal = (station: StationsResponse[0]) => {
    NiceModal.show(StationBookModal, { station });
  };

  const showViewModal = (id: string) => {
    NiceModal.show(StationViewModal as FC<any>, { orderId: id });
  };

  const onDeclineOrder = (orderId: string) => {
    declineOrder.mutate({ orderId });
  };

  return (
    <>
      <div className="min-h-screen flex flex-col flex-auto flex-shrink-0 antialiased bg-white dark:bg-gray-700 text-black dark:text-white">
        {/* Header */}
        <div className="fixed w-full flex items-center justify-between h-14 text-white z-10">
          <div className="flex items-center justify-start md:justify-center pl-3 w-14 md:w-64 h-14 bg-blue-800 dark:bg-gray-800 border-none">
            <img
              className="w-7 h-7 md:w-10 md:h-10 mr-2 rounded-md overflow-hidden"
              src={
                session?.user?.image ||
                'https://therminic2018.eu/wp-content/uploads/2018/07/dummy-avatar.jpg'
              }
            />
            <span className="hidden md:block">{session?.user?.name}</span>
          </div>
          <div className="flex justify-between items-center h-14 bg-blue-800 dark:bg-gray-800 header-right">
            <div className="bg-white rounded flex items-center w-full max-w-xl mr-4 p-2 shadow-sm border border-gray-200">
              <button className="outline-none focus:outline-none">
                <svg
                  className="w-5 text-gray-600 h-5 cursor-pointer"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </button>
              <input
                type="search"
                name=""
                id=""
                placeholder="Search"
                className="w-full pl-3 text-sm text-black outline-none focus:outline-none bg-transparent"
              />
            </div>
            <ul className="flex items-center">
              <li>
                <ThemeChanger />
              </li>
              <li>
                <button
                  aria-hidden="true"
                  onClick={() =>
                    window.open(
                      'https://filebrowser.hidemire.dev/api/public/dl/6A4b3CTk?inline=true',
                      '_blank',
                    )
                  }
                  className="group p-2 transition-colors duration-200 rounded-full shadow-md bg-blue-200 hover:bg-blue-200 dark:bg-gray-50 dark:hover:bg-gray-200 text-gray-900 focus:outline-none"
                >
                  <svg
                    width="24px"
                    height="24px"
                    viewBox="0 0 973.1 973.1"
                    className="fill-current text-gray-700 group-hover:text-gray-500 group-focus:text-gray-700 dark:text-gray-700 dark:group-hover:text-gray-500 dark:group-focus:text-gray-700"
                    xmlSpace="preserve"
                  >
                    <path d="M502.29,788.199h-47c-33.1,0-60,26.9-60,60v64.9c0,33.1,26.9,60,60,60h47c33.101,0,60-26.9,60-60v-64.9 C562.29,815,535.391,788.199,502.29,788.199z" />
                    <path d="M170.89,285.8l86.7,10.8c27.5,3.4,53.6-12.4,63.5-38.3c12.5-32.7,29.9-58.5,52.2-77.3c31.601-26.6,70.9-40,117.9-40 c48.7,0,87.5,12.8,116.3,38.3c28.8,25.6,43.1,56.2,43.1,92.1c0,25.8-8.1,49.4-24.3,70.8c-10.5,13.6-42.8,42.2-96.7,85.9 c-54,43.7-89.899,83.099-107.899,118.099c-18.4,35.801-24.8,75.5-26.4,115.301c-1.399,34.1,25.8,62.5,60,62.5h49 c31.2,0,57-23.9,59.8-54.9c2-22.299,5.7-39.199,11.301-50.699c9.399-19.701,33.699-45.701,72.699-78.1 C723.59,477.8,772.79,428.4,795.891,392c23-36.3,34.6-74.8,34.6-115.5c0-73.5-31.3-138-94-193.4c-62.6-55.4-147-83.1-253-83.1 c-100.8,0-182.1,27.3-244.1,82c-52.8,46.6-84.9,101.8-96.2,165.5C139.69,266.1,152.39,283.5,170.89,285.8z" />
                  </svg>
                </button>
              </li>
              <li>
                <div className="block w-px h-6 mx-3 bg-gray-400 dark:bg-gray-700"></div>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center mr-4 hover:text-blue-100"
                  onClick={() => signOut()}
                >
                  <span className="inline-flex mr-1">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      ></path>
                    </svg>
                  </span>
                  Logout
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Sidebar */}
        <div className="fixed flex flex-col top-14 left-0 w-14 hover:w-64 md:w-64 bg-blue-900 dark:bg-gray-900 h-full text-white transition-all duration-300 border-none z-10 sidebar">
          <div className="overflow-y-auto overflow-x-hidden flex flex-col justify-between flex-grow">
            <ul className="flex flex-col py-4 space-y-1">
              <li className="px-5 hidden md:block">
                <div className="flex flex-row items-center h-8">
                  <div className="text-sm font-light tracking-wide text-gray-400 uppercase">
                    Main
                  </div>
                </div>
              </li>
              <li>
                <a
                  href="#"
                  className="relative flex flex-row items-center h-11 focus:outline-none hover:bg-blue-800 dark:hover:bg-gray-600 text-white-600 hover:text-white-800 border-l-4 border-transparent hover:border-blue-500 dark:hover:border-gray-800 pr-6"
                >
                  <span className="inline-flex justify-center items-center ml-4">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      ></path>
                    </svg>
                  </span>
                  <span className="ml-2 text-sm tracking-wide truncate">
                    Dashboard
                  </span>
                </a>
              </li>
              {/* <li className="px-5 hidden md:block">
                <div className="flex flex-row items-center mt-5 h-8">
                  <div className="text-sm font-light tracking-wide text-gray-400 uppercase">
                    Settings
                  </div>
                </div>
              </li>
              <li>
                <a
                  href="#"
                  className="relative flex flex-row items-center h-11 focus:outline-none hover:bg-blue-800 dark:hover:bg-gray-600 text-white-600 hover:text-white-800 border-l-4 border-transparent hover:border-blue-500 dark:hover:border-gray-800 pr-6"
                >
                  <span className="inline-flex justify-center items-center ml-4">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      ></path>
                    </svg>
                  </span>
                  <span className="ml-2 text-sm tracking-wide truncate">
                    Profile
                  </span>
                </a>
              </li> */}
            </ul>
            <p className="mb-14 px-5 py-3 hidden md:block text-center text-xs">
              Copyright @2022
            </p>
          </div>
        </div>

        <div className="h-full ml-14 mt-14 mb-10 md:ml-64">
          <div className="grid grid-cols-1 lg:grid-cols-2 p-4 gap-4">
            <div className="relative flex flex-col min-w-0 mb-4 lg:mb-0 break-words bg-gray-50 dark:bg-gray-800 w-full shadow-lg rounded">
              <div className="rounded-t mb-0 px-0 border-0">
                <div className="flex flex-wrap items-center px-4 py-2">
                  <div className="relative w-full max-w-full flex-grow flex-1">
                    <h3 className="font-semibold text-base text-gray-900 dark:text-gray-50">
                      Booked Stations
                    </h3>
                  </div>
                </div>
                <div className="block w-full overflow-x-auto">
                  <table className="items-center w-full bg-transparent border-collapse">
                    <thead>
                      <tr>
                        <th className="w-0 px-4 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-100 align-middle border border-solid border-gray-200 dark:border-gray-500 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                          Station
                        </th>
                        <th className="w-0 px-4 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-100 align-middle border border-solid border-gray-200 dark:border-gray-500 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                          Date
                        </th>
                        <th className="w-0 px-4 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-100 align-middle border border-solid border-gray-200 dark:border-gray-500 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeOrders?.map((order) => (
                        <tr
                          key={order.id}
                          className="text-gray-700 dark:text-gray-100"
                        >
                          <th className="border-t-0 px-4 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-left">
                            <button
                              disabled={
                                isAfter(order.bookingStartAt, new Date()) ||
                                order.station.status !== 'USED'
                              }
                              onClick={() => showViewModal(order.id)}
                              className="disabled:cursor-not-allowed"
                            >
                              {order.station.name}
                            </button>
                          </th>
                          <td className="border-t-0 px-4 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                            {format(order.bookingStartAt, spotTextFormat)}
                            {' - '}
                            {format(
                              add(order.bookingEndAt, { seconds: 1 }),
                              spotTextFormat,
                            )}
                            {', '}
                            {format(order.bookingStartAt, 'EEEE, LLL dd, Y')}
                          </td>
                          {isAfter(order.bookingStartAt, new Date()) && (
                            <td>
                              <button
                                onClick={() => onDeclineOrder(order.id)}
                                className="text-xs dark:text-red-300 text-red-500"
                              >
                                Cancel
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="relative flex flex-col min-w-0 break-words bg-gray-50 dark:bg-gray-800 w-full shadow-lg rounded">
              <div className="rounded-t mb-0 px-0 border-0">
                <div className="flex flex-wrap items-center px-4 py-2">
                  <div className="relative w-full max-w-full flex-grow flex-1">
                    <h3 className="font-semibold text-base text-gray-900 dark:text-gray-50">
                      Last Activity
                    </h3>
                  </div>
                </div>
                <div className="block w-full">
                  {activities &&
                    Object.keys(activities)
                      .map(Number)
                      .sort()
                      .reverse()
                      .map((day) => (
                        <div key={day}>
                          <div className="px-4 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-100 align-middle border border-solid border-gray-200 dark:border-gray-500 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                            {format(day, 'EEEE, LLL dd, Y')}
                          </div>
                          <ul className="my-1">
                            {activities?.[day]?.map((activity) => (
                              <li
                                key={activity.id}
                                className="flex px-4  border-b last:border-b-0 border-gray-100 dark:border-gray-400"
                              >
                                <Activity activity={activity} />
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="w-full overflow-hidden rounded-lg shadow-xs">
              <div className="w-full overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800">
                      <th className="px-4 py-3">Station</th>
                      <th className="px-4 py-3">Queue</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800">
                    {stations?.map((station) => (
                      <tr
                        key={station.id}
                        className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-400"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center text-sm">
                            <div className="relative hidden w-8 h-8 mr-3 rounded-full md:block">
                              <img
                                className="object-cover w-full h-full rounded-full"
                                src="https://c8.alamy.com/comp/2BKNYTB/vector-illustration-of-monitor-computer-icon-or-logo-with-black-color-and-line-design-style-2BKNYTB.jpg"
                                alt=""
                                loading="lazy"
                              />
                              <div
                                className="absolute inset-0 rounded-full shadow-inner"
                                aria-hidden="true"
                              ></div>
                            </div>
                            <div>
                              <p className="font-semibold">{station.name}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {station.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{station.queue}</td>
                        <td className="px-4 py-3 text-xs">
                          <span
                            className={`px-2 py-1 font-semibold leading-tight text-green-700 rounded-full ${
                              stationStatusMapper[station.status].color
                            }`}
                          >
                            {' '}
                            {stationStatusMapper[station.status].text}{' '}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => showBookModal(station)}
                            disabled={station.status === 'INACTIVE'}
                            className="px-3 py-1 text-white dark:text-gray-800 transition-colors duration-150 bg-blue-600 dark:bg-gray-100 dark:disabled:bg-gray-400 disabled:bg-gray-300 border border-r-0 border-blue-600 disabled:border-gray-300 dark:disabled:border-gray-400 dark:border-gray-100 rounded-md focus:outline-none focus:shadow-outline-purple"
                          >
                            Book
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase border-t dark:border-gray-700 bg-gray-50 sm:grid-cols-9 dark:text-gray-400 dark:bg-gray-800">
                <span className="flex items-center col-span-3">
                  {' '}
                  Stations 1-{stations?.length || 'N/A'} of{' '}
                  {stations?.length || 'N/A'}{' '}
                </span>
                <span className="col-span-2"></span>
                {/* Pagination */}
                <span className="flex col-span-4 mt-2 sm:mt-auto sm:justify-end">
                  <nav aria-label="Table navigation">
                    <ul className="inline-flex items-center">
                      <li>
                        <button
                          className="px-3 py-1 rounded-md rounded-l-lg focus:outline-none focus:shadow-outline-purple"
                          aria-label="Previous"
                        >
                          <svg
                            aria-hidden="true"
                            className="w-4 h-4 fill-current"
                            viewBox="0 0 20 20"
                          >
                            <path
                              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                              clipRule="evenodd"
                              fillRule="evenodd"
                            ></path>
                          </svg>
                        </button>
                      </li>
                      <li>
                        <button className="px-3 py-1 text-white dark:text-gray-800 transition-colors duration-150 bg-blue-600 dark:bg-gray-100 border border-r-0 border-blue-600 dark:border-gray-100 rounded-md focus:outline-none focus:shadow-outline-purple">
                          1
                        </button>
                      </li>
                      {/* <li>
                        <button className="px-3 py-1 rounded-md focus:outline-none focus:shadow-outline-purple">
                          2
                        </button>
                      </li>
                      <li>
                        <button className="px-3 py-1 text-white dark:text-gray-800 transition-colors duration-150 bg-blue-600 dark:bg-gray-100 border border-r-0 border-blue-600 dark:border-gray-100 rounded-md focus:outline-none focus:shadow-outline-purple">
                          3
                        </button>
                      </li>
                      <li>
                        <button className="px-3 py-1 rounded-md focus:outline-none focus:shadow-outline-purple">
                          4
                        </button>
                      </li>
                      <li>
                        <span className="px-3 py-1">...</span>
                      </li>
                      <li>
                        <button className="px-3 py-1 rounded-md focus:outline-none focus:shadow-outline-purple">
                          8
                        </button>
                      </li>
                      <li>
                        <button className="px-3 py-1 rounded-md focus:outline-none focus:shadow-outline-purple">
                          9
                        </button>
                      </li> */}
                      <li>
                        <button
                          className="px-3 py-1 rounded-md rounded-r-lg focus:outline-none focus:shadow-outline-purple"
                          aria-label="Next"
                        >
                          <svg
                            className="w-4 h-4 fill-current"
                            aria-hidden="true"
                            viewBox="0 0 20 20"
                          >
                            <path
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                              fillRule="evenodd"
                            ></path>
                          </svg>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default IndexPage;
