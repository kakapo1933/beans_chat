// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod models;
mod storage;
mod websocket;

use tauri::Manager;

fn main() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            commands::get_display_name,
            commands::save_display_name,
            commands::connect_to_server,
            commands::send_message,
            commands::disconnect,
        ])
        .setup(|app| {
            // Initialize WebSocket client state
            let window = app.get_window("main").unwrap();
            app.manage(websocket::WebSocketState::new(window));
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
