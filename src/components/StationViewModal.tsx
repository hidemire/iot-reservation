import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { differenceInSeconds } from 'date-fns';
import NiceModal, { useModal } from '@ebay/nice-modal-react';

import { Client } from 'ion-sdk-js';
import { IonSFUJSONRPCSignal } from 'ion-sdk-js/lib/signal/json-rpc-impl';

import { trpc } from '~/utils/trpc';
import { publicRuntimeConfig } from '~/utils/publicRuntimeConfig';

const ONE_MINUTE = 60;

export const StationViewModal = NiceModal.create(
  ({ orderId }: { orderId: string }) => {
    const modal = useModal();
    const utils = trpc.useContext();
    const [isVideoAvailable, setIsVideoAvailable] = useState(false);
    const [isSignalReady, setIsSignalReady] = useState(false);
    const [timerText, setTimerText] = useState('-');
    const videoElement = useRef<HTMLVideoElement>(null);

    const { data: orderInfo } = trpc.useQuery(['order.info', { orderId }]);

    const signalLocal = useMemo(
      () => new IonSFUJSONRPCSignal(publicRuntimeConfig.ION_SFU_URL),
      [],
    );

    useEffect(() => {
      signalLocal.onopen = () => {
        setIsSignalReady(true);
      };
    }, []);

    const clientLocal = useMemo(
      () =>
        new Client(signalLocal, {
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
          codec: 'vp8',
        }),
      [signalLocal],
    );

    useEffect(() => {
      if (videoElement.current) {
        clientLocal.ontrack = (track, stream) => {
          console.log('got track', track.id, 'for stream', stream.id);
          track.onunmute = () => {
            videoElement.current!.srcObject = stream;
            videoElement.current!.autoplay = true;
            setIsVideoAvailable(true);
          };
          stream.onremovetrack = () => {
            videoElement.current!.srcObject = null;
            setIsVideoAvailable(false);
          };
        };
      }
    }, [videoElement.current]);

    useEffect(() => {
      console.log(videoElement.current, isSignalReady);
      if (videoElement.current && isSignalReady && orderInfo) {
        clientLocal.join(orderInfo.station.id, Math.random().toString());
      }
      return () => {
        console.log('leave', isSignalReady);
        if (isSignalReady) {
          clientLocal.leave();
          signalLocal.close();
        }
      };
    }, [videoElement, clientLocal, signalLocal, isSignalReady, orderInfo]);

    const updateTimerText = useCallback(() => {
      if (!orderInfo) return;
      const diffInSeconds = differenceInSeconds(
        orderInfo.order.bookingEndAt,
        new Date(),
      );
      if (diffInSeconds < 1) {
        utils.invalidateQueries(['order.active']).then(() => modal.remove());
        return;
      }
      const minutes = Math.floor(diffInSeconds / ONE_MINUTE);
      const seconds = diffInSeconds - minutes * ONE_MINUTE;

      setTimerText(`${minutes}:${('0' + seconds).slice(-2)}`);
    }, [orderInfo, modal]);

    useEffect(() => {
      updateTimerText();
      const timer = setInterval(() => {
        updateTimerText();
      }, 1000);
      return () => clearInterval(timer);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [updateTimerText]);

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
                {orderInfo?.station.name}
              </p>
              <div className="flex mb-3 ">
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
                <p className="font-semibold text-gray-800 flex-shrink-0 dark:text-gray-50">
                  {timerText}
                </p>
              </div>
              {orderInfo?.station.connectionConfig.map(
                ({ host, port }, index) => (
                  <div key={index} className="flex mb-3">
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
                        d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                      />
                    </svg>
                    <p className="font-semibold text-gray-800 dark:text-gray-50">
                      {host}:{port}
                    </p>
                  </div>
                ),
              )}
              <p className="font-semibold text-sm text-white">
                {orderInfo?.station.description}
              </p>
            </div>
            {!isVideoAvailable && (
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
                  <div className="text-center font-semibold text-2xl text-gray-800 dark:text-gray-50">
                    Video is temporarily unavailable
                  </div>
                </div>
              </div>
            )}
            <div className={`${!isVideoAvailable && 'hidden'}`}>
              <video ref={videoElement} className="bg-black h-full"></video>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
