import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { Message, ConnectionState } from "@/types";

// Tauri command wrappers

export async function getDisplayName(): Promise<string | null> {
  return await invoke<string | null>("get_display_name");
}

export async function saveDisplayName(name: string): Promise<void> {
  return await invoke("save_display_name", { name });
}

export async function connectToServer(): Promise<void> {
  return await invoke("connect_to_server");
}

export async function sendMessage(
  displayName: string,
  content: string
): Promise<void> {
  return await invoke("send_message", { displayName, content });
}

export async function disconnect(): Promise<void> {
  return await invoke("disconnect");
}

// Tauri event listeners

export function onMessageReceived(
  callback: (message: Message) => void
): () => void {
  let unlisten: (() => void) | null = null;

  listen<Message>("message_received", (event) => {
    callback(event.payload);
  }).then((unlistenFn) => {
    unlisten = unlistenFn;
  });

  return () => {
    if (unlisten) unlisten();
  };
}

export function onConnectionStatusChanged(
  callback: (status: ConnectionState) => void
): () => void {
  let unlisten: (() => void) | null = null;

  listen<ConnectionState>("connection_status", (event) => {
    callback(event.payload);
  }).then((unlistenFn) => {
    unlisten = unlistenFn;
  });

  return () => {
    if (unlisten) unlisten();
  };
}
