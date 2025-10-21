use tauri::AppHandle;
use tauri_plugin_store::StoreBuilder;

const STORE_FILE: &str = "settings.json";
const DISPLAY_NAME_KEY: &str = "displayName";

/// Load display name from persistent storage
pub async fn load_display_name(app_handle: &AppHandle) -> Result<Option<String>, String> {
    let store = StoreBuilder::new(app_handle, STORE_FILE)
        .build()
        .map_err(|e| format!("Failed to load store: {}", e))?;

    match store.get(DISPLAY_NAME_KEY) {
        Some(value) => {
            let name = value
                .as_str()
                .ok_or("Display name is not a string")?
                .to_string();
            Ok(Some(name))
        }
        None => Ok(None),
    }
}

/// Save display name to persistent storage
pub async fn save_display_name(app_handle: &AppHandle, name: String) -> Result<(), String> {
    let mut store = StoreBuilder::new(app_handle, STORE_FILE)
        .build()
        .map_err(|e| format!("Failed to load store: {}", e))?;

    store
        .insert(DISPLAY_NAME_KEY.to_string(), serde_json::json!(name))
        .map_err(|e| format!("Failed to insert display name: {}", e))?;

    store
        .save()
        .map_err(|e| format!("Failed to save store: {}", e))?;

    Ok(())
}
