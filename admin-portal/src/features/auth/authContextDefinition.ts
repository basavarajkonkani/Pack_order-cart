import { createContext } from 'react';
import type { User, UserCredential } from 'firebase/auth';
import type { UserProfile } from '@/types/firestore';

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  /** True once the initial auth state + profile role check has resolved. */
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
