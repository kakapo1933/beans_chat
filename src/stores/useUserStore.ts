import { create } from 'zustand';

interface UserState {
  displayName: string | null;
  setDisplayName: (name: string) => void;
  clearDisplayName: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  displayName: null,
  setDisplayName: (name) => set({ displayName: name }),
  clearDisplayName: () => set({ displayName: null }),
}));
