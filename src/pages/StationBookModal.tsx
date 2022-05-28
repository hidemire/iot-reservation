import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, isEqual, add } from 'date-fns';

type TimeSpot = {
  startTime: Date;
  status: 'available' | 'booked';
};

const spotTextFormat = 'kk:mm';
const sessionDurationMin = 15;

const StationBookModal = () => {
  const [isTImeSpotConfirmed, setIsTimeSpotConfirmed] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [selectedTimeSpot, setSelectedTimeSpot] = useState<TimeSpot>();

  const today = new Date();
  const weekAfter = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 7,
  );

  const timeSpots: TimeSpot[] = [
    { startTime: new Date(2022, 5, 28, 10, 0), status: 'available' },
    { startTime: new Date(2022, 5, 28, 10, 15), status: 'available' },
    { startTime: new Date(2022, 5, 28, 10, 30), status: 'booked' },
    { startTime: new Date(2022, 5, 28, 10, 45), status: 'available' },
    { startTime: new Date(2022, 5, 28, 11, 0), status: 'available' },
    { startTime: new Date(2022, 5, 28, 11, 15), status: 'available' },
    { startTime: new Date(2022, 5, 28, 11, 30), status: 'available' },
  ];

  const onSelectDay = (day: Date) => {
    setSelectedDay(day);
    setSelectedTimeSpot(undefined);
  };

  return (
    <div className="flex justify-center h-screen items-center bg-gray-200 antialiased  border-gray-200">
      <div className="w-4/5 max-w-7xl h-[90vh] flex flex-col lg:flex-row border rounded-xl bg-white">
        <div className="flex flex-col justify-start items-center p-6 lg:basis-2/5 border-b lg:border-r border-gray-300 lg:items-start">
          <div className="relative w-full">
            <button className="mb-3 absolute lg:static">
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
          <p className="mb-3 font-semibold text-2xl text-gray-800">
            Станція №1
          </p>
          <div className="flex mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2"
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
            <p className="font-semibold text-gray-800">
              {sessionDurationMin} min
            </p>
          </div>
          {isTImeSpotConfirmed && (
            <div className="flex mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2"
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
              <p className="font-semibold text-gray-800">
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
          <p className="font-semibold text-sm text-gray-700">Опис станції</p>
        </div>
        {!isTImeSpotConfirmed && (
          <div className="p-6 w-full flex flex-col sm:flex-row overflow-auto">
            <div className="flex-auto">
              <DayPicker
                className="book-date-picker"
                mode="single"
                selected={selectedDay}
                modifiersClassNames={{
                  range_middle: 'f',
                  outside: 'b',
                  month: 'g',
                }}
                onSelect={(day) => day && onSelectDay(day)}
                disabled={[{ before: today }, { after: weekAfter }]}
              />
            </div>
            <div className="flex flex-col w-full overflow-auto sm:max-w-[270px] sm:basis-1/3 no-scrollbar">
              <p className="mb-3">{format(selectedDay, 'PPP')}</p>
              {timeSpots.map((timeSpot) =>
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
                    className="text-center p-3 border rounded-md text-blue-500 font-bold border-blue-500 mb-3 last:mb-0 disabled:border-gray-600 disabled:text-gray-600"
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
                className="h-0 absolute"
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
              <button className="h-12 border rounded-md text-white bg-blue-500 font-bold border-blue-500">
                confirm
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StationBookModal;
