import type { NextAuthConfig } from "next-auth";

import { URL_NEW_CHAT } from "@/lib/urls";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/register",
    newUser: "/",
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      console.log(
        `next-auth: loggedIn=${isLoggedIn ? "1" : "0"} | '${nextUrl.toString()}'`
      );

      if (nextUrl.pathname === "/") {
        return true;
      }

      const isOnRegister = nextUrl.pathname.startsWith("/register");
      const isOnLogin = nextUrl.pathname.startsWith("/login");
      const isAuthPage = isOnRegister || isOnLogin;

      if (isLoggedIn && isAuthPage) {
        console.log(`next-auth: redirecting to ${URL_NEW_CHAT} 1`);
        const callbackUrl = nextUrl.searchParams.get("callbackUrl");
        if (callbackUrl) {
          return Response.redirect(new URL(callbackUrl, nextUrl));
        }
        return Response.redirect(new URL(URL_NEW_CHAT, nextUrl));
      }

      if (isAuthPage) {
        return true; // Always allow access to register and login pages
      }

      if (isLoggedIn) return true;

      // if (nextUrl.pathname.startsWith('/buy')) {
      // }

      return false; // Redirect unauthenticated users to login page

      // if (isLoggedIn) {
      //   console.log(`next-auth: redirecting to ${URL_NEW_CHAT} 2`);
      //   return Response.redirect(new URL(URL_NEW_CHAT, nextUrl));
      // }

      return true;
    },
  },
};
