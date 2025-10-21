pub mod client;
pub mod reconnect;

use std::sync::Arc;
use tauri::{AppHandle, Manager, Window};
use tokio::sync::Mutex;

pub use client::WebSocketClient;
pub use reconnect::ReconnectionManager;

/// Shared WebSocket state managed by Tauri
pub struct WebSocketState {
    pub client: Arc<Mutex<Option<WebSocketClient>>>,
    pub window: Window,
}

impl WebSocketState {
    pub fn new(window: Window) -> Self {
        Self {
            client: Arc::new(Mutex::new(None)),
            window,
        }
    }
}
