import NextAuth from 'next-auth';
import { AppProviders } from 'next-auth/providers';
import GoogleProvider from 'next-auth/providers/google';
import { serverRuntimeConfig } from '~/utils/publicRuntimeConfig';
import { prisma } from '~/server/prisma';

const providers: AppProviders = [];

const { EMAIL_DOMAINS_WHITELIST, GOOGLE_ID, GOOGLE_SECRET } =
  serverRuntimeConfig;

providers.push(
  GoogleProvider({
    clientId: GOOGLE_ID,
    clientSecret: GOOGLE_SECRET,
  }),
);

export default NextAuth({
  // Configure one or more authentication providers
  providers,
  secret: 'process.env.JWT_SECRET',
  callbacks: {
    async signIn({ profile }): Promise<string | boolean> {
      if (
        !profile.email ||
        !EMAIL_DOMAINS_WHITELIST.find((domain) =>
          profile?.email?.endsWith(domain),
        )
      )
        return false;

      await prisma.user.upsert({
        create: { email: profile.email },
        where: { email: profile.email },
        update: {},
      });
      return true;
    },
  },
});
