import dynamic from 'next/dynamic';
import { NextPageWithLayout } from './_app';

const VideoStreamer = dynamic(
  async () => {
    const m = await import('~/components/VideoStreamer');
    return m.VideoStreamer;
  },
  {
    ssr: false,
  },
);

const StationVideoPage: NextPageWithLayout = () => {
  return <VideoStreamer />;
};

export default StationVideoPage;
