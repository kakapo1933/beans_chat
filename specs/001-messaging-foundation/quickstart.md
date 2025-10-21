# Quickstart Guide: Real-time Messaging Foundation

**Feature**: 001-messaging-foundation
**Date**: 2025-10-21
**Purpose**: Get the Beans Chat MVP running on your local machine

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required

- **Node.js** 20+ ([download](https://nodejs.org/))
- **Rust** 1.75+ ([rustup.rs](https://rustup.rs/))
- **pnpm** 8+ (install: `npm install -g pnpm`)

### Platform-Specific

**Windows**:
- **WebView2**: Pre-installed on Windows 11, install separately for Windows 10
- **Visual Studio Build Tools** with C++ workload

**macOS**:
- **Xcode Command Line Tools**: `xcode-select --install`

**Linux**:
- **WebKitGTK**: `sudo apt install libwebkit2gtk-4.0-dev` (Ubuntu/Debian)
- **Build essentials**: `sudo apt install build-essential curl wget libssl-dev`

---

## Quick Start (5 Minutes)

### 1. Initialize Tauri Project

```bash
# Create new Tauri project
pnpm create tauri-app

# Options:
#   App name: beans-chat
#   Frontend framework: React
#   TypeScript: Yes
#   Package manager: pnpm

cd beans-chat
```

### 2. Install Dependencies

```bash
# Frontend dependencies
pnpm install

# Add required packages
pnpm add zustand react-window @tanstack/react-query

# Add dev dependencies
pnpm add -D @types/react-window tailwindcss autoprefixer postcss vitest @testing-library/react @testing-library/jest-dom

# Tauri dependencies (Rust)
cd src-tauri
cargo add tokio-tungstenite serde serde_json uuid --features "tokio-tungstenite/tokio-runtime,uuid/v4,uuid/serde"
cargo add tauri-plugin-store
cd ..
```

### 3. Setup Tailwind CSS

```bash
# Initialize Tailwind
pnpx tailwindcss init -p

# Configure tailwind.config.js
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

# Add Tailwind directives to src/styles/index.css
cat > src/styles/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF
```

### 4. Start Development Servers

Open **three terminal windows**:

**Terminal 1: WebSocket Server**
```bash
cd server
pnpm install
pnpm dev
```

**Terminal 2: Tauri Development**
```bash
pnpm tauri dev
```

**Terminal 3: (Optional) Tests**
```bash
pnpm test
```

---

## Detailed Setup

### Project Structure

After setup, your directory should look like this:

```
beans-chat/
├── src-tauri/              # Rust/Tauri backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands.rs
│   │   ├── websocket/
│   │   ├── storage.rs
│   │   └── models.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                    # React frontend
│   ├── components/
│   ├── stores/
│   ├── services/
│   ├── types/
│   └── styles/
├── server/                 # WebSocket server
│   ├── src/
│   │   ├── index.ts
│   │   └── websocket-server.ts
│   └── package.json
├── tests/                  # Test suites
├── package.json
└── vite.config.ts
```

### Configuration Files

#### `src-tauri/tauri.conf.json`

Key configurations:

```json
{
  "build": {
    "beforeDevCommand": "pnpm dev",
    "beforeBuildCommand": "pnpm build",
    "devPath": "http://localhost:1420",
    "distDir": "../dist"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "open": true
      }
    },
    "bundle": {
      "identifier": "com.beans.chat",
      "targets": "all"
    },
    "windows": [
      {
        "title": "Beans Chat",
        "width": 1000,
        "height": 700,
        "minWidth": 600,
        "minHeight": 400
      }
    ]
  },
  "plugins": {
    "store": {
      "enabled": true
    }
  }
}
```

#### `server/package.json`

```json
{
  "name": "beans-chat-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "ws": "^8.14.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/ws": "^8.5.0",
    "tsx": "^4.0.0",
    "typescript": "^5.2.0"
  }
}
```

#### `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    globals: true,
  },
});
```

---

## Development Workflow

### Running the App

1. **Start WebSocket Server**:
   ```bash
   cd server
   pnpm dev
   ```
   Server runs on `ws://localhost:8080`

2. **Start Tauri Dev Mode**:
   ```bash
   pnpm tauri dev
   ```
   App opens automatically with hot reload enabled

### Running Tests

**Frontend Unit Tests**:
```bash
pnpm test
```

**Rust Tests**:
```bash
cd src-tauri
cargo test
```

**Watch Mode**:
```bash
pnpm test:watch
```

### Building for Production

```bash
# Build for current platform
pnpm tauri build

# Output:
# - Windows: src-tauri/target/release/beans-chat.exe
# - macOS: src-tauri/target/release/bundle/macos/Beans Chat.app
# - Linux: src-tauri/target/release/beans-chat (binary)
```

---

## Testing Multi-Client Scenarios

To test real-time messaging between multiple users:

### Option 1: Multiple App Instances

```bash
# Terminal 1: First instance
pnpm tauri dev

# Terminal 2: Build and run second instance
pnpm tauri build --debug
./src-tauri/target/debug/beans-chat  # Linux/macOS
# or
.\src-tauri\target\debug\beans-chat.exe  # Windows
```

### Option 2: Web Debug Build

```bash
# Terminal 1: Server
cd server && pnpm dev

# Terminal 2: Frontend only (Vite dev server)
pnpm dev

# Open multiple browser tabs at http://localhost:1420
```

**Note**: Some Tauri features won't work in browser (storage, native APIs), but WebSocket messaging will.

---

## Troubleshooting

### WebSocket Connection Failed

**Symptom**: App shows "Disconnected" on startup

**Solutions**:
1. Check if server is running: `curl http://localhost:8080`
2. Verify server logs for errors
3. Check firewall settings (allow port 8080)

### Tauri Dev Build Fails

**Symptom**: `cargo build` errors

**Solutions**:
1. Update Rust: `rustup update`
2. Install platform dependencies (see Prerequisites)
3. Clear cargo cache: `cargo clean`

### Hot Reload Not Working

**Symptom**: Changes not reflected in dev mode

**Solutions**:
1. Restart `pnpm tauri dev`
2. Check Vite dev server is running
3. Verify `tauri.conf.json` devPath is correct

### Display Name Not Persisting

**Symptom**: Name prompt appears on every launch

**Solutions**:
1. Check tauri-plugin-store is in `tauri.conf.json` plugins
2. Verify storage directory has write permissions
3. Check browser console for storage errors

---

## Environment Variables

Create `.env` file in project root:

```bash
# WebSocket Server
VITE_WS_URL=ws://localhost:8080

# Development
VITE_LOG_LEVEL=debug
```

Access in TypeScript:
```typescript
const WS_URL = import.meta.env.VITE_WS_URL;
```

---

## Performance Monitoring

### Development Metrics

**Startup Time**:
```bash
# Measure from launch to first render
time pnpm tauri dev
```

**Memory Usage**:
- Windows: Task Manager → Details → beans-chat.exe
- macOS: Activity Monitor → Beans Chat
- Linux: `ps aux | grep beans-chat`

**Target**: < 100MB under normal use

### Browser DevTools

Open DevTools in Tauri app:
- **Windows/Linux**: `Ctrl+Shift+I`
- **macOS**: `Cmd+Option+I`

Check:
- Network tab: WebSocket connection status
- Console: Error messages
- Performance: Message render times

---

## Next Steps

After running the app:

1. **Set Display Name**: Enter a name (2-20 characters)
2. **Send Messages**: Type and press Enter
3. **Test Reconnection**: Stop/start server, observe auto-reconnect
4. **Test Multi-Client**: Open second instance, verify message broadcast

---

## Useful Commands

```bash
# Update dependencies
pnpm update

# Rust dependency audit
cd src-tauri && cargo audit

# Format code
pnpm format       # Frontend (Prettier)
cargo fmt         # Rust (in src-tauri/)

# Lint
pnpm lint         # Frontend (ESLint)
cargo clippy      # Rust (in src-tauri/)

# Clean build artifacts
pnpm clean
cd src-tauri && cargo clean

# Generate types (if using type generation)
pnpm generate-types
```

---

## Additional Resources

- **Tauri Docs**: https://tauri.app/v1/guides/
- **React Docs**: https://react.dev/
- **Zustand Docs**: https://docs.pmnd.rs/zustand
- **tokio-tungstenite**: https://docs.rs/tokio-tungstenite
- **ws library**: https://github.com/websockets/ws

---

## Support

**Common Issues**: See [Troubleshooting](#troubleshooting) section

**Questions**: Check spec documents in `specs/001-messaging-foundation/`
- [spec.md](spec.md) - Requirements and user stories
- [plan.md](plan.md) - Implementation plan
- [data-model.md](data-model.md) - Entity definitions
- [contracts/websocket-protocol.md](contracts/websocket-protocol.md) - WebSocket protocol

---

## Constitution Compliance Checklist

Before considering feature complete, verify:

- [ ] Startup time < 3 seconds
- [ ] Memory usage < 100MB (check Task Manager/Activity Monitor)
- [ ] CPU usage < 1% when idle
- [ ] Message latency < 500ms (use browser DevTools Network timing)
- [ ] All tests passing (`pnpm test && cd src-tauri && cargo test`)
- [ ] TypeScript strict mode enabled (check `tsconfig.json`)
- [ ] Rust clippy passes with zero warnings (`cargo clippy`)
- [ ] Tested on all three platforms (Windows/macOS/Linux)

See [Constitution](.specify/memory/constitution.md) for full requirements.
