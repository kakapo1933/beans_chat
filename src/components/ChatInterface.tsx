import { useEffect } from "react";
import { useUserStore } from "../stores/useUserStore";
import { useMessagesStore } from "../stores/useMessagesStore";
import { useConnectionStore } from "../stores/useConnectionStore";
import { connectToServer, sendMessage as sendMsg, onMessageReceived, onConnectionStatusChanged } from "../services/tauri";
import ConnectionStatus from "./ConnectionStatus";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

export default function ChatInterface() {
  const { displayName } = useUserStore();
  const { messages, addMessage } = useMessagesStore();
  const { status, setStatus } = useConnectionStore();

  // Connect to server on mount
  useEffect(() => {
    connectToServer().catch((err) => {
      console.error("Failed to connect to server:", err);
    });

    // Setup event listeners
    const unlistenMessages = onMessageReceived((message) => {
      addMessage(message);
    });

    const unlistenStatus = onConnectionStatusChanged((newStatus) => {
      setStatus(newStatus);
    });

    return () => {
      unlistenMessages();
      unlistenStatus();
    };
  }, [addMessage, setStatus]);

  const handleSendMessage = async (content: string) => {
    if (!displayName) return;

    try {
      // Optimistic update - add message immediately
      const tempMessage = {
        id: crypto.randomUUID(),
        displayName,
        content,
        timestamp: new Date().toISOString(),
        isSelf: true,
      };
      addMessage(tempMessage);

      // Send to server
      await sendMsg(displayName, content);
    } catch (err) {
      console.error("Failed to send message:", err);
      // TODO: Show error to user
    }
  };

  const isConnected = status === 'connected';

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header with connection status */}
      <div className="border-b">
        <div className="px-4 py-4 bg-blue-600 text-white">
          <h1 className="text-xl font-bold">Beans Chat</h1>
          <p className="text-sm opacity-90">Welcome, {displayName}!</p>
        </div>
        <ConnectionStatus status={status} />
      </div>

      {/* Message list */}
      <MessageList messages={messages} />

      {/* Message input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={!isConnected}
      />
    </div>
  );
}
