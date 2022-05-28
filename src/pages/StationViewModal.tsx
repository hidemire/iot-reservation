import { useState, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';

type TimeSpot = {
  startTime: Date;
  status: 'available' | 'booked';
};

const ONE_MINUTE = 60;

const StationViewModal = () => {
  const [selectedTimeSpot, setSelectedTimeSpot] = useState<TimeSpot>({
    startTime: new Date(2022, 4, 28, 18, 0),
    status: 'available',
  });

  const [timerText, setTimerText] = useState('-');

  useEffect(() => {
    const timer = setInterval(() => {
      const diffInSeconds = differenceInSeconds(
        selectedTimeSpot.startTime,
        new Date(),
      );
      const minutes = Math.floor(diffInSeconds / ONE_MINUTE);
      const seconds = diffInSeconds - minutes * ONE_MINUTE;

      setTimerText(`${minutes}:${('0' + seconds).slice(-2)}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedTimeSpot.startTime]);

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
            Station №1
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
            <p className="font-semibold text-gray-800 flex-shrink-0">
              {timerText}
            </p>
          </div>
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
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
              />
            </svg>
            <p className="font-semibold text-gray-800">192.168.0.1:6:5555</p>
          </div>
          <p className="font-semibold text-sm text-gray-700">
            Station description
          </p>
        </div>
        <div className="p-6 w-full flex flex-auto flex-col sm:flex-row overflow-auto justify-center items-center">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="text-yellow-500 w-60 h-60 m-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="0.7"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="text-center font-semibold text-2xl text-gray-800">
              Video is temporarily unavailable
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StationViewModal;
