# WebSocket Protocol Specification

**Feature**: Real-time Messaging Foundation
**Version**: 1.0.0
**Date**: 2025-10-21

## Overview

This document defines the WebSocket message protocol for real-time communication between Beans Chat desktop clients and the message broadcasting server.

**Protocol Characteristics**:
- Text-based (JSON over WebSocket)
- Client initiates connection
- Server broadcasts all messages to all connected clients
- No authentication in MVP
- No message persistence

---

## Connection

### Endpoint

```
ws://localhost:8080
```

**Production Note**: In production, use `wss://` (secure WebSocket) with proper TLS certificates.

### Connection Flow

```
Client                          Server
  |                               |
  |---- WebSocket Handshake ----->|
  |<--- 101 Switching Protocols --|
  |                               |
  |---- ping (heartbeat) -------->|
  |<--- pong -------------------- |
  |                               |
  |---- message ----------------->|
  |<--- broadcast message --------|
  |                               |
```

### Connection Lifecycle

1. **Client Connects**: Initiate WebSocket connection to `ws://localhost:8080`
2. **Server Accepts**: Server accepts connection and adds client to broadcast list
3. **Heartbeat**: Client sends `ping` every 30 seconds, server responds with `pong`
4. **Messages**: Client sends messages, server broadcasts to all clients
5. **Disconnect**: Either party can close connection cleanly

---

## Message Types

All messages are JSON objects with a `type` field.

### 1. Client → Server: Send Message

**Purpose**: Client sends a new chat message

**Message Format**:
```json
{
  "type": "message",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "displayName": "Alice",
  "content": "Hello, everyone!",
  "timestamp": "2025-10-21T10:30:00.000Z"
}
```

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Must be `"message"` |
| `id` | string (UUID v4) | Yes | Unique message identifier (client-generated) |
| `displayName` | string | Yes | Sender's display name (2-20 chars) |
| `content` | string | Yes | Message text (1-5000 chars) |
| `timestamp` | string (ISO 8601) | Yes | UTC timestamp when message was created |

**Validation**:
- `displayName`: 2-20 characters
- `content`: 1-5000 characters, not empty/whitespace-only
- `timestamp`: Valid ISO 8601 format

**Example**:
```json
{
  "type": "message",
  "id": "a7f3c2d1-8b4e-4a9c-b3e2-1f6d5c8a9b0c",
  "displayName": "Bob",
  "content": "Good morning!",
  "timestamp": "2025-10-21T14:45:30.123Z"
}
```

---

### 2. Server → All Clients: Broadcast Message

**Purpose**: Server broadcasts received message to all connected clients (including sender)

**Message Format**: Same as client send message

```json
{
  "type": "message",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "displayName": "Alice",
  "content": "Hello, everyone!",
  "timestamp": "2025-10-21T10:30:00.000Z"
}
```

**Behavior**:
- Server receives message from one client
- Server broadcasts identical message to **all** connected clients
- Clients determine `isSelf` flag locally by comparing `displayName`

**Note**: The server does NOT modify the message (no server timestamp, no validation beyond JSON parsing).

---

### 3. Client → Server: Ping (Heartbeat)

**Purpose**: Keep connection alive, detect connection loss

**Message Format**:
```json
{
  "type": "ping"
}
```

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Must be `"ping"` |

**Frequency**: Client sends every 30 seconds

**Response**: Server responds with `pong` message

---

### 4. Server → Client: Pong (Heartbeat Response)

**Purpose**: Acknowledge client ping

**Message Format**:
```json
{
  "type": "pong"
}
```

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Must be `"pong"` |

---

## Error Handling

### Invalid JSON

**Scenario**: Client sends malformed JSON

**Server Behavior**: Log error, ignore message, do NOT disconnect client

**Example**:
```
Client sends: {invalid json}
Server logs: "Invalid JSON received from client"
Server action: No broadcast, no disconnect
```

### Unknown Message Type

**Scenario**: Client sends JSON with unknown `type` field

**Server Behavior**: Log warning, ignore message

**Example**:
```json
Client sends: {"type": "unknown", "data": "..."}
Server logs: "Unknown message type: unknown"
Server action: No broadcast
```

### Missing Required Fields

**Scenario**: Message missing required fields (e.g., no `displayName`)

**Server Behavior**: Log error, ignore message

**Example**:
```json
Client sends: {"type": "message", "content": "Hello"} // Missing displayName, timestamp, id
Server logs: "Invalid message: missing required fields"
Server action: No broadcast
```

**Note**: Server validation is minimal. Clients are responsible for sending valid messages.

---

## Connection Management

### Client Disconnects

**Scenario**: Client closes connection (app exit, network loss, etc.)

**Server Behavior**:
1. Detect connection close event
2. Remove client from broadcast list
3. Log disconnection

**No Notification**: Other clients are NOT notified of disconnections in MVP

---

### Server Disconnects

**Scenario**: Server shuts down or crashes

**Client Behavior**:
1. Detect connection close/error event
2. Update connection state to `reconnecting`
3. Begin exponential backoff reconnection (1s, 2s, 4s, 8s, 16s, 30s max)
4. Continue retrying indefinitely

---

## Security Considerations (MVP)

**Current (MVP)**:
- No authentication
- No encryption (ws:// not wss://)
- No message validation beyond JSON structure
- No rate limiting
- No abuse prevention

**Production Requirements** (Future):
- Use wss:// with TLS certificates
- Implement authentication (token-based or session-based)
- Add rate limiting (e.g., max 10 messages/second per client)
- Validate message content (profanity filter, max message size)
- Add user session management

---

## Message Flow Examples

### Example 1: Simple Message Exchange

```
Client A connects
Client B connects

Client A sends:
{
  "type": "message",
  "id": "msg-001",
  "displayName": "Alice",
  "content": "Hi Bob!",
  "timestamp": "2025-10-21T10:00:00Z"
}

Server broadcasts to ALL (including Client A):
{
  "type": "message",
  "id": "msg-001",
  "displayName": "Alice",
  "content": "Hi Bob!",
  "timestamp": "2025-10-21T10:00:00Z"
}

Client B sends:
{
  "type": "message",
  "id": "msg-002",
  "displayName": "Bob",
  "content": "Hello Alice!",
  "timestamp": "2025-10-21T10:00:05Z"
}

Server broadcasts to ALL (including Client B):
{
  "type": "message",
  "id": "msg-002",
  "displayName": "Bob",
  "content": "Hello Alice!",
  "timestamp": "2025-10-21T10:00:05Z"
}
```

---

### Example 2: Heartbeat

```
Client sends every 30 seconds:
{
  "type": "ping"
}

Server responds:
{
  "type": "pong"
}
```

---

### Example 3: Connection Loss & Reconnect

```
Client A is connected and chatting
Network disruption occurs

Client A detects WebSocket close event
Client A updates UI: "Reconnecting..."
Client A waits 1 second, attempts reconnect → fails
Client A waits 2 seconds, attempts reconnect → fails
Client A waits 4 seconds, attempts reconnect → succeeds

Client A updates UI: "Connected"
Client A resumes normal operation
```

---

## Protocol Versioning

**Current Version**: 1.0.0

**Future Changes** (when protocol evolves):
- Add `version` field to all messages
- Server checks version, rejects incompatible clients
- Maintain backward compatibility when possible

---

## TypeScript Interfaces (Client)

```typescript
// Base message structure
interface WebSocketMessage {
  type: 'message' | 'ping' | 'pong';
}

// Chat message
interface ChatMessage extends WebSocketMessage {
  type: 'message';
  id: string; // UUID v4
  displayName: string;
  content: string;
  timestamp: string; // ISO 8601
}

// Heartbeat messages
interface PingMessage extends WebSocketMessage {
  type: 'ping';
}

interface PongMessage extends WebSocketMessage {
  type: 'pong';
}

// Union type for all messages
type WSMessage = ChatMessage | PingMessage | PongMessage;
```

---

## Rust Types (Client)

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum WSMessage {
    Message {
        id: String,
        #[serde(rename = "displayName")]
        display_name: String,
        content: String,
        timestamp: String,
    },
    Ping,
    Pong,
}
```

---

## Future Enhancements (Out of Scope for MVP)

1. **User Join/Leave Notifications**:
   ```json
   {"type": "user_joined", "displayName": "Alice"}
   {"type": "user_left", "displayName": "Bob"}
   ```

2. **Typing Indicators**:
   ```json
   {"type": "typing", "displayName": "Alice", "isTyping": true}
   ```

3. **Room Support**:
   ```json
   {"type": "join_room", "roomId": "general"}
   {"type": "leave_room", "roomId": "general"}
   ```

4. **Message Acknowledgments**:
   ```json
   {"type": "ack", "messageId": "msg-001"}
   ```

5. **Server-Generated Timestamps**:
   - Add `serverTimestamp` field
   - Use for authoritative ordering

---

## Testing Recommendations

**Unit Tests**:
- Message serialization/deserialization
- Invalid JSON handling
- Missing field detection

**Integration Tests**:
- Client connects → server accepts
- Client sends message → server broadcasts
- Client disconnects → server removes from list
- Heartbeat flow

**Load Tests**:
- 10-50 concurrent clients
- Rapid message sending (stress test)
- Measure broadcast latency (< 500ms target)

---

## References

- WebSocket RFC 6455: https://tools.ietf.org/html/rfc6455
- ws library documentation: https://github.com/websockets/ws
- tokio-tungstenite: https://docs.rs/tokio-tungstenite
