// types/next-auth.d.ts - Updated version
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      isAdmin: boolean; // Add isAdmin to session user type
    } & DefaultSession['user'];
  }
  
  interface User {
    id: string;
    name: string;
    email: string;
    isAdmin: boolean; // Add isAdmin to user type
  }
}