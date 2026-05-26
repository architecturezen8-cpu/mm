import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getEnv } from '@/lib/cf-env';

// Get NEXTAUTH_SECRET from Cloudflare env or fallback to dev default
const NEXTAUTH_SECRET = getEnv('NEXTAUTH_SECRET') || 'battle-of-the-golds-dev-secret-key-2024-min32chars';
const ADMIN_EMAILS = ['admin@thomiansmedia.com'];
const envAllowedEmails = getEnv('ADMIN_ALLOWED_EMAILS')?.split(',').map(e => e.trim()).filter(Boolean) ?? [];
const allowedEmails = envAllowedEmails.length > 0 ? envAllowedEmails : ADMIN_EMAILS;

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: getEnv('GOOGLE_CLIENT_ID') || 'placeholder-google-client-id',
      clientSecret: getEnv('GOOGLE_CLIENT_SECRET') || 'placeholder-google-client-secret',
    }),
    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Allow login with allowed emails + password "admin123"
        if (allowedEmails.includes(credentials.email) && credentials.password === 'admin123') {
          return {
            id: '1',
            email: credentials.email,
            name: credentials.email.split('@')[0],
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return false;
      if (allowedEmails.length === 0) return true;
      return allowedEmails.includes(user.email);
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || '';
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  session: { strategy: 'jwt' },
  secret: NEXTAUTH_SECRET,
  debug: false,
};
