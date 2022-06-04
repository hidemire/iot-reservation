import NextAuth from 'next-auth';
import { AppProviders } from 'next-auth/providers';
import GoogleProvider from 'next-auth/providers/google';

import { serverRuntimeConfig } from '~/utils/publicRuntimeConfig';
import { getDIContainer } from '~/server/bootstrap';

const providers: AppProviders = [];

const { EMAIL_DOMAINS_WHITELIST, GOOGLE_ID, GOOGLE_SECRET, JWT_SECRET } =
  serverRuntimeConfig;

providers.push(
  GoogleProvider({
    clientId: GOOGLE_ID,
    clientSecret: GOOGLE_SECRET,
  }),
);

export default NextAuth({
  providers,
  secret: JWT_SECRET,
  callbacks: {
    async signIn({ profile }): Promise<string | boolean> {
      if (
        !profile.email ||
        !EMAIL_DOMAINS_WHITELIST.find((domain) =>
          profile?.email?.endsWith(domain),
        )
      )
        return false;

      const prisma = getDIContainer().resolve('db').client;

      await prisma.user.upsert({
        create: { email: profile.email },
        where: { email: profile.email },
        update: {},
      });
      return true;
    },
  },
});
