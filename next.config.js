// @ts-check
/* eslint-disable @typescript-eslint/no-var-requires */
const { env } = require('./src/server/env');

/**
 * Don't be scared of the generics here.
 * All they do is to give us autocompletion when using this.
 *
 * @template {import('next').NextConfig} T
 * @param {T} config - A generic parameter that flows through to the return type
 * @constraint {{import('next').NextConfig}}
 */
function getConfig(config) {
  return config;
}

/**
 * @link https://nextjs.org/docs/api-reference/next.config.js/introduction
 */
module.exports = getConfig({
  /**
   * Dynamic configuration available for the browser and server.
   * Note: requires `ssr: true` or a `getInitialProps` in `_app.tsx`
   * @link https://nextjs.org/docs/api-reference/next.config.js/runtime-configuration
   */
  serverRuntimeConfig: {
    DATABASE_URL: env.DATABASE_URL,
    EMAIL_DOMAINS_WHITELIST: env.EMAIL_DOMAINS_WHITELIST,
    GOOGLE_ID: env.GOOGLE_ID,
    GOOGLE_SECRET: env.GOOGLE_SECRET,
    JWT_SECRET: env.JWT_SECRET,
    REDIS_CONNECTION_URL: env.REDIS_CONNECTION_URL,
  },

  publicRuntimeConfig: {
    NODE_ENV: env.NODE_ENV,
    APP_URL: env.APP_URL,
    WS_URL: env.WS_URL,
    TRAEFIK_PUBLIC_HOST: env.TRAEFIK_PUBLIC_HOST,
  },
});
