import { useState } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { DayPicker } from 'react-day-picker';
import { format, isEqual, add, isSameDay } from 'date-fns';

import { TimeSpot } from '~/types';
import { trpc } from '~/utils/trpc';

const spotTextFormat = 'HH:mm';
const sessionDurationMin = 15;

export const StationBookModal = NiceModal.create(
  ({ stationId }: { stationId: string }) => {
    const modal = useModal();
    const utils = trpc.useContext();

    const [isTImeSpotConfirmed, setIsTimeSpotConfirmed] = useState(false);
    const [selectedDay, setSelectedDay] = useState(new Date());
    const [selectedTimeSpot, setSelectedTimeSpot] = useState<TimeSpot>();

    const { data: weekTimeSpots } = trpc.useQuery([
      'station.time-spots',
      { id: stationId },
    ]);

    const createOrder = trpc.useMutation('order.create', {
      async onSuccess() {
        modal.resolve({ selectedDay, selectedTimeSpot });
        modal.remove();
      },
      async onError() {
        setSelectedDay(new Date());
        setSelectedTimeSpot(undefined);
        setIsTimeSpotConfirmed(false);
      },
      async onSettled() {
        await Promise.allSettled([
          utils.invalidateQueries('order.active'),
          utils.invalidateQueries('station.time-spots'),
          utils.invalidateQueries('station.all'),
        ]);
      },
    });

    const timeSpots = weekTimeSpots?.filter((weekTimeSpot) =>
      isSameDay(weekTimeSpot.startTime, selectedDay),
    );

    const onSelectDay = (day: Date) => {
      setSelectedDay(day);
      setSelectedTimeSpot(undefined);
    };

    const onConfirm = () => {
      if (selectedTimeSpot) {
        createOrder.mutate({
          startTime: selectedTimeSpot.startTime,
          stationId,
        });
      }
    };

    return (
      <div className="absolute top-0 left-0 z-30 w-full">
        <div className="flex justify-center h-screen items-center backdrop-blur-sm backdrop-opacity-90 antialiased">
          <div
            onClick={() => modal.remove()}
            className="z-0 w-full h-full absolute top-0"
          ></div>
          <div className="z-30 w-4/5 max-w-7xl h-[90vh] flex flex-col lg:flex-row border rounded-xl bg-white dark:bg-gray-700 dark:border-gray-500">
            <div className="flex flex-col justify-start items-center p-6 lg:basis-2/5 border-b lg:border-r border-gray-200 dark:border-gray-500 lg:items-start">
              <div className="relative w-full">
                <button
                  onClick={() => modal.remove()}
                  className="mb-3 absolute lg:static dark:text-gray-50"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
              </div>
              <p className="mb-3 font-semibold text-2xl text-gray-800 dark:text-gray-50">
                Станція №1
              </p>
              <div className="flex mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2 dark:text-gray-50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="font-semibold text-gray-800 dark:text-gray-50">
                  {sessionDurationMin} min
                </p>
              </div>
              {isTImeSpotConfirmed && (
                <div className="flex mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-2 dark:text-gray-50"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="font-semibold text-gray-800 dark:text-gray-50">
                    {format(selectedTimeSpot?.startTime || 0, spotTextFormat)}
                    {' - '}
                    {format(
                      add(selectedTimeSpot?.startTime || 0, {
                        minutes: sessionDurationMin,
                      }),
                      spotTextFormat,
                    )}
                    {', '}
                    {format(selectedDay, 'EEEE, LLL dd, Y')}
                  </p>
                </div>
              )}
              <p className="font-semibold text-sm text-gray-700">
                Опис станції
              </p>
            </div>
            {!isTImeSpotConfirmed && (
              <div className="p-6 w-full flex flex-col sm:flex-row overflow-auto">
                <div className="flex-auto">
                  <DayPicker
                    className="book-date-picker"
                    mode="single"
                    selected={selectedDay}
                    onSelect={(day) => day && onSelectDay(day)}
                    // disabled={[{ before: today }, { after: weekAfter }]}
                    disabled={(day) =>
                      !weekTimeSpots?.find((timeSpot) =>
                        isSameDay(timeSpot.startTime, day),
                      )
                    }
                  />
                </div>
                <div className="flex flex-col w-full overflow-auto sm:max-w-[270px] sm:basis-1/3 no-scrollbar">
                  <p className="mb-3 dark:text-gray-50">
                    {format(selectedDay, 'PPP')}
                  </p>
                  {timeSpots?.map((timeSpot) =>
                    isEqual(
                      selectedTimeSpot?.startTime || 0,
                      timeSpot.startTime,
                    ) ? (
                      <div
                        key={timeSpot.startTime.toString()}
                        className="flex justify-between text-center mb-3 last:mb-0"
                      >
                        <button
                          onClick={() => setSelectedTimeSpot(undefined)}
                          className="basis-[48%] text-white font-bold border p-3 rounded-md bg-gray-600 border-gray-600"
                        >
                          {format(timeSpot.startTime, spotTextFormat)}
                        </button>
                        <button
                          onClick={() => setIsTimeSpotConfirmed(true)}
                          className="basis-[48%] text-white font-bold border p-3 rounded-md bg-blue-500 border-blue-500"
                        >
                          confirm
                        </button>
                      </div>
                    ) : (
                      <button
                        key={timeSpot.startTime.toString()}
                        onClick={() => setSelectedTimeSpot(timeSpot)}
                        disabled={timeSpot.status !== 'available'}
                        className="text-center p-3 border rounded-md text-blue-500 dark:text-gray-50 font-bold border-blue-500 dark:border-gray-50 mb-3 last:mb-0 disabled:border-gray-600 disabled:text-gray-600 dark:disabled:border-gray-600 dark:disabled:text-gray-600"
                      >
                        {format(timeSpot.startTime, spotTextFormat)}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}
            {isTImeSpotConfirmed && (
              <div className="p-6 w-full h-full">
                <div className="relative w-full">
                  <button
                    className="h-0 absolute dark:text-gray-50"
                    onClick={() => setIsTimeSpotConfirmed(false)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                  </button>
                </div>
                <div className="h-full flex flex-col justify-center">
                  <button
                    onClick={() => onConfirm()}
                    disabled={createOrder.isLoading}
                    className="h-12 border rounded-md text-white bg-blue-500 font-bold border-blue-500 dark:disabled:bg-gray-400 disabled:bg-gray-300 disabled:border-gray-300 dark:disabled:border-gray-400"
                  >
                    confirm
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);
