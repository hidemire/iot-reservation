/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-nocheck
const nodemon = require('nodemon');
const config = require('nodemon/lib/config');
const run = require('nodemon/lib/monitor/run');
const utils = require('nodemon/lib/utils');

const clientSignal = 'SIGTERM';
const serverSignal = 'SIGINT';

const nd = nodemon(
  `--watch src --ext .ts,.tsx,js,jsx --signal ${clientSignal} --exec "ts-node -r tsconfig-paths/register --project tsconfig.server.json src/server/index.ts"`,
);

nd.addListener('restart', (files) => {
  const serverChanges = files.find((file) => file.includes('src/server'));
  if (serverChanges) {
    config.signal = serverSignal;
    run.kill(() => {
      utils.log.status('server file changes...');
      config.signal = clientSignal;
    });
  }
});

nd.addListener('log', ({ colour }) => {
  console.log(colour);
});
