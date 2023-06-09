// @ts-check
/* eslint-disable @typescript-eslint/no-var-requires */
const { z } = require('zod');
const envalid = require('envalid');

const env = envalid.cleanEnv(process.env, {
  APP_URL: envalid.url(),
  DATABASE_URL: envalid.url(),
  EMAIL_DOMAINS_WHITELIST: envalid.json(),
  GOOGLE_ID: envalid.str(),
  GOOGLE_SECRET: envalid.str(),
  JWT_SECRET: envalid.str(),
  NODE_ENV: envalid.str({ choices: ['development', 'test', 'production'] }),
  WS_URL: envalid.url(),
  REDIS_CONNECTION_URL: envalid.url(),
  TRAEFIK_PUBLIC_HOST: envalid.host(),
  ION_SFU_URL: envalid.url(),
  NEXTAUTH_URL: envalid.url(),
  TRAEFIK_ENTRY_POINTS: envalid.json(),
  SESSION_DURATION_MIN: envalid.num(),
  PING_DEADLINE_SEC: envalid.num(),
  REPEATABLE_CRON: envalid.str(),
});

const envSchema = z.object({
  EMAIL_DOMAINS_WHITELIST: z.string().array().nonempty(),
  TRAEFIK_ENTRY_POINTS: z.string().array().nonempty(),
});

const parseResult = envSchema.safeParse(env);

if (!parseResult.success) {
  console.error(
    '❌ Invalid environment variables:',
    JSON.stringify(parseResult.error.format(), null, 4),
  );
  process.exit(1);
}

module.exports.env = { ...env, ...parseResult.data };
