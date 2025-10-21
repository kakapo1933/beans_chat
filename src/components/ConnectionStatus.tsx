import { ConnectionState } from "../types";

interface ConnectionStatusProps {
  status: ConnectionState;
}

export default function ConnectionStatus({ status }: ConnectionStatusProps) {
  const getStatusConfig = (state: ConnectionState) => {
    switch (state) {
      case 'connected':
        return {
          text: 'Connected',
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
        };
      case 'connecting':
        return {
          text: 'Connecting...',
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
        };
      case 'reconnecting':
        return {
          text: 'Reconnecting...',
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
        };
      case 'disconnected':
        return {
          text: 'Disconnected',
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
        };
      default:
        return {
          text: 'Unknown',
          color: 'bg-gray-500',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-50',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className={`px-4 py-2 ${config.bgColor} border-b flex items-center gap-2`}>
      <div className={`w-2 h-2 rounded-full ${config.color} ${status === 'connecting' || status === 'reconnecting' ? 'animate-pulse' : ''}`} />
      <span className={`text-sm font-medium ${config.textColor}`}>
        {config.text}
      </span>
    </div>
  );
}
