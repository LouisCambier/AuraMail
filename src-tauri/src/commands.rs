use crate::ai::{AuraLLM, EmailContent, OllamaProvider, OpenAICompatibleProvider, TriageResult};
use crate::auth::SecretStore;
use crate::mail::WorkspaceItem;
use crate::{auth, db, mail, AppState};
use serde::{Deserialize, Serialize};
use sqlx::Row;
use std::sync::Arc;
use tauri::State;

#[derive(Serialize, Deserialize)]
pub struct AiProviderConfig {
    pub provider_type: String, // 'ollama' | 'claude' | 'gemini' | 'openai_compatible'
    pub base_url: Option<String>,
    pub api_key: Option<String>,
    pub model: Option<String>,
}

#[tauri::command]
pub async fn get_workspaces(state: State<'_, Arc<AppState>>) -> Result<Vec<WorkspaceItem>, String> {
    let rows = sqlx::query("SELECT id, name, icon, color FROM workspaces")
        .fetch_all(&state.db)
        .await
        .unwrap_or_default();

    let items = rows
        .into_iter()
        .map(|r| WorkspaceItem {
            id: r.get("id"),
            name: r.get("name"),
            icon: r.get("icon"),
            color: r.get("color"),
            unread_count: 0,
        })
        .collect();

    Ok(items)
}

#[tauri::command]
pub async fn triage_email_direct(
    state: State<'_, Arc<AppState>>,
    email: EmailContent,
    config: AiProviderConfig,
) -> Result<TriageResult, String> {
    // 🧠 Récupérer les corrections et préférences passées de l'utilisateur pour cet expéditeur/sujet
    let learning_context = db::learning::get_relevant_corrections(
        &state.db,
        &email.from,
        &email.subject,
        5,
    )
    .await
    .unwrap_or_default();

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

    provider.triage_email(&email, &learning_context).await
}

#[tauri::command]
pub async fn record_triage_correction(
    state: State<'_, Arc<AppState>>,
    correction: db::learning::CorrectionEntry,
) -> Result<(), String> {
    db::learning::save_correction(&state.db, &correction).await
}

#[tauri::command]
pub async fn get_learned_rules(
    state: State<'_, Arc<AppState>>,
    workspace_id: String,
) -> Result<Vec<db::learning::LearnedRule>, String> {
    db::learning::get_all_learned_rules(&state.db, &workspace_id).await
}

#[tauri::command]
pub async fn reset_learning(state: State<'_, Arc<AppState>>) -> Result<(), String> {
    db::learning::clear_learning_data(&state.db).await
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

#[tauri::command]
pub async fn test_imap_connection(config: mail::imap::ImapConfig) -> Result<bool, String> {
    mail::imap::ImapEngine::test_connection(&config).await
}

#[tauri::command]
pub async fn sync_imap_folder(
    config: mail::imap::ImapConfig,
    folder: String,
    limit: u32,
) -> Result<Vec<mail::imap::FetchedEmail>, String> {
    mail::imap::ImapEngine::sync_folder(&config, &folder, limit).await
}

#[tauri::command]
pub async fn send_smtp_email(
    config: mail::smtp::SmtpConfig,
    email: mail::smtp::OutgoingEmail,
) -> Result<String, String> {
    mail::smtp::SmtpEngine::send_email(&config, &email).await
}

#[tauri::command]
pub fn get_oauth2_auth_url(
    provider: String,
    client_id: String,
    port: u16,
    verifier: String,
) -> Result<String, String> {
    match provider.as_str() {
        "google" => Ok(auth::oauth2::OAuthManager::build_google_auth(
            &client_id, port, &verifier,
        )),
        "microsoft" => Ok(auth::oauth2::OAuthManager::build_microsoft_auth(
            &client_id, port, &verifier,
        )),
        _ => Err("Fournisseur OAuth2 non supporté".to_string()),
    }
}

#[tauri::command]
pub async fn listen_oauth2_callback(port: u16) -> Result<String, String> {
    auth::oauth2::OAuthManager::listen_for_code(port).await
}
