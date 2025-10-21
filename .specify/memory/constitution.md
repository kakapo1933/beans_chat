<!--
Sync Impact Report:
- Version change: Initial → 1.0.0
- New constitution created for Beans Chat project
- Principles defined: Performance First, Real-Time Reliability, Cross-Platform Compatibility, User Experience Simplicity, Code Quality, Tauri/Rust Best Practices
- Templates to validate: ✅ All templates reviewed for alignment
- No deferred TODOs
-->

# Beans Chat Constitution

## Core Principles

### I. Performance First (NON-NEGOTIABLE)
The application MUST remain lightweight and responsive at all times.

**Requirements:**
- Startup time < 3 seconds on modern hardware
- Memory usage < 100MB under normal operation
- CPU usage < 1% when idle
- No UI blocking or lag during message traffic
- Virtual scrolling for message history to maintain performance with large datasets

**Rationale:** Tauri's lightweight architecture is a core advantage. Exceeding these limits defeats the purpose of choosing Tauri over Electron.

### II. Real-Time Reliability
Message delivery and real-time features MUST be reliable and performant.

**Requirements:**
- Message transmission latency < 500ms under normal network conditions
- Automatic reconnection with exponential backoff (max 3 attempts)
- Message queuing for offline scenarios
- Typing indicators with debouncing to minimize network traffic
- WebSocket connection state clearly communicated to users

**Rationale:** Chat applications live or die by their real-time responsiveness and reliability. Users expect instant communication.

### III. Cross-Platform Compatibility
All features MUST work consistently across Windows, macOS, and Linux.

**Requirements:**
- No platform-specific features unless absolutely necessary
- UI/UX consistency across all platforms
- Test on all three target platforms before release
- Platform-specific code MUST be isolated and documented

**Rationale:** Cross-platform support is a key value proposition. Inconsistent behavior erodes user trust.

### IV. User Experience Simplicity
Interfaces MUST be clean, intuitive, and distraction-free.

**Requirements:**
- No feature bloat - only essential chat functionality
- Clear visual hierarchy (sidebar for rooms, main area for chat)
- Responsive design that maintains usability at all window sizes
- Dark/light theme support with system preference detection
- Error states clearly communicated with actionable recovery steps

**Rationale:** Users should focus on conversations, not fighting the interface.

### V. Code Quality & Maintainability
Code MUST be well-structured, tested, and documented.

**Requirements:**
- TypeScript for type safety on frontend
- Rust best practices for backend (error handling, no unwrap in production)
- Unit tests for business logic
- Integration tests for WebSocket communication
- Clear separation of concerns (state management, UI, Tauri commands)
- Zustand for predictable state management

**Rationale:** Quality code reduces bugs, eases maintenance, and enables future enhancements.

### VI. Tauri & Rust Best Practices
Follow framework-specific patterns and idioms.

**Requirements:**
- Use Tauri commands for frontend-backend communication
- Leverage Tauri event system for real-time updates
- Use tauri-plugin-store for persistent storage
- Tokio for async operations
- Serde for serialization with proper error handling
- No blocking operations on main thread

**Rationale:** Framework best practices exist for good reasons - security, performance, maintainability.

## Performance Standards

**Benchmarking Requirements:**
- Measure startup time, memory usage, and CPU usage in development
- Performance degradation is a blocker for merge
- Load testing with 50+ concurrent rooms and 100+ messages per room

**Optimization Priorities:**
1. Real-time message delivery latency
2. Memory footprint
3. Startup time
4. CPU usage during idle

## Development Workflow

**Development Process:**
- Follow Spec-Driven Development methodology
- Requirements → Design → Tasks → Implementation
- Code reviews required for all changes
- No direct commits to main branch

**Quality Gates:**
- All TypeScript code must pass type checking
- All Rust code must pass clippy with no warnings
- Tests must pass before merge
- Performance benchmarks must not regress

**Testing Strategy:**
- Unit tests for state management logic
- Integration tests for WebSocket client/server communication
- End-to-end testing for critical user flows (send message, join room, reconnection)
- Manual testing on all three platforms before release

## Governance

**Constitutional Authority:**
This constitution supersedes all other development practices and decisions. When in doubt, refer to these principles.

**Amendment Process:**
- Amendments require documented rationale
- Version increments follow semantic versioning:
  - MAJOR: Backward-incompatible principle removals/redefinitions
  - MINOR: New principles or material expansions
  - PATCH: Clarifications, typos, non-semantic fixes
- All stakeholders must approve major changes

**Compliance:**
- All pull requests MUST verify compliance with these principles
- Violations must be justified and documented
- Complexity must serve a principle; otherwise, simplify
- Use CLAUDE.md or similar agent guidance files for runtime development context

**Version**: 1.0.0 | **Ratified**: 2025-10-21 | **Last Amended**: 2025-10-21
