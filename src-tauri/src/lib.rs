pub mod ai;
pub mod auth;
pub mod commands;
pub mod db;
pub mod mail;

use std::sync::Arc;
use tauri::Manager;

pub struct AppState {
    pub db: db::DbPool,
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
            commands::get_workspaces,
            commands::triage_email_direct,
            commands::record_triage_correction,
            commands::get_learned_rules,
            commands::reset_learning,
            commands::generate_reply_direct,
            commands::store_api_credential,
            commands::retrieve_api_credential,
            commands::test_imap_connection,
            commands::sync_imap_folder,
            commands::send_smtp_email,
            commands::get_oauth2_auth_url,
            commands::listen_oauth2_callback
        ])
        .run(tauri::generate_context!())
        .expect("Erreur lors de l'exécution de l'application AuraMail");
}
