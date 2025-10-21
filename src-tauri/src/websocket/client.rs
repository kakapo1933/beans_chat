use crate::models::{ConnectionState, WSMessage};
use futures_util::{SinkExt, StreamExt};
use std::sync::Arc;
use tauri::{Manager, Window};
use tokio::sync::Mutex;
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};

pub struct WebSocketClient {
    url: String,
    window: Window,
}

impl WebSocketClient {
    pub fn new(url: String, window: Window) -> Self {
        Self { url, window }
    }

    /// Connect to WebSocket server and handle messages
    pub async fn connect(&self) -> Result<(), String> {
        log::info!("Connecting to WebSocket server at {}", self.url);

        // Emit connecting status
        self.emit_connection_status(ConnectionState::Connecting);

        let (ws_stream, _) = connect_async(&self.url)
            .await
            .map_err(|e| format!("Failed to connect: {}", e))?;

        log::info!("WebSocket connected successfully");

        // Emit connected status
        self.emit_connection_status(ConnectionState::Connected);

        let (mut write, mut read) = ws_stream.split();

        let window = self.window.clone();

        // Spawn task to handle incoming messages
        tokio::spawn(async move {
            while let Some(msg) = read.next().await {
                match msg {
                    Ok(Message::Text(text)) => {
                        log::debug!("Received message: {}", text);

                        // Parse and emit message to frontend
                        if let Ok(ws_msg) = serde_json::from_str::<WSMessage>(&text) {
                            match ws_msg {
                                WSMessage::Message {
                                    id,
                                    display_name,
                                    content,
                                    timestamp,
                                } => {
                                    window
                                        .emit(
                                            "message_received",
                                            serde_json::json!({
                                                "id": id,
                                                "displayName": display_name,
                                                "content": content,
                                                "timestamp": timestamp,
                                            }),
                                        )
                                        .ok();
                                }
                                WSMessage::Pong => {
                                    log::debug!("Received pong");
                                }
                                _ => {}
                            }
                        }
                    }
                    Ok(Message::Close(_)) => {
                        log::info!("WebSocket connection closed by server");
                        break;
                    }
                    Err(e) => {
                        log::error!("WebSocket error: {}", e);
                        break;
                    }
                    _ => {}
                }
            }

            // Emit disconnected status when connection closes
            window
                .emit("connection_status", ConnectionState::Disconnected)
                .ok();
        });

        Ok(())
    }

    /// Send a message to the WebSocket server
    pub async fn send_message(&self, message: WSMessage) -> Result<(), String> {
        let json = serde_json::to_string(&message).map_err(|e| format!("Failed to serialize message: {}", e))?;

        // In a real implementation, we'd need to store the write half of the stream
        // For now, this is a placeholder that will be improved
        log::info!("Sending message: {}", json);

        Ok(())
    }

    fn emit_connection_status(&self, status: ConnectionState) {
        self.window.emit("connection_status", status).ok();
    }
}
