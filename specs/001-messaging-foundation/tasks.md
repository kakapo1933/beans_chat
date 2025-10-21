# Tasks: Real-time Messaging Foundation

**Input**: Design documents from `/specs/001-messaging-foundation/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/websocket-protocol.md

**Tests**: Tests are NOT explicitly requested in the spec, so test tasks are excluded. Testing will be manual per quickstart.md validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- Tauri hybrid app: `src-tauri/src/` (Rust), `src/` (React/TypeScript), `server/src/` (Node.js)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize Tauri project with React + TypeScript template using `pnpm create tauri-app`
- [ ] T002 [P] Install frontend dependencies: zustand, react-window, @tanstack/react-query, tailwindcss
- [ ] T003 [P] Install frontend dev dependencies: vitest, @testing-library/react, @testing-library/jest-dom
- [ ] T004 [P] Add Rust dependencies to src-tauri/Cargo.toml: tokio-tungstenite, serde, serde_json, uuid, tauri-plugin-store
- [ ] T005 [P] Configure Tailwind CSS: initialize tailwind.config.js and src/styles/index.css
- [ ] T006 [P] Configure Tauri in src-tauri/tauri.conf.json: app name "Beans Chat", window size (1000x700), min size (600x400), enable tauri-plugin-store
- [ ] T007 [P] Configure TypeScript in tsconfig.json: strict mode enabled, paths for @/* imports
- [ ] T008 [P] Configure Vitest in vitest.config.ts: jsdom environment, setup file
- [ ] T009 [P] Create project directory structure: src/components/, src/stores/, src/services/, src/types/, src/styles/, tests/unit/, tests/integration/, tests/e2e/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T010 Create Rust data models in src-tauri/src/models.rs: Message struct, ConnectionState enum, UserIdentity struct
- [ ] T011 [P] Create TypeScript interfaces in src/types/index.ts: Message, ConnectionState, UserIdentity
- [ ] T012 Initialize WebSocket server project: create server/ directory, package.json with ws and typescript dependencies
- [ ] T013 Implement WebSocket server in server/src/websocket-server.ts: broadcast message handler, ping/pong heartbeat, client connection management per contracts/websocket-protocol.md
- [ ] T014 Create server entry point in server/src/index.ts: start WebSocket server on port 8080
- [ ] T015 [P] Create WebSocket client module structure in src-tauri/src/websocket/mod.rs
- [ ] T016 Implement WebSocket client in src-tauri/src/websocket/client.rs: connect, send_message, receive_message, disconnect handlers
- [ ] T017 Implement exponential backoff reconnection logic in src-tauri/src/websocket/reconnect.rs: 1s, 2s, 4s, 8s, 16s, 30s max delay, indefinite retries
- [ ] T018 [P] Create Tauri commands module in src-tauri/src/commands.rs: command signatures for get_display_name, save_display_name, connect_to_server, send_message, disconnect
- [ ] T019 [P] Implement storage module in src-tauri/src/storage.rs: load_display_name and save_display_name using tauri-plugin-store
- [ ] T020 Update Tauri main.rs: register commands, initialize plugin-store, setup WebSocket client as managed state
- [ ] T021 [P] Create Tauri service wrapper in src/services/tauri.ts: typed wrappers for invoke() and listen() calls

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - First-Time User Setup (Priority: P1) 🎯 MVP Entry Point

**Goal**: New users can set a display name (2-20 chars) that persists across app restarts

**Independent Test**: Launch app for first time, enter display name "Alice", restart app, verify no prompt shown and name is remembered

### Implementation for User Story 1

- [ ] T022 [P] [US1] Create Zustand user store in src/stores/useUserStore.ts: displayName state, setDisplayName action, clearDisplayName action
- [ ] T023 [P] [US1] Create SetupScreen component in src/components/SetupScreen.tsx: display name input field, validation (2-20 chars, alphanumeric + space/hyphen/underscore), error messages, submit button
- [ ] T024 [US1] Implement display name validation logic in SetupScreen: regex pattern, length check, whitespace trim, real-time feedback
- [ ] T025 [US1] Connect SetupScreen to Tauri commands: call save_display_name on submit, update Zustand store on success
- [ ] T026 [US1] Update App.tsx: check for display name on mount (call get_display_name), show SetupScreen if null, otherwise show ChatInterface

**Checkpoint**: User can set display name, it persists, and app remembers it on restart

---

## Phase 4: User Story 5 - Basic Chat Interface (Priority: P1) 🎯 MVP UI Foundation

**Goal**: Clean UI with message list (showing sender name + timestamp + content) and message input field

**Independent Test**: With display name set, user sees message list area (empty initially) and input field at bottom, window resize maintains usable proportions

### Implementation for User Story 5

- [ ] T027 [P] [US5] Create Message component in src/components/Message.tsx: display displayName, content, timestamp (12/24hr based on locale), distinguish own messages vs others
- [ ] T028 [P] [US5] Create MessageList component in src/components/MessageList.tsx: scrollable container, map over messages array, auto-scroll to bottom when at bottom, maintain scroll position when scrolled up
- [ ] T029 [P] [US5] Create MessageInput component in src/components/MessageInput.tsx: text input field, send button, Enter key handler, disabled when empty/whitespace-only
- [ ] T030 [P] [US5] Create ConnectionStatus component in src/components/ConnectionStatus.tsx: show connection state (connected/disconnected/reconnecting) with appropriate colors (green/red/yellow)
- [ ] T031 [US5] Create ChatInterface container in src/components/ChatInterface.tsx: layout with ConnectionStatus at top, MessageList in center, MessageInput at bottom, responsive to window resize
- [ ] T032 [US5] Style components with Tailwind CSS: clean layout, readable fonts, proper spacing, responsive design

**Checkpoint**: UI displays correctly with all components laid out, responds to window resize

---

## Phase 5: User Story 2 - Send and Receive Messages (Priority: P1) 🎯 MVP Core Messaging

**Goal**: Users can send messages and see messages from others in real-time (< 500ms latency)

**Independent Test**: Open two app instances with different names, send message from one, verify it appears in both instances within 500ms

### Implementation for User Story 2

- [ ] T033 [P] [US2] Create Zustand messages store in src/stores/useMessagesStore.ts: messages array state (max 1000), addMessage action, clearMessages action, auto-slice oldest when > 1000
- [ ] T034 [US2] Implement send message flow in MessageInput: on submit, generate UUID + timestamp, call invoke('send_message'), add to local messages store immediately (optimistic update)
- [ ] T035 [US2] Implement Tauri command send_message in src-tauri/src/commands.rs: accept message data, forward to WebSocket client, handle errors
- [ ] T036 [US2] Implement WebSocket send in src-tauri/src/websocket/client.rs: serialize message to JSON per contracts/websocket-protocol.md, send over WebSocket
- [ ] T037 [US2] Implement message receive handler in src-tauri/src/websocket/client.rs: parse incoming JSON, emit Tauri event 'message_received' with message data
- [ ] T038 [US2] Setup message receive listener in src/services/tauri.ts: listen to 'message_received' event, add to messages store, set isSelf flag by comparing displayName
- [ ] T039 [US2] Connect MessageList to messages store: map over messages, pass to Message component
- [ ] T040 [US2] Implement empty message rejection: disable send button when input is empty or whitespace-only
- [ ] T041 [US2] Implement auto-scroll logic in MessageList: detect if user is at bottom (scrollHeight - scrollTop <= clientHeight + threshold), auto-scroll on new message only if at bottom

**Checkpoint**: Messages send and receive correctly, appear in chronological order, isSelf flag works, auto-scroll works

---

## Phase 6: User Story 3 - Connection Status Awareness (Priority: P2)

**Goal**: Users see connection status (connected/disconnected/reconnecting) and cannot send when disconnected

**Independent Test**: With app connected, stop server, observe status changes to "Disconnected" within 2s, message input disabled, restart server, status changes to "Connected", input re-enabled

### Implementation for User Story 3

- [ ] T042 [P] [US3] Create Zustand connection store in src/stores/useConnectionStore.ts: status state ('connecting' | 'connected' | 'disconnected' | 'reconnecting'), setStatus action
- [ ] T043 [US3] Implement connection status detection in src-tauri/src/websocket/client.rs: on successful connection emit 'connection_status' event with 'connected', on disconnect emit 'disconnected', on reconnect attempt emit 'reconnecting'
- [ ] T044 [US3] Setup connection status listener in src/services/tauri.ts: listen to 'connection_status' event, update connection store
- [ ] T045 [US3] Connect ConnectionStatus component to connection store: display current status, use appropriate colors (connected=green, disconnected=red, reconnecting=yellow)
- [ ] T046 [US3] Disable message sending when disconnected: in MessageInput, read connection status from store, disable input/button when status is not 'connected'
- [ ] T047 [US3] Add connection status change notification: detect status change within 2 seconds of actual network event (validated during testing)

**Checkpoint**: Connection status accurately reflects WebSocket state, UI updates within 2s of connection change, message input disabled when not connected

---

## Phase 7: User Story 4 - Automatic Reconnection (Priority: P2)

**Goal**: App automatically reconnects after network disruption using exponential backoff (1s, 2s, 4s, 8s, 16s, 30s max)

**Independent Test**: With app running, disconnect network, observe reconnection attempts with increasing delays, reconnect network, verify app reconnects successfully

### Implementation for User Story 4

- [ ] T048 [US4] Implement reconnection loop in src-tauri/src/websocket/reconnect.rs: on disconnect detected, start reconnection with 1s delay, double delay on each failure (max 30s), reset delay on success
- [ ] T049 [US4] Emit reconnecting status events in reconnect.rs: emit 'connection_status' with 'reconnecting' on each attempt
- [ ] T050 [US4] Integrate reconnection logic with WebSocket client in src-tauri/src/websocket/client.rs: on connection close, call reconnection handler
- [ ] T051 [US4] Continue reconnection indefinitely: ensure reconnection loop never stops until connection succeeds
- [ ] T052 [US4] Verify reconnection resets delay: on successful reconnect, reset exponential backoff delay to 1s

**Checkpoint**: App automatically reconnects after network disruption, uses exponential backoff correctly, continues trying indefinitely

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T053 [P] Add heartbeat ping/pong in WebSocket client: send ping every 30s, handle pong response, detect connection loss if pong not received
- [ ] T054 [P] Implement virtual scrolling in MessageList using react-window (if performance degrades with 1000+ messages)
- [ ] T055 [P] Add error boundaries in App.tsx: catch React errors, display user-friendly error messages
- [ ] T056 [P] Implement proper error handling in all Tauri commands: return Result<T, String>, log errors, emit error events
- [ ] T057 [P] Add Rust logging in src-tauri/src/: use log crate for debug/info/error messages
- [ ] T058 [P] Configure Rust clippy lints in src-tauri/Cargo.toml: deny warnings, enable pedantic lints
- [ ] T059 [P] Add ESLint configuration for TypeScript: strict rules, React hooks rules
- [ ] T060 [P] Add Prettier configuration: consistent code formatting
- [ ] T061 Validate quickstart.md instructions: follow setup steps, verify all commands work, test multi-client scenario
- [ ] T062 Run constitution compliance checks: measure startup time < 3s, memory < 100MB, CPU < 1% idle, message latency < 500ms
- [ ] T063 Cross-platform testing: test on Windows, macOS, Linux, verify UI consistency, fix platform-specific issues
- [ ] T064 Performance optimization: profile app, optimize re-renders, reduce bundle size if needed
- [ ] T065 [P] Add comments and documentation to complex logic: WebSocket reconnection, message handling, state management
- [ ] T066 Final code cleanup: remove debug logs, unused imports, commented code

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (Phase 3): No dependencies on other stories
  - US5 (Phase 4): No dependencies on other stories (can parallelize with US1)
  - US2 (Phase 5): Depends on US1 (needs display name) and US5 (needs UI components)
  - US3 (Phase 6): Depends on US2 (needs message sending to test disabling)
  - US4 (Phase 7): Depends on US3 (needs connection status display)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 5 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Depends on US1 and US5 completion (needs display name and UI)
- **User Story 3 (P2)**: Depends on US2 completion (needs messaging to validate disabled state)
- **User Story 4 (P2)**: Depends on US3 completion (needs connection status to show reconnecting state)

### Recommended Implementation Order

1. Complete **Phase 1** (Setup) + **Phase 2** (Foundational)
2. Complete **Phase 3** (US1) + **Phase 4** (US5) in parallel
3. Complete **Phase 5** (US2)
4. Complete **Phase 6** (US3)
5. Complete **Phase 7** (US4)
6. Complete **Phase 8** (Polish)

### Within Each User Story

- UI components can be built in parallel (all marked [P])
- Store implementation comes before component integration
- Tauri command implementation comes before frontend integration
- Story complete and tested independently before moving to next story

### Parallel Opportunities

- **Phase 1 (Setup)**: T002-T009 can all run in parallel
- **Phase 2 (Foundational)**: T011, T015, T018, T019, T021 can run in parallel
- **Phase 3 (US1)**: T022-T023 can run in parallel
- **Phase 4 (US5)**: T027-T030 can all run in parallel
- **Phase 5 (US2)**: T033-T034 can run in parallel
- **Phase 6 (US3)**: T042-T043 can run in parallel
- **Phase 8 (Polish)**: T053-T060, T065 can all run in parallel
- **Entire Phase 3 and Phase 4 can run in parallel** (US1 and US5 are independent)

---

## Parallel Example: User Story 5 (Basic Chat Interface)

```bash
# Launch all UI components for User Story 5 together:
Task: "Create Message component in src/components/Message.tsx"
Task: "Create MessageList component in src/components/MessageList.tsx"
Task: "Create MessageInput component in src/components/MessageInput.tsx"
Task: "Create ConnectionStatus component in src/components/ConnectionStatus.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1, 5, 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (First-time setup)
4. Complete Phase 4: User Story 5 (Chat UI)
5. Complete Phase 5: User Story 2 (Send/receive messages)
6. **STOP and VALIDATE**: Test basic messaging flow end-to-end
7. Deploy/demo if ready - users can now chat in real-time!

### Full Feature (All 5 User Stories)

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 + 5 → Entry point + UI ready
3. Add User Story 2 → Messaging works → Test independently → **MVP Delivery**
4. Add User Story 3 → Connection awareness → Test independently
5. Add User Story 4 → Auto-reconnection → Test independently
6. Add Polish → Final quality pass
7. **Full Feature Delivery** - all requirements met

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (First-time setup)
   - Developer B: User Story 5 (Chat UI components)
3. Once US1 + US5 complete:
   - Developer A: User Story 2 (Messaging)
4. Once US2 complete:
   - Developer A: User Story 3 (Connection status)
   - Developer B: User Story 4 (Auto-reconnection) - can start in parallel
5. Once US3 + US4 complete:
   - Team: Polish together

---

## Task Summary

**Total Tasks**: 66

**By Phase**:
- Phase 1 (Setup): 9 tasks
- Phase 2 (Foundational): 12 tasks
- Phase 3 (US1): 5 tasks
- Phase 4 (US5): 6 tasks
- Phase 5 (US2): 9 tasks
- Phase 6 (US3): 6 tasks
- Phase 7 (US4): 5 tasks
- Phase 8 (Polish): 14 tasks

**Parallel Tasks**: 31 tasks marked [P] (47% can run in parallel)

**MVP Scope** (US1 + US5 + US2): 20 tasks (Phases 1-5)
**Full Feature**: 66 tasks (all phases)

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently testable after its phase completes
- No test tasks included - manual testing per quickstart.md validation
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Follow constitution requirements: < 3s startup, < 100MB RAM, < 1% idle CPU, < 500ms message latency
- All TypeScript must pass strict mode, all Rust must pass clippy with zero warnings
