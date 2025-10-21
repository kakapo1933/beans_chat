use crate::models::{ConnectionState, WSMessage};
use futures_util::{stream::SplitSink, SinkExt, StreamExt};
use std::sync::Arc;
use tauri::{Manager, Window};
use tokio::sync::Mutex;
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message, MaybeTlsStream, WebSocketStream};

type WsWriter = Arc<Mutex<Option<SplitSink<WebSocketStream<MaybeTlsStream<tokio::net::TcpStream>>, Message>>>>;

#[derive(Clone)]
pub struct WebSocketClient {
    url: String,
    pub window: Window,
    writer: WsWriter,
}

impl WebSocketClient {
    pub fn new(url: String, window: Window) -> Self {
        Self {
            url,
            window,
            writer: Arc::new(Mutex::new(None)),
        }
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

        let (write, mut read) = ws_stream.split();

        // Store the write half for sending messages
        {
            let mut writer = self.writer.lock().await;
            *writer = Some(write);
        }

        let window = self.window.clone();
        let writer_for_disconnect = self.writer.clone();
        let writer_for_ping = self.writer.clone();
        let self_for_reconnect = self.clone();

        // Spawn heartbeat task to send periodic pings
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(30));
            loop {
                interval.tick().await;

                let mut writer = writer_for_ping.lock().await;
                if let Some(ws_writer) = writer.as_mut() {
                    let ping_msg = WSMessage::Ping;
                    if let Ok(json) = serde_json::to_string(&ping_msg) {
                        if ws_writer.send(Message::Text(json)).await.is_err() {
                            log::warn!("Failed to send ping, connection may be dead");
                            break;
                        }
                        log::debug!("Sent ping");
                    }
                } else {
                    // Connection closed, exit heartbeat loop
                    break;
                }
            }
        });

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

            // Clear the writer and emit disconnected status when connection closes
            {
                let mut writer = writer_for_disconnect.lock().await;
                *writer = None;
            }

            window
                .emit("connection_status", ConnectionState::Disconnected)
                .ok();

            // Auto-reconnect when connection is lost
            log::info!("Connection lost, starting reconnection...");
            let reconnect_manager = crate::websocket::ReconnectionManager::new(self_for_reconnect);
            tokio::spawn(async move {
                reconnect_manager.connect_with_retry().await;
            });
        });

        Ok(())
    }

    /// Send a message to the WebSocket server
    pub async fn send_message(&self, message: WSMessage) -> Result<(), String> {
        let json = serde_json::to_string(&message)
            .map_err(|e| format!("Failed to serialize message: {}", e))?;

        let mut writer = self.writer.lock().await;

        if let Some(ws_writer) = writer.as_mut() {
            ws_writer
                .send(Message::Text(json.clone()))
                .await
                .map_err(|e| format!("Failed to send message: {}", e))?;

            log::info!("Sent message: {}", json);
            Ok(())
        } else {
            Err("Not connected to WebSocket server".to_string())
        }
    }

    fn emit_connection_status(&self, status: ConnectionState) {
        self.window.emit("connection_status", status).ok();
    }
}
