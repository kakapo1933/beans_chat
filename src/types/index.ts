// User identity
export interface UserIdentity {
  displayName: string;
}

// Chat message
export interface Message {
  id: string;
  displayName: string;
  content: string;
  timestamp: string; // ISO 8601
  isSelf?: boolean; // Derived on client by comparing displayName
}

// Connection state
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

// Chat room
export interface ChatRoom {
  id: string;
  name: string;
}

// WebSocket message types
export interface WSMessage {
  type: 'message' | 'ping' | 'pong';
}

export interface ChatMessage extends WSMessage {
  type: 'message';
  id: string;
  displayName: string;
  content: string;
  timestamp: string;
}

export interface PingMessage extends WSMessage {
  type: 'ping';
}

export interface PongMessage extends WSMessage {
  type: 'pong';
}

// Default room constant
export const DEFAULT_ROOM: ChatRoom = {
  id: 'general',
  name: 'General',
};
