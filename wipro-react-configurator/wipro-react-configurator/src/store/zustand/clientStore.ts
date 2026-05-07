import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ClientUser {
  id: number;
  name: string;
  email: string;
}

interface ClientState {
  token: string | null;
  user: ClientUser | null;
  logIn: (token: string, user: ClientUser) => void;
  logOut: () => void;
}

export const clientStore = create<ClientState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      logIn: (token, user) => set({ token, user }),
      logOut: () => set({ token: null, user: null }),
    }),
    { name: 'client-auth' }
  )
);
