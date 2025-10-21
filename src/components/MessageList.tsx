import { useEffect, useRef } from "react";
import { Message as MessageType } from "../types";
import Message from "./Message";

interface MessageListProps {
  messages: MessageType[];
}

export default function MessageList({ messages }: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  // Check if user is near bottom of scroll
  const checkIfNearBottom = () => {
    const list = listRef.current;
    if (!list) return false;

    const threshold = 100; // pixels from bottom
    const isNearBottom =
      list.scrollHeight - list.scrollTop - list.clientHeight < threshold;

    isNearBottomRef.current = isNearBottom;
    return isNearBottom;
  };

  // Auto-scroll to bottom when new messages arrive (only if already at bottom)
  useEffect(() => {
    if (isNearBottomRef.current && lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView();
    }
  }, []);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-center">
          No messages yet.<br />
          <span className="text-sm">Start the conversation!</span>
        </p>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      onScroll={checkIfNearBottom}
      className="flex-1 overflow-y-auto px-4 py-6 bg-gray-50"
    >
      {messages.map((message, index) => (
        <div
          key={message.id}
          ref={index === messages.length - 1 ? lastMessageRef : null}
        >
          <Message message={message} />
        </div>
      ))}
    </div>
  );
}
