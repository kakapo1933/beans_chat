use serde::{Deserialize, Serialize};

/// User's identity (display name only in MVP)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserIdentity {
    pub display_name: String,
}

/// A single chat message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: String,
    #[serde(rename = "displayName")]
    pub display_name: String,
    pub content: String,
    pub timestamp: String, // ISO 8601 format
}

/// WebSocket connection state
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ConnectionState {
    Connecting,
    Connected,
    Disconnected,
    Reconnecting,
}

/// Chat room (hardcoded to "General" in MVP)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatRoom {
    pub id: String,
    pub name: String,
}

impl ChatRoom {
    pub fn default_room() -> Self {
        ChatRoom {
            id: "general".to_string(),
            name: "General".to_string(),
        }
    }
}

/// WebSocket message types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum WSMessage {
    Message {
        id: String,
        #[serde(rename = "displayName")]
        display_name: String,
        content: String,
        timestamp: String,
    },
    Ping,
    Pong,
}
