import { Message as MessageType } from "../types";

interface MessageProps {
  message: MessageType;
}

export default function Message({ message }: MessageProps) {
  const { displayName, content, timestamp, isSelf } = message;

  // Format timestamp to locale time
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className={`flex flex-col mb-4 ${isSelf ? 'items-end' : 'items-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isSelf
          ? 'bg-blue-600 text-white'
          : 'bg-gray-200 text-gray-800'
      }`}>
        {!isSelf && (
          <div className="text-xs font-semibold mb-1 opacity-75">
            {displayName}
          </div>
        )}
        <div className="text-sm break-words whitespace-pre-wrap">
          {content}
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-1 px-1">
        {formatTime(timestamp)}
      </div>
    </div>
  );
}
