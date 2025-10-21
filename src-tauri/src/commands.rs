use crate::models::{Message, WSMessage};
use crate::storage::{load_display_name, save_display_name as save_name};
use crate::websocket::WebSocketState;
use tauri::State;

#[tauri::command]
pub async fn get_display_name(app_handle: tauri::AppHandle) -> Result<Option<String>, String> {
    load_display_name(&app_handle).await
}

#[tauri::command]
pub async fn save_display_name(
    name: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    // Validate display name (2-20 chars, alphanumeric + space, hyphen, underscore)
    let trimmed = name.trim();

    if trimmed.len() < 2 || trimmed.len() > 20 {
        return Err("Display name must be between 2 and 20 characters".to_string());
    }

    let valid_chars = trimmed
        .chars()
        .all(|c| c.is_alphanumeric() || c == ' ' || c == '-' || c == '_');

    if !valid_chars {
        return Err(
            "Display name can only contain letters, numbers, spaces, hyphens, and underscores"
                .to_string(),
        );
    }

    save_name(&app_handle, trimmed.to_string()).await
}

#[tauri::command]
pub async fn connect_to_server(
    state: State<'_, WebSocketState>,
) -> Result<(), String> {
    log::info!("Connecting to WebSocket server...");

    let client = crate::websocket::WebSocketClient::new(
        "ws://localhost:8080".to_string(),
        state.window.clone(),
    );

    let reconnect_manager = crate::websocket::ReconnectionManager::new(client.clone());

    // Start connection with retry logic
    tokio::spawn(async move {
        reconnect_manager.connect_with_retry().await;
    });

    Ok(())
}

#[tauri::command]
pub async fn send_message(
    display_name: String,
    content: String,
    state: State<'_, WebSocketState>,
) -> Result<(), String> {
    // Generate message ID and timestamp
    let id = uuid::Uuid::new_v4().to_string();
    let timestamp = chrono::Utc::now().to_rfc3339();

    let message = WSMessage::Message {
        id,
        display_name,
        content,
        timestamp,
    };

    // Send message via WebSocket client
    let client_opt = state.client.lock().await;

    if let Some(client) = client_opt.as_ref() {
        client.send_message(message).await
    } else {
        Err("Not connected to server".to_string())
    }
}

#[tauri::command]
pub async fn disconnect(state: State<'_, WebSocketState>) -> Result<(), String> {
    let mut client_opt = state.client.lock().await;
    *client_opt = None;
    log::info!("Disconnected from WebSocket server");
    Ok(())
}
