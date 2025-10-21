import { create } from 'zustand';
import { Message } from '../types';
import { useUserStore } from './useUserStore';

interface MessagesState {
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;
}

const MAX_MESSAGES = 1000;

export const useMessagesStore = create<MessagesState>((set) => ({
  messages: [],

  addMessage: (message) => set((state) => {
    // Set isSelf flag by comparing displayName with current user
    const currentUser = useUserStore.getState().displayName;
    const messageWithSelf = {
      ...message,
      isSelf: message.displayName === currentUser,
    };

    // Add message and maintain max 1000 messages
    const updatedMessages = [...state.messages, messageWithSelf];

    // Slice oldest messages if over limit
    if (updatedMessages.length > MAX_MESSAGES) {
      return {
        messages: updatedMessages.slice(updatedMessages.length - MAX_MESSAGES),
      };
    }

    return { messages: updatedMessages };
  }),

  clearMessages: () => set({ messages: [] }),
}));
