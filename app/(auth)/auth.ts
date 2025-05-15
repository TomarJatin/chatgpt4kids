import { compare } from 'bcrypt-ts';
import NextAuth, { type User, type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { JWT } from "next-auth/jwt";
import { getUser,getPersonasByUserId, createPersona } from '@/lib/db/queries';

import { authConfig } from './auth.config';
import { generateUUID } from '@/lib/utils';


interface ExtendedSession extends Session {
  user: User & { parentPersonaId?: string | null } ;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email);
        if (users.length === 0) return null;
        // biome-ignore lint: Forbidden non-null assertion.
        const passwordsMatch = await compare(password, users[0].password!);
        if (!passwordsMatch) return null;
        return users[0] as any;
      },
    }),
  ],
  callbacks: {
    async jwt({
      token,
      user,
    }): Promise<JWT> {
      // if we have a freshly signed-in user, record their ID
      if (user) {
        token.id = user.id
      }

      // once we know who they are, ensure they have a parent persona
      if (token.id) {
        let personas = await getPersonasByUserId(token.id as string)
        let parent = personas.find(
          (p) => p.type === 'parent' && p.parentPersonaId === null
        )

        if (!parent) {
          // auto-create default parent
          parent = await createPersona({
            id: generateUUID(),
            userId: token.id as string,
            displayName: 'Parent',
            type: 'parent',
            avatar: null,
            pinHash: null,
            parentPersonaId: null,
          })
        }

        token.parentPersonaId = (parent && typeof parent.id === 'string') ? parent.id : null;
      }

      return token;
    },
    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: any;
    }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.parentPersonaId = token.parentPersonaId as string
      }

      return session;
    },
  },
});

/* example:
import { compare } from "bcrypt-ts";
import NextAuth, { type User as NextAuthUser, type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { getUser } from "@/lib/db/queries";

import { authConfig } from "./auth.config";

// type DrizzleUser = Awaited<ReturnType<typeof getUser>>[number];

type SessionRequiredUser = Session & Required<Pick<Session, "user">>;
interface ExtendedSession extends SessionRequiredUser {
  // extra_fields: {
  //   drizzle: {
  //     user: Pick<DrizzleUser, "stripeStatusPaid">;
  //   };
  // };
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        console.log("authorize-email", email);
        console.log("authorize-password", password);
        const users = await getUser(email);
        if (users.length === 0) return null;
        const user = users[0]!;
        // biome-ignore lint: Forbidden non-null assertion.
        const passwordsMatch = await compare(password, user.password!);
        if (!passwordsMatch) return null;
        // return user;
        return {
          id: user.id,
          email: user.email,
          stripeStatusPaid: user.stripeStatusPaid,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log("jwt-token", token);
      console.log("jwt-user", user);

      if (user) {
        token.id = user.id;
        token.stripeStatusPaid = user.stripeStatusPaid;
      }

      return token;
    },
    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: any;
    }) {
      console.log("session-session", session);
      console.log("session-token", token);
      if (session.user) {
        session.user.id = token.id as string;
        // @ts-expect-error
        session.user.stripeStatusPaid = token.stripeStatusPaid as boolean;
      }

      return session;
    },
  },
});

next-auth: loggedIn=0 | 'http://localhost:3000/login'
authorize-email holden.nolan@gmail.com
authorize-password abc123
jwt-token {
  name: undefined,
  email: 'holden.nolan@gmail.com',
  picture: undefined,
  sub: 'a98b6b5f-b5d4-4ece-9f23-74f70738437f'
}
jwt-user {
  id: 'a98b6b5f-b5d4-4ece-9f23-74f70738437f',
  email: 'holden.nolan@gmail.com',
  stripeStatusPaid: false
}
 POST /login 200 in 1066ms
next-auth: loggedIn=1 | 'http://localhost:3000/login'
next-auth: redirecting to /chat/new 1
next-auth: loggedIn=1 | 'http://localhost:3000/chat/new'
 ○ Compiling /chat/new ...
 ✓ Compiled /chat/new in 2.6s
jwt-token {
  email: 'holden.nolan@gmail.com',
  sub: 'a98b6b5f-b5d4-4ece-9f23-74f70738437f',
  id: 'a98b6b5f-b5d4-4ece-9f23-74f70738437f',
  iat: 1742076643,
  exp: 1744668643,
  jti: '1ed9c2fc-5c53-4c1a-9426-8a27f574a0db'
}
jwt-user undefined
session-session {
  user: {
    name: undefined,
    email: 'holden.nolan@gmail.com',
    image: undefined
  },
  expires: '2025-04-14T22:10:45.781Z'
}
session-token {
  email: 'holden.nolan@gmail.com',
  sub: 'a98b6b5f-b5d4-4ece-9f23-74f70738437f',
  id: 'a98b6b5f-b5d4-4ece-9f23-74f70738437f',
  iat: 1742076643,
  exp: 1744668643,
  jti: '1ed9c2fc-5c53-4c1a-9426-8a27f574a0db'
}
 GET /chat/new 200 in 2694ms
next-auth: loggedIn=1 | 'http://localhost:3000/login'
next-auth: redirecting to /chat/new 1
next-auth: loggedIn=1 | 'http://localhost:3000/chat/new'
jwt-token {
  email: 'holden.nolan@gmail.com',
  sub: 'a98b6b5f-b5d4-4ece-9f23-74f70738437f',
  id: 'a98b6b5f-b5d4-4ece-9f23-74f70738437f',
  iat: 1742076645,
  exp: 1744668645,
  jti: 'ca950e67-cf2a-442b-a706-8740a686b969'
}
jwt-user undefined
session-session {
  user: {
    name: undefined,
    email: 'holden.nolan@gmail.com',
    image: undefined
  },
  expires: '2025-04-14T22:10:46.051Z'
}
session-token {
  email: 'holden.nolan@gmail.com',
  sub: 'a98b6b5f-b5d4-4ece-9f23-74f70738437f',
  id: 'a98b6b5f-b5d4-4ece-9f23-74f70738437f',
  iat: 1742076645,
  exp: 1744668645,
  jti: 'ca950e67-cf2a-442b-a706-8740a686b969'
}
 GET /chat/new 200 in 322ms
next-auth: loggedIn=1 | 'http://localhost:3000/api/history'
 ○ Compiling /api/history ...
 ✓ Compiled /api/history in 763ms
jwt-token {
  email: 'holden.nolan@gmail.com',
  sub: 'a98b6b5f-b5d4-4ece-9f23-74f70738437f',
  id: 'a98b6b5f-b5d4-4ece-9f23-74f70738437f',
  iat: 1742076645,
  exp: 1744668645,
  jti: '0c1773a5-2896-4a83-ba87-2df284e3cefa'
}
jwt-user undefined
session-session {
  user: {
    name: undefined,
    email: 'holden.nolan@gmail.com',
    image: undefined
  },
  expires: '2025-04-14T22:10:47.195Z'
}
session-token {
  email: 'holden.nolan@gmail.com',
  sub: 'a98b6b5f-b5d4-4ece-9f23-74f70738437f',
  id: 'a98b6b5f-b5d4-4ece-9f23-74f70738437f',
  iat: 1742076645,
  exp: 1744668645,
  jti: '0c1773a5-2896-4a83-ba87-2df284e3cefa'
}
 GET /api/history 200 in 1708ms
next-auth: loggedIn=1 | 'http://localhost:3000/api/history'
jwt-token {
  email: 'holden.nolan@gmail.com',
  sub: 'a98b6b5f-b5d4-4ece-9f23-74f70738437f',
  id: 'a98b6b5f-b5d4-4ece-9f23-74f70738437f',
  iat: 1742076645,
  exp: 1744668645,
  jti: '0c1773a5-2896-4a83-ba87-2df284e3cefa'
}
jwt-user undefined
session-session {
  user: {
    name: undefined,
    email: 'holden.nolan@gmail.com',
    image: undefined
  },
  expires: '2025-04-14T22:10:48.085Z'
}
session-token {
  email: 'holden.nolan@gmail.com',
  sub: 'a98b6b5f-b5d4-4ece-9f23-74f70738437f',
  id: 'a98b6b5f-b5d4-4ece-9f23-74f70738437f',
  iat: 1742076645,
  exp: 1744668645,
  jti: '0c1773a5-2896-4a83-ba87-2df284e3cefa'
}
 GET /api/history 200 in 186ms
next-auth: loggedIn=1 | 'http://localhost:3000/api/history'
jwt-token {
  email: 'holden.nolan@gmail.com',
  sub: 'a98b6b5f-b5d4-4ece-9f23-74f70738437f',
  id: 'a98b6b5f-b5d4-4ece-9f23-74f70738437f',
  iat: 1742076648,
  exp: 1744668648,
  jti: 'c99530fe-acdd-4f81-96f2-048b4cf589b3'
}
jwt-user undefined
session-session {
  user: {
    name: undefined,
    email: 'holden.nolan@gmail.com',
    image: undefined
  },
  expires: '2025-04-14T22:11:14.530Z'
}
session-token {
  email: 'holden.nolan@gmail.com',
  sub: 'a98b6b5f-b5d4-4ece-9f23-74f70738437f',
  id: 'a98b6b5f-b5d4-4ece-9f23-74f70738437f',
  iat: 1742076648,
  exp: 1744668648,
  jti: 'c99530fe-acdd-4f81-96f2-048b4cf589b3'
}
*/
