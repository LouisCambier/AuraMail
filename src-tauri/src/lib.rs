pub mod ai;
pub mod auth;
pub mod db;
pub mod mail;

use ai::{AuraLLM, EmailContent, OllamaProvider, OpenAICompatibleProvider, TriageResult};
use auth::SecretStore;
use mail::{EmailItem, WorkspaceItem};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;

pub struct AppState {
    pub db: db::DbPool,
}

#[derive(Serialize, Deserialize)]
pub struct AiProviderConfig {
    pub provider_type: String, // 'ollama' | 'claude' | 'gemini' | 'openai_compatible'
    pub base_url: Option<String>,
    pub api_key: Option<String>,
    pub model: Option<String>,
}

#[tauri::command]
pub async fn get_workspaces(state: State<'_, Arc<AppState>>) -> Result<Vec<WorkspaceItem>, String> {
    let rows = sqlx::query_as!(
        (String, String, String, String),
        "SELECT id, name, icon, color FROM workspaces"
    )
    .fetch_all(&state.db)
    .await
    .unwrap_or_default();

    let items = rows
        .into_iter()
        .map(|r| WorkspaceItem {
            id: r.0,
            name: r.1,
            icon: r.2,
            color: r.3,
            unread_count: 0,
        })
        .collect();

    Ok(items)
}

#[tauri::command]
pub async fn triage_email_direct(
    email: EmailContent,
    config: AiProviderConfig,
) -> Result<TriageResult, String> {
    let provider: Box<dyn AuraLLM> = match config.provider_type.as_str() {
        "ollama" => Box::new(OllamaProvider::new(config.base_url, config.model)),
        "openai_compatible" | "claude" | "gemini" => {
            let base_url = config.base_url.unwrap_or_else(|| "https://api.openai.com/v1".to_string());
            let key = config.api_key.unwrap_or_default();
            let model = config.model.unwrap_or_else(|| "gpt-4o-mini".to_string());
            Box::new(OpenAICompatibleProvider::new(base_url, key, model))
        }
        _ => return Err("Type de fournisseur IA non supporté".to_string()),
    };

    provider.triage_email(&email).await
}

#[tauri::command]
pub async fn generate_reply_direct(
    email: EmailContent,
    intent: String,
    config: AiProviderConfig,
) -> Result<String, String> {
    let provider: Box<dyn AuraLLM> = match config.provider_type.as_str() {
        "ollama" => Box::new(OllamaProvider::new(config.base_url, config.model)),
        _ => {
            let base_url = config.base_url.unwrap_or_else(|| "https://api.openai.com/v1".to_string());
            let key = config.api_key.unwrap_or_default();
            let model = config.model.unwrap_or_else(|| "gpt-4o-mini".to_string());
            Box::new(OpenAICompatibleProvider::new(base_url, key, model))
        }
    };

    provider.generate_reply(&email, &intent).await
}

#[tauri::command]
pub fn store_api_credential(provider: String, key: String) -> Result<(), String> {
    SecretStore::store_secret(&format!("ai_key_{}", provider), &key)
}

#[tauri::command]
pub fn retrieve_api_credential(provider: String) -> Result<String, String> {
    SecretStore::get_secret(&format!("ai_key_{}", provider))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::block_on(async move {
                let app_dir = handle
                    .path()
                    .app_data_dir()
                    .unwrap_or_else(|_| std::path::PathBuf::from("./.auramail_data"));
                let pool = db::init_db(app_dir).await.expect("Impossible d'initialiser SQLite");
                handle.manage(Arc::new(AppState { db: pool }));
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_workspaces,
            triage_email_direct,
            generate_reply_direct,
            store_api_credential,
            retrieve_api_credential
        ])
        .run(tauri::generate_context!())
        .expect("Erreur lors de l'exécution de l'application AuraMail");
}
