import type { DefaultSession, User as DefaultUser } from 'next-auth';
import type { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getServerSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user?: {
      id?: string | null; // Ensure user ID is included
      parentPersonaId?: string | null; // Add the parentPersonaId property
    } & DefaultSession['user']; // Keep default properties like name, email, image
  }

  // Optional: If you need to augment the default User model used during sign-in/callbacks
  interface User extends DefaultUser {
     parentPersonaId?: string | null; // Add here too if needed during callbacks
     // Add other custom properties if needed
  }
}

// Optional: If using JWT strategy, augment the JWT type as well
declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id?: string | null; // User ID
    parentPersonaId?: string | null; // Add the parentPersonaId property
    // Add other custom properties stored in the token
  }
}