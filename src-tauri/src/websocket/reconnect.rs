use crate::models::ConnectionState;
use crate::websocket::WebSocketClient;
use std::time::Duration;
use tauri::{Manager, Window};
use tokio::time::sleep;

pub struct ReconnectionManager {
    client: WebSocketClient,
    max_delay: Duration,
}

impl ReconnectionManager {
    pub fn new(client: WebSocketClient) -> Self {
        Self {
            client,
            max_delay: Duration::from_secs(30),
        }
    }

    /// Attempt to connect with exponential backoff
    /// Delays: 1s, 2s, 4s, 8s, 16s, 30s (max), 30s, 30s, ...
    /// Continues indefinitely until connection succeeds
    pub async fn connect_with_retry(&self) {
        let mut delay = Duration::from_secs(1);

        loop {
            log::info!("Attempting WebSocket connection...");

            match self.client.connect().await {
                Ok(_) => {
                    log::info!("WebSocket connected successfully");
                    // Reset delay on successful connection
                    delay = Duration::from_secs(1);
                    // Connection established, break out of retry loop
                    break;
                }
                Err(e) => {
                    log::warn!("WebSocket connection failed: {}. Retrying in {:?}", e, delay);

                    // Emit reconnecting status
                    self.client
                        .window
                        .emit("connection_status", ConnectionState::Reconnecting)
                        .ok();

                    // Wait before next attempt
                    sleep(delay).await;

                    // Double delay for next attempt, capped at max_delay
                    delay = std::cmp::min(delay * 2, self.max_delay);
                }
            }
        }
    }

    /// Start reconnection loop (called when connection is lost)
    pub async fn start_reconnection(&self) {
        log::info!("Starting reconnection attempts...");
        self.connect_with_retry().await;
    }
}
