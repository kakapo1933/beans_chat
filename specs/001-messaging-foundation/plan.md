# Implementation Plan: Real-time Messaging Foundation

**Branch**: `001-messaging-foundation` | **Date**: 2025-10-21 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-messaging-foundation/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a minimal viable chat application that allows users to set a display name, send and receive real-time messages in a single default room, with automatic reconnection on network disruption. This is the foundational feature upon which all subsequent Beans Chat features will be built.

Technical approach: Tauri desktop application with React + TypeScript frontend, Rust backend for native functionality, WebSocket client for real-time messaging, and local storage for user preferences.

## Technical Context

**Language/Version**:
- **Frontend**: TypeScript 5.x with React 18.x
- **Backend (Tauri)**: Rust 1.75+ with Tauri 1.5+
- **Server**: Node.js 20+ with TypeScript (separate WebSocket server)

**Primary Dependencies**:
- **Frontend**: React 18, Zustand (state management), Tailwind CSS, React Query (server state)
- **Tauri Backend**: tokio-tungstenite (WebSocket client), tauri-plugin-store (persistence), serde (serialization)
- **Server**: ws library (WebSocket server), TypeScript

**Storage**:
- **Client**: tauri-plugin-store for local JSON storage (display name persistence)
- **Server**: In-memory only (no persistence in MVP)

**Testing**:
- **Frontend**: Vitest for unit tests, React Testing Library for component tests
- **Backend**: cargo test for Rust unit/integration tests
- **E2E**: Tauri's WebDriver integration for end-to-end flows

**Target Platform**: Desktop (Windows 10+, macOS 11+, Linux with GTK 3.24+)

**Project Type**: Desktop application (Tauri hybrid: web frontend + Rust backend)

**Performance Goals** (from Constitution Principle I):
- Startup time < 3 seconds
- Memory usage < 100MB under normal operation
- CPU usage < 1% when idle
- Message transmission < 500ms
- UI responsiveness maintained with 1000+ messages

**Constraints** (from Constitution):
- Cross-platform compatibility (Windows/macOS/Linux)
- No blocking operations on main thread
- TypeScript strict mode enabled
- Rust clippy warnings must be zero

**Scale/Scope**:
- Single chat room ("General")
- Support 10-50 concurrent users initially
- Message history limited to in-memory (1000 messages max for performance)
- No server-side authentication or persistence in MVP

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Performance First (NON-NEGOTIABLE)
- [ ] Startup time < 3 seconds measured and verified
- [ ] Memory usage < 100MB monitored during development
- [ ] CPU usage < 1% when idle validated
- [ ] No blocking operations on main thread (Rust async, React non-blocking renders)
- [ ] Virtual scrolling for message history (React Virtualized or similar)

**Status**: ⚠️ PENDING - Implementation required, will verify in testing

### Principle II: Real-Time Reliability
- [ ] Message latency < 500ms under normal conditions (measured in integration tests)
- [ ] Exponential backoff reconnection implemented (1s, 2s, 4s, 8s...)
- [ ] Message queuing for offline scenarios (deferred to Feature 2)
- [ ] Typing indicators (deferred to Feature 4)
- [ ] Connection state visible to user

**Status**: ⚠️ PARTIAL - Core reliability yes, queuing deferred to Feature 2

### Principle III: Cross-Platform Compatibility
- [ ] Windows 10+ support tested
- [ ] macOS 11+ support tested
- [ ] Linux (GTK 3.24+) support tested
- [ ] No platform-specific features in MVP
- [ ] UI/UX consistent across platforms

**Status**: ✅ PASS - Tauri provides cross-platform abstraction, testing plan includes all platforms

### Principle IV: User Experience Simplicity
- [ ] Clean interface: message list + input field only
- [ ] Dark/light theme (deferred to Feature 4)
- [ ] Error states with clear messages
- [ ] Responsive design maintained during window resize

**Status**: ⚠️ PARTIAL - Core simplicity yes, theme switching deferred

### Principle V: Code Quality & Maintainability
- [ ] TypeScript strict mode enabled
- [ ] Rust best practices (no unwrap in production, proper error handling)
- [ ] Unit tests for state management logic
- [ ] Integration tests for WebSocket communication
- [ ] Clear separation: Zustand stores, Tauri commands, React components

**Status**: ✅ PASS - Testing strategy defined, tech choices support quality

### Principle VI: Tauri & Rust Best Practices
- [ ] Tauri commands for frontend-backend communication
- [ ] Tauri event system for real-time updates
- [ ] tauri-plugin-store for persistence
- [ ] Tokio for async operations
- [ ] Serde for serialization with proper error handling
- [ ] No blocking on main thread

**Status**: ✅ PASS - Architecture follows Tauri patterns

### Overall Gate Decision

**PROCEED TO PHASE 0** with the following notes:
- Performance targets defined but require implementation + validation
- Some features intentionally deferred to later features (message queuing, themes, typing indicators)
- Constitution compliance is achievable with planned architecture
- Must re-check after Phase 1 design to ensure patterns support performance goals

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
beans_chat/                           # Repository root
├── src-tauri/                        # Rust/Tauri backend
│   ├── src/
│   │   ├── main.rs                   # Tauri app entry point
│   │   ├── commands.rs               # Tauri command definitions
│   │   ├── websocket/
│   │   │   ├── mod.rs                # WebSocket client module
│   │   │   ├── client.rs             # WS connection management
│   │   │   └── reconnect.rs          # Reconnection logic with exponential backoff
│   │   ├── storage.rs                # Display name persistence (tauri-plugin-store)
│   │   └── models.rs                 # Rust data structures (Message, ConnectionState)
│   ├── Cargo.toml                    # Rust dependencies
│   └── tauri.conf.json               # Tauri configuration
│
├── src/                              # React/TypeScript frontend
│   ├── main.tsx                      # React app entry point
│   ├── App.tsx                       # Root component with routing logic
│   ├── components/
│   │   ├── SetupScreen.tsx           # Display name setup (first-run)
│   │   ├── ChatInterface.tsx         # Main chat UI container
│   │   ├── MessageList.tsx           # Scrollable message display (virtual scrolling)
│   │   ├── MessageInput.tsx          # Input field + send button
│   │   ├── ConnectionStatus.tsx      # Connection indicator component
│   │   └── Message.tsx               # Single message item component
│   ├── stores/
│   │   ├── useUserStore.ts           # Zustand: user display name
│   │   ├── useMessagesStore.ts       # Zustand: message history
│   │   ├── useConnectionStore.ts     # Zustand: connection state
│   │   └── index.ts                  # Store exports
│   ├── services/
│   │   └── tauri.ts                  # Tauri command wrappers (invoke, listen)
│   ├── types/
│   │   └── index.ts                  # TypeScript interfaces (Message, ConnectionState)
│   └── styles/
│       └── index.css                 # Tailwind CSS imports + custom styles
│
├── server/                           # WebSocket server (separate process)
│   ├── src/
│   │   ├── index.ts                  # Server entry point
│   │   ├── websocket-server.ts       # WS server with ws library
│   │   └── types.ts                  # Server-side TypeScript types
│   ├── package.json                  # Node dependencies (ws, typescript)
│   └── tsconfig.json                 # TypeScript config
│
├── tests/                            # Test suites
│   ├── unit/
│   │   ├── stores.test.ts            # Zustand store tests
│   │   └── websocket.test.rs         # Rust WebSocket client tests
│   ├── integration/
│   │   └── message-flow.test.ts      # End-to-end message delivery tests
│   └── e2e/
│       └── chat-flow.spec.ts         # Tauri WebDriver E2E tests
│
├── package.json                      # Frontend dependencies
├── tsconfig.json                     # TypeScript config
├── tailwind.config.js                # Tailwind CSS config
├── vite.config.ts                    # Vite bundler config
└── vitest.config.ts                  # Vitest test config
```

**Structure Decision**:

Tauri hybrid desktop application structure with three main components:

1. **Frontend** (`src/`): React + TypeScript SPA with Zustand state management, Tailwind CSS styling, and component-based architecture
2. **Backend** (`src-tauri/`): Rust application using Tauri framework for native desktop capabilities and WebSocket client for real-time communication
3. **Server** (`server/`): Standalone Node.js TypeScript WebSocket server for message broadcasting (runs separately from the desktop app)

This structure supports:
- Clear separation between frontend UI logic and native backend logic
- Tauri's command/event system for frontend-backend communication
- Independent server for development and multi-client testing
- Isolated test suites for unit, integration, and E2E testing

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

**No violations to track** - All constitution principles are satisfied by the proposed architecture.

**Note**: Some features are intentionally deferred to later iterations (message queuing for Feature 2, themes for Feature 4) but this is compliant with the phased delivery approach.

