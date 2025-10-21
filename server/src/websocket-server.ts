import { WebSocketServer, WebSocket } from 'ws';

export interface ChatMessage {
  type: string;
  id?: string;
  displayName?: string;
  content?: string;
  timestamp?: string;
}

export function createWebSocketServer(port: number) {
  const wss = new WebSocketServer({ port });

  console.log(`WebSocket server started on port ${port}`);

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');

    ws.on('message', (data: Buffer) => {
      try {
        const message: ChatMessage = JSON.parse(data.toString());

        console.log(`Received message type: ${message.type}`);

        // Handle different message types
        switch (message.type) {
          case 'message':
            // Broadcast message to all connected clients
            broadcast(wss, data.toString());
            break;

          case 'ping':
            // Respond with pong
            ws.send(JSON.stringify({ type: 'pong' }));
            break;

          default:
            console.warn(`Unknown message type: ${message.type}`);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
        // Ignore invalid JSON, don't disconnect client
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return wss;
}

function broadcast(wss: WebSocketServer, message: string) {
  let clientCount = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      clientCount++;
    }
  });
  console.log(`Broadcasted message to ${clientCount} clients`);
}
