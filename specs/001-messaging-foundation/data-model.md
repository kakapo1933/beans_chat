# Data Model: Real-time Messaging Foundation

**Feature**: 001-messaging-foundation
**Date**: 2025-10-21
**Source**: Extracted from [spec.md](spec.md) functional requirements

## Overview

This feature uses a simple data model with four core entities. All data is stored in-memory on both client and server (no database persistence in MVP).

---

## Entities

### 1. User Identity

**Purpose**: Represents the local user's identity for message attribution

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `displayName` | `string` | 2-20 characters, alphanumeric + spaces/hyphens/underscores only | User's chosen display name |

**Validation Rules** (from FR-002):
- Minimum length: 2 characters
- Maximum length: 20 characters
- Allowed characters: `a-zA-Z0-9 _-` (letters, numbers, space, hyphen, underscore)
- Whitespace: Trim leading/trailing, reject if trimmed result < 2 chars
- Case sensitive: "Alice" and "alice" are different names

**Storage**:
- **Location**: Local persistent storage via tauri-plugin-store (`settings.json`)
- **Lifecycle**: Set once on first run, persists across app restarts
- **Key**: `"displayName"`

**State Transitions**:
```
[No Name] --user enters valid name--> [Name Set]
[Name Set] --app restart--> [Name Set] (loaded from storage)
```

**Rust Type**:
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserIdentity {
    pub display_name: String,
}
```

**TypeScript Type**:
```typescript
interface UserIdentity {
  displayName: string;
}
```

---

### 2. Message

**Purpose**: Represents a single chat message sent by any user

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `string` | UUID v4 | Unique message identifier (generated client-side) |
| `displayName` | `string` | 2-20 characters | Sender's display name |
| `content` | `string` | 1-5000 characters | Message text content |
| `timestamp` | `string` (ISO 8601) | UTC datetime | When message was sent |
| `isSelf` | `boolean` (client only) | - | True if sent by current user (derived, not transmitted) |

**Validation Rules** (from FR-004, FR-020):
- Content: Cannot be empty or whitespace-only
- Content: Maximum 5000 characters
- Timestamp: Must be valid ISO 8601 format (e.g., `2025-10-21T10:30:00.000Z`)

**Ordering** (from FR-007):
- Messages ordered chronologically by `timestamp` field
- Server broadcasts preserve send order
- Client displays in ascending timestamp order

**Memory Management**:
- Client maintains max 1000 messages in memory
- When limit reached, oldest messages are removed (FIFO)
- No persistence; messages lost on app restart

**Rust Type**:
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: String,
    pub display_name: String,
    pub content: String,
    pub timestamp: String, // ISO 8601
}
```

**TypeScript Type**:
```typescript
interface Message {
  id: string;
  displayName: string;
  content: string;
  timestamp: string; // ISO 8601
  isSelf?: boolean; // Derived on client
}
```

---

### 3. Connection State

**Purpose**: Tracks WebSocket connection status for UI feedback

**Possible States**:

| State | Description | User Visible | Message Sending Allowed |
|-------|-------------|--------------|------------------------|
| `connecting` | Initial connection attempt in progress | "Connecting..." | No |
| `connected` | WebSocket connected and ready | "Connected" (green) | Yes |
| `disconnected` | Connection lost, not attempting to reconnect yet | "Disconnected" (red) | No |
| `reconnecting` | Attempting to reconnect with exponential backoff | "Reconnecting..." (yellow) | No |

**State Transitions** (from FR-010, FR-011):
```
[connecting] --success--> [connected]
[connecting] --failure--> [reconnecting]
[connected] --disconnect detected--> [reconnecting]
[reconnecting] --success--> [connected]
[reconnecting] --continues--> [reconnecting] (with increasing delay)
```

**Reconnection Behavior** (from FR-011):
- Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (max)
- Indefinite retries at max interval until connected

**Storage**:
- In-memory only (not persisted)
- Managed in Zustand store on client
- Rust state tracks actual WebSocket connection

**Rust Type**:
```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ConnectionState {
    Connecting,
    Connected,
    Disconnected,
    Reconnecting,
}
```

**TypeScript Type**:
```typescript
type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
```

---

### 4. Chat Room

**Purpose**: Logical grouping for messages (single room in MVP)

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `string` | Hard-coded: `"general"` | Room identifier |
| `name` | `string` | Hard-coded: `"General"` | Display name for room |

**Behavior**:
- Single room only in MVP (no room switching)
- All messages sent to this room
- All connected clients in this room

**Future Expansion** (deferred to Feature 3):
- Multiple rooms with IDs
- Room join/leave actions
- Room-specific message history
- User count per room

**Rust Type**:
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatRoom {
    pub id: String,
    pub name: String,
}

// Hardcoded constant
pub const DEFAULT_ROOM: ChatRoom = ChatRoom {
    id: "general".to_string(),
    name: "General".to_string(),
};
```

**TypeScript Type**:
```typescript
interface ChatRoom {
  id: string;
  name: string;
}

// Hardcoded constant
export const DEFAULT_ROOM: ChatRoom = {
  id: 'general',
  name: 'General',
};
```

---

## Entity Relationships

```
┌─────────────────┐
│  User Identity  │ (1) Local user's display name
│  (Persistent)   │
└─────────────────┘
         │
         │ displayName used in
         ▼
┌─────────────────┐
│    Message      │ (0..1000) In-memory message history
│  (In-Memory)    │
└─────────────────┘
         │
         │ belongs to
         ▼
┌─────────────────┐
│   Chat Room     │ (1) Single hardcoded room
│  (Hardcoded)    │
└─────────────────┘

┌─────────────────┐
│Connection State │ (1) Current WebSocket status
│  (In-Memory)    │
└─────────────────┘
```

**Relationships**:
1. User Identity (1) --> Messages (0..*): User's display name appears in each sent message
2. Messages (0..*) --> Chat Room (1): All messages belong to the default room
3. Connection State (1): Independent, represents WebSocket status

**Data Flow**:
1. User sets `displayName` → persisted in tauri-plugin-store
2. User sends message → `Message` created with `displayName` + content + timestamp
3. `Message` sent via WebSocket → server broadcasts to all clients
4. Other clients receive `Message` → added to in-memory message list
5. `ConnectionState` updated based on WebSocket events

---

## Storage Summary

| Entity | Storage Type | Location | Lifecycle |
|--------|--------------|----------|-----------|
| User Identity | Persistent (JSON) | tauri-plugin-store (`settings.json`) | Survives app restarts |
| Message | In-memory (Zustand) | Frontend state | Lost on app restart, max 1000 |
| Connection State | In-memory (Zustand) | Frontend state | Lost on app restart |
| Chat Room | Hardcoded constant | Source code | N/A |

---

## Validation Summary

Validation rules enforced at multiple layers:

**Frontend (TypeScript)**:
- Display name: length, allowed characters (pre-submit validation)
- Message content: not empty, max length (pre-submit validation)
- UI disables send button when validation fails

**Backend (Rust)**:
- Display name: re-validate before persisting to store
- Message: validate before sending to WebSocket server
- Return descriptive errors for validation failures

**Server (Node.js)**:
- Message structure: ensure all required fields present
- No content validation (trust client validation)
- Broadcast only valid JSON messages

---

## Performance Considerations

**Memory Usage**:
- Max 1000 messages × ~200 bytes/message ≈ 200KB for message history
- User identity: ~50 bytes
- Connection state: ~20 bytes
- **Total**: < 1MB for data structures (well within 100MB limit)

**Message Limits**:
- Client enforces 1000 message history limit
- Older messages automatically removed when limit reached
- No pagination or lazy loading needed in MVP

**Serialization**:
- All entities use `serde` (Rust) and `JSON.stringify` (TypeScript)
- WebSocket messages are JSON-encoded
- Storage uses JSON format via tauri-plugin-store

---

## Future Considerations (Out of Scope for MVP)

1. **Message Persistence** (Feature 2):
   - Add database storage (SQLite via tauri-plugin-sql)
   - Message history across app restarts
   - Offline message queue

2. **Multi-Room Support** (Feature 3):
   - Room entity with ID, name, user list
   - Join/leave room actions
   - Room-specific message history

3. **User Authentication** (Future):
   - Replace display name with authenticated user accounts
   - Add user ID, email, avatar fields
   - Server-side user management

4. **Rich Message Types** (Future):
   - Message type field (text, image, file, etc.)
   - Metadata for attachments
   - Edit/delete operations

---

## References

- Functional Requirements: FR-001 through FR-020 in [spec.md](spec.md)
- Key Entities section in [spec.md](spec.md#key-entities)
- Research decisions in [research.md](research.md)
