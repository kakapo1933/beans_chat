# Beans Chat Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-21

## Active Technologies

### Frontend (001-messaging-foundation)
- **React** 18.x with TypeScript 5.x
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **React Query** - Server state management
- **react-window** - Virtual scrolling (optional optimization)
- **Vitest** - Unit testing
- **React Testing Library** - Component testing

### Backend / Tauri (001-messaging-foundation)
- **Rust** 1.75+
- **Tauri** 1.5+ - Desktop framework
- **tokio-tungstenite** - WebSocket client
- **tauri-plugin-store** - Local persistence
- **serde** - Serialization
- **uuid** - Message IDs
- **cargo test** - Testing

### Server (001-messaging-foundation)
- **Node.js** 20+ with TypeScript
- **ws** - WebSocket server library

## Project Structure

```
beans_chat/
├── src-tauri/              # Rust/Tauri backend
│   ├── src/
│   │   ├── main.rs         # Entry point
│   │   ├── commands.rs     # Tauri commands
│   │   ├── websocket/      # WS client + reconnection
│   │   ├── storage.rs      # Display name persistence
│   │   └── models.rs       # Data structures
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── src/                    # React/TypeScript frontend
│   ├── components/         # React components
│   ├── stores/             # Zustand stores (user, messages, connection)
│   ├── services/           # Tauri command wrappers
│   ├── types/              # TypeScript interfaces
│   └── styles/             # Tailwind CSS
│
├── server/                 # WebSocket server (separate process)
│   └── src/
│       ├── index.ts
│       └── websocket-server.ts
│
└── tests/                  # Test suites
    ├── unit/
    ├── integration/
    └── e2e/
```

## Commands

### Development
```bash
# Start WebSocket server (Terminal 1)
cd server && pnpm dev

# Start Tauri dev mode (Terminal 2)
pnpm tauri dev

# Run tests
pnpm test                    # Frontend tests (Vitest)
cd src-tauri && cargo test   # Rust tests
```

### Building
```bash
# Production build
pnpm tauri build

# Debug build
pnpm tauri build --debug
```

### Code Quality
```bash
# Linting
pnpm lint                    # ESLint (frontend)
cd src-tauri && cargo clippy # Rust linter

# Formatting
pnpm format                  # Prettier (frontend)
cd src-tauri && cargo fmt    # Rust formatter
```

## Code Style

### TypeScript
- **Strict mode enabled** (non-negotiable per constitution)
- Use functional components with hooks
- Zustand for state management (no Redux, no Context API for global state)
- Keep components small and focused
- Extract business logic to custom hooks

### Rust
- **Zero clippy warnings** (non-negotiable per constitution)
- **No `.unwrap()` in production code** - use proper error handling
- Use Tokio async/await for all I/O
- Keep Tauri commands thin - logic in separate modules
- Serde for all serialization

### General
- Follow Tauri best practices: commands for frontend→backend, events for backend→frontend
- WebSocket messages are JSON with `type` field (see `contracts/websocket-protocol.md`)
- Performance targets: < 3s startup, < 100MB RAM, < 1% idle CPU (constitution)

## Recent Changes
- **001-messaging-foundation**: Added real-time messaging MVP with user display names, WebSocket communication, auto-reconnection, and basic chat UI

## Feature-Specific Docs

### 001-messaging-foundation
- [Specification](specs/001-messaging-foundation/spec.md) - Requirements and user stories
- [Implementation Plan](specs/001-messaging-foundation/plan.md) - Technical approach
- [Data Model](specs/001-messaging-foundation/data-model.md) - Entity definitions
- [WebSocket Protocol](specs/001-messaging-foundation/contracts/websocket-protocol.md) - Message formats
- [Quickstart Guide](specs/001-messaging-foundation/quickstart.md) - Setup instructions

## Constitution Compliance

All code must comply with [.specify/memory/constitution.md](.specify/memory/constitution.md):
- **Performance First**: < 3s startup, < 100MB RAM, < 1% idle CPU
- **Real-Time Reliability**: < 500ms message latency, exponential backoff reconnection
- **Cross-Platform**: Windows/macOS/Linux tested
- **Code Quality**: TypeScript strict, Rust clippy clean, tests required
- **Tauri Patterns**: Commands, events, plugins

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
