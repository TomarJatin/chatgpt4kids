import type { NextAuthConfig } from 'next-auth';

import { URL_NEW_CHAT } from '@/lib/urls';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    newUser: '/',
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      console.log(`next-auth: loggedIn=${isLoggedIn ? '1' : '0'} | '${nextUrl.toString()}'`);

      const isOnChat = nextUrl.pathname.startsWith(URL_NEW_CHAT);
      const isOnRegister = nextUrl.pathname.startsWith('/register');
      const isOnLogin = nextUrl.pathname.startsWith('/login');

      if (isLoggedIn && (isOnLogin || isOnRegister)) {
        console.log(`next-auth: redirecting to ${URL_NEW_CHAT} 1`);
        return Response.redirect(new URL(URL_NEW_CHAT, nextUrl as unknown as URL));
      }

      if (isOnRegister || isOnLogin) {
        return true; // Always allow access to register and login pages
      }

      if (isOnChat) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }

      // if (isLoggedIn) {
      //   console.log(`next-auth: redirecting to ${URL_NEW_CHAT} 2`);
      //   return Response.redirect(new URL(URL_NEW_CHAT, nextUrl as unknown as URL));
      // }

      return true;
    },
  },
};
