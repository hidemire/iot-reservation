import { useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';

import { Client, LocalStream } from 'ion-sdk-js';
import { IonSFUJSONRPCSignal } from 'ion-sdk-js/lib/signal/json-rpc-impl';

import { publicRuntimeConfig } from '~/utils/publicRuntimeConfig';

export const VideoStreamer = () => {
  const router = useRouter();
  const videoElement = useRef<HTMLVideoElement>(null);

  const signalLocal = useMemo(
    () => new IonSFUJSONRPCSignal(publicRuntimeConfig.ION_SFU_URL),
    [],
  );
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
        };
        stream.onremovetrack = () => {
          videoElement.current!.srcObject = null;
        };
      };
    }
  }, [videoElement.current]);

  const { id: stationId } = router.query;
  if (!stationId)
    return (
      <div>
        Station id must be provided <code>/station-video?id=123</code>
      </div>
    );

  const startPublishVideo = () => {
    clientLocal.join('test', Math.random().toString());
    LocalStream.getUserMedia({
      resolution: 'fhd',
      audio: false,
      codec: 'vp8',
    })
      .then((media) => {
        videoElement.current!.srcObject = media;
        videoElement.current!.autoplay = true;
        videoElement.current!.controls = true;
        videoElement.current!.muted = true;
        clientLocal.publish(media);
      })
      .catch(console.error);
  };

  return (
    <div className="flex flex-col h-screen relative">
      <header className="flex h-16 justify-center items-center text-xl bg-gray-600 text-white">
        <div onClick={() => clientLocal.join('test', Math.random().toString())}>
          Station video streamer
        </div>
        <div className="absolute top-2 right-5">
          <button
            onClick={() => startPublishVideo()}
            // disabled={!videoElement.current}
            className="bg-blue-500 px-4 py-2 text-white rounded-lg mr-5"
          >
            Publish Video
          </button>
          <button className="bg-green-500 px-4 py-2 text-white rounded-lg">
            Publish Screen
          </button>
        </div>
      </header>
      <video className="bg-black h-full" ref={videoElement}></video>
    </div>
  );
};
