# Research: Real-time Messaging Foundation

**Feature**: 001-messaging-foundation
**Date**: 2025-10-21
**Purpose**: Research technical decisions and best practices for implementation

## Research Topics

### 1. Tauri 1.5+ Architecture & Best Practices

**Decision**: Use Tauri 1.5+ with IPC commands and event system

**Rationale**:
- Lightweight alternative to Electron (< 10MB vs 100MB+)
- Native Rust backend enables high-performance WebSocket client
- Built-in security model with command allowlisting
- Excellent cross-platform support (Windows/macOS/Linux)
- Active community and documentation

**Key Patterns for This Feature**:
- **Commands**: Use `#[tauri::command]` for frontend-to-backend calls (e.g., `send_message`, `connect_to_server`, `get_display_name`)
- **Events**: Use `app.emit()` for backend-to-frontend real-time updates (e.g., `message_received`, `connection_status_changed`)
- **State Management**: Use Tauri's managed state for WebSocket client shared across commands
- **Plugin System**: Use tauri-plugin-store for persistent key-value storage

**Implementation Notes**:
- All async operations must use Tokio runtime (already Tauri's default)
- Commands should return `Result<T, String>` for proper error handling
- Use `window.listen()` in frontend to subscribe to backend events
- Keep commands thin - business logic in separate modules

**Reference**: https://tauri.app/v1/guides/features/command

---

### 2. WebSocket Client with tokio-tungstenite

**Decision**: Use tokio-tungstenite for WebSocket client with manual reconnection logic

**Rationale**:
- Pure Rust async WebSocket implementation
- Integrates seamlessly with Tokio (Tauri's runtime)
- Low-level control needed for custom reconnection logic
- Well-maintained and performant

**Reconnection Strategy**:
```rust
// Exponential backoff pattern
let mut retry_delay = Duration::from_secs(1);
const MAX_DELAY: Duration = Duration::from_secs(30);

loop {
    match connect().await {
        Ok(ws) => {
            retry_delay = Duration::from_secs(1); // Reset on success
            handle_connection(ws).await;
        }
        Err(e) => {
            emit_connection_status("reconnecting").await;
            sleep(retry_delay).await;
            retry_delay = std::cmp::min(retry_delay * 2, MAX_DELAY);
        }
    }
}
```

**Message Protocol**:
```rust
// Client -> Server
{
    "type": "message",
    "displayName": "Alice",
    "content": "Hello!",
    "timestamp": "2025-10-21T10:30:00Z"
}

// Server -> Clients (broadcast)
{
    "type": "message",
    "displayName": "Bob",
    "content": "Hi Alice!",
    "timestamp": "2025-10-21T10:30:05Z"
}

// Heartbeat (every 30s)
{
    "type": "ping"
}
```

**Alternative Considered**: ws-rs - Rejected because tokio-tungstenite has better Tokio integration

**Reference**: https://docs.rs/tokio-tungstenite/latest/tokio_tungstenite/

---

### 3. Zustand State Management Pattern

**Decision**: Use Zustand with separate stores for user, messages, and connection state

**Rationale**:
- Minimal boilerplate compared to Redux
- TypeScript-first design
- No React Context overhead
- Perfect for simple state needs
- Easy to test and debug

**Store Architecture**:

```typescript
// useUserStore.ts
interface UserState {
  displayName: string | null;
  setDisplayName: (name: string) => void;
  clearDisplayName: () => void;
}

// useMessagesStore.ts
interface MessagesState {
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;
}

// useConnectionStore.ts
interface ConnectionState {
  status: 'connected' | 'disconnected' | 'reconnecting';
  setStatus: (status: ConnectionState['status']) => void;
}
```

**Best Practices**:
- Keep stores focused (single responsibility)
- Use immer middleware for nested state updates
- Persist user store with Tauri storage on changes
- Limit message history to 1000 messages (slice oldest)

**Alternative Considered**: Jotai - Rejected because Zustand's simpler API is sufficient for our needs

**Reference**: https://docs.pmnd.rs/zustand/getting-started/introduction

---

### 4. React Virtual Scrolling for Message List

**Decision**: Use react-window for virtual scrolling (deferred to optimization phase if performance is acceptable without it)

**Rationale**:
- Renders only visible messages (critical for 1000+ message history)
- Minimal overhead (< 5KB)
- Maintains scroll position automatically
- Well-tested and maintained

**Implementation Pattern**:
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={messages.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <Message message={messages[index]} style={style} />
  )}
</FixedSizeList>
```

**Performance Target**: Smooth scrolling with 1000 messages, < 100MB memory

**Alternative Considered**: react-virtuoso - Rejected because react-window is simpler and sufficient

**Reference**: https://react-window.vercel.app/

---

### 5. tauri-plugin-store for Display Name Persistence

**Decision**: Use tauri-plugin-store with JSON storage

**Rationale**:
- Official Tauri plugin
- Simple key-value storage
- Cross-platform (uses platform-specific paths)
- Automatic serialization with serde

**Usage Pattern**:
```rust
use tauri_plugin_store::StoreBuilder;

// In setup
let store = StoreBuilder::new(app, "settings.json").build();

// Save display name
store.insert("displayName".to_string(), json!("Alice"))?;
store.save()?;

// Load display name
let name: Option<String> = store.get("displayName")
    .and_then(|v| v.as_str().map(|s| s.to_string()));
```

**Storage Location**:
- Windows: `%APPDATA%/com.beans.chat/settings.json`
- macOS: `~/Library/Application Support/com.beans.chat/settings.json`
- Linux: `~/.config/com.beans.chat/settings.json`

**Alternative Considered**: Custom file I/O - Rejected because plugin handles cross-platform paths correctly

**Reference**: https://github.com/tauri-apps/tauri-plugin-store

---

### 6. WebSocket Server (Node.js + ws)

**Decision**: Use ws library with TypeScript for simple message broadcasting

**Rationale**:
- Lightweight and fast
- Simple API for broadcasting
- Good TypeScript support
- Sufficient for MVP (in-memory only)

**Server Implementation**:
```typescript
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    // Broadcast to all connected clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });
});
```

**Future Considerations** (not in MVP):
- Add authentication/user sessions (Feature 3)
- Add message persistence (Feature 2)
- Add room management (Feature 3)
- Add Redis for horizontal scaling

**Alternative Considered**: socket.io - Rejected because ws is simpler and we don't need socket.io's extra features

**Reference**: https://github.com/websockets/ws

---

### 7. Testing Strategy

**Decision**: Unit tests (Vitest + cargo test), integration tests (message flow), E2E (Tauri WebDriver)

**Test Pyramid**:
- **Unit Tests (70%)**: Zustand stores, Rust WebSocket client logic, reconnection logic
- **Integration Tests (20%)**: WebSocket message flow, storage persistence
- **E2E Tests (10%)**: Critical user flows (setup name, send message, reconnect)

**Tools**:
- **Vitest**: Frontend unit tests (fast, Vite-native)
- **React Testing Library**: Component tests
- **cargo test**: Rust unit/integration tests
- **Tauri WebDriver**: E2E automation

**Key Test Cases**:
1. Display name validation and persistence
2. Message send/receive flow
3. Connection loss detection and auto-reconnect
4. Empty message rejection
5. Window resize maintains layout

**Reference**: https://tauri.app/v1/guides/testing/webdriver/introduction

---

## Summary of Technical Decisions

| Area | Technology | Rationale |
|------|------------|-----------|
| Desktop Framework | Tauri 1.5+ | Lightweight, native performance, cross-platform |
| Frontend | React 18 + TypeScript | Component reusability, strong typing |
| State Management | Zustand | Simple, minimal boilerplate |
| Styling | Tailwind CSS | Utility-first, rapid development |
| WebSocket Client | tokio-tungstenite | Async Rust, Tokio integration |
| Persistence | tauri-plugin-store | Official plugin, cross-platform |
| Server | Node.js + ws | Simple broadcasting, sufficient for MVP |
| Virtual Scrolling | react-window (optional) | Performance with large message lists |
| Testing | Vitest + cargo test | Fast, framework-aligned |

## Open Questions Resolved

1. **Q: Should we use Socket.IO or plain WebSocket?**
   - **A**: Plain WebSocket - simpler protocol, sufficient for broadcasting

2. **Q: How to handle message history limits?**
   - **A**: Client-side: keep latest 1000 messages in memory, slice older ones

3. **Q: Virtual scrolling from the start or optimize later?**
   - **A**: Start with simple scrolling, add react-window if performance degrades

4. **Q: Separate WebSocket server or embed in Tauri?**
   - **A**: Separate Node.js server - easier to test with multiple clients, clearer separation

5. **Q: How to structure Zustand stores?**
   - **A**: Three separate stores (user, messages, connection) - single responsibility, easier to test

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| WebSocket connection instability | High | Exponential backoff reconnection, connection status UI |
| Memory usage exceeds 100MB with large message history | Medium | Limit to 1000 messages, implement virtual scrolling |
| Cross-platform UI inconsistencies | Medium | Test on all platforms, use Tauri's CSS reset |
| Server becomes bottleneck with many clients | Low (MVP) | Document for future: consider Redis pub/sub, horizontal scaling |

## Next Steps

Phase 1 will produce:
1. `data-model.md` - Entity definitions (User Identity, Message, Connection State, Chat Room)
2. `contracts/` - WebSocket message protocol specification
3. `quickstart.md` - Development setup and running instructions
4. Agent context file update (CLAUDE.md or equivalent)
