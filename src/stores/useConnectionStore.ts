import { create } from 'zustand';
import { ConnectionState } from '../types';

interface ConnectionStoreState {
  status: ConnectionState;
  setStatus: (status: ConnectionState) => void;
}

export const useConnectionStore = create<ConnectionStoreState>((set) => ({
  status: 'disconnected',
  setStatus: (status) => set({ status }),
}));
