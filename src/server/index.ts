import 'dotenv-flow/config';
import { createContext } from './context';
import { appRouter } from './routers/_app';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import http from 'http';
import next from 'next';
import { parse } from 'url';
import ws from 'ws';

import { bootstrap } from '~/server/bootstrap';
import { env } from '~/server/env';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';

async function main() {
  await bootstrap(env);
  const wsUrl = new URL(env.WS_URL);

  const server = http.createServer();

  const app = next({
    dev,
    customServer: true,
    port,
  });
  const handle = app.getRequestHandler();
  await app.prepare();

  const wss = new ws.Server({ noServer: true, path: wsUrl.pathname });
  const handler = applyWSSHandler({ wss, router: appRouter, createContext });

  server.addListener('request', (req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  server.listen(port);

  server.on('upgrade', (req, socket, head) => {
    const { pathname } = parse(req.url!);
    switch (pathname) {
      case wsUrl.pathname:
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req);
        });
        return;
      case '/_next/webpack-hmr': // next hrm internal handler will process
        return;
      default:
        socket.destroy();
    }
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM');
    handler.broadcastReconnectNotification();
  });

  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? 'development' : process.env.NODE_ENV
    }`,
  );
}

main();
