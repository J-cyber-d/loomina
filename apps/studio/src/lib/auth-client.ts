import { createAuthClient } from 'better-auth/react';
import { organizationClient, adminClient } from 'better-auth/client/plugins';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  plugins: [organizationClient(), adminClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  organization,
} = authClient;
