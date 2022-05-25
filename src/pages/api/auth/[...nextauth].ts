import NextAuth from 'next-auth';
import { AppProviders } from 'next-auth/providers';
import GoogleProvider from 'next-auth/providers/google';
import { serverRuntimeConfig } from '~/utils/publicRuntimeConfig';

const providers: AppProviders = [];

providers.push(
  GoogleProvider({
    clientId: serverRuntimeConfig.GOOGLE_ID,
    clientSecret: serverRuntimeConfig.GOOGLE_SECRET,
  }),
);

export default NextAuth({
  // Configure one or more authentication providers
  providers,
  secret: 'process.env.JWT_SECRET',
  callbacks: {
    async signIn({ account, profile }): Promise<string | boolean> {
      if (account.provider === 'google') {
        return profile?.email?.endsWith('@lpnu.ua') || false;
      }
      return true;
    },
  },
});
