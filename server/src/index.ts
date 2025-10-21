import { createWebSocketServer } from './websocket-server.js';

const PORT = 8080;

// Create and start WebSocket server
const wss = createWebSocketServer(PORT);

console.log(`
╔════════════════════════════════════════╗
║   Beans Chat WebSocket Server         ║
║   Running on ws://localhost:${PORT}     ║
╚════════════════════════════════════════╝
`);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down WebSocket server...');
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\nShutting down WebSocket server...');
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});
