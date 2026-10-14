use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};
use std::path::PathBuf;

pub mod learning;

pub type DbPool = Pool<Sqlite>;

pub async fn init_db(data_dir: PathBuf) -> Result<DbPool, String> {
    tokio::fs::create_dir_all(&data_dir)
        .await
        .map_err(|e| format!("Impossible de créer le dossier data : {}", e))?;

    let db_path = data_dir.join("auramail.db");
    let conn_str = format!("sqlite://{}?mode=rwc", db_path.to_string_lossy());

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&conn_str)
        .await
        .map_err(|e| format!("Échec connexion SQLite : {}", e))?;

    // Exécution des migrations et création des tables FTS5
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS workspaces (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            icon TEXT NOT NULL,
            color TEXT NOT NULL,
            ai_prompt_override TEXT
        );

        CREATE TABLE IF NOT EXISTS accounts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            provider TEXT NOT NULL,
            imap_host TEXT NOT NULL,
            imap_port INTEGER NOT NULL,
            smtp_host TEXT NOT NULL,
            smtp_port INTEGER NOT NULL,
            auth_type TEXT NOT NULL,
            workspace_id TEXT REFERENCES workspaces(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS emails (
            id TEXT PRIMARY KEY,
            account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            folder TEXT NOT NULL,
            message_id TEXT NOT NULL,
            thread_id TEXT,
            from_name TEXT,
            from_address TEXT NOT NULL,
            to_addresses TEXT NOT NULL,
            cc_addresses TEXT,
            subject TEXT,
            date TIMESTAMP NOT NULL,
            body_plain TEXT,
            body_html TEXT,
            snippet TEXT,
            is_read BOOLEAN DEFAULT 0,
            is_starred BOOLEAN DEFAULT 0,
            has_attachments BOOLEAN DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS ai_triage (
            email_id TEXT PRIMARY KEY REFERENCES emails(id) ON DELETE CASCADE,
            category TEXT NOT NULL,
            priority_score INTEGER NOT NULL,
            summary TEXT NOT NULL,
            reasoning TEXT,
            suggested_actions TEXT,
            model_used TEXT NOT NULL,
            triaged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Table virtuelle FTS5 pour recherche instantanée
        CREATE VIRTUAL TABLE IF NOT EXISTS emails_fts USING fts5(
            subject,
            from_name,
            from_address,
            body_plain,
            content='emails',
            content_rowid='rowid'
        );

        -- Corrections manuelles de l'utilisateur (pour Few-Shot Learning)
        CREATE TABLE IF NOT EXISTS ai_corrections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email_id TEXT NOT NULL,
            sender TEXT NOT NULL,
            subject_keywords TEXT,
            original_category TEXT NOT NULL,
            corrected_category TEXT NOT NULL,
            original_priority INTEGER NOT NULL,
            corrected_priority INTEGER NOT NULL,
            user_note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Règles synthétisées apprises au fil de l'eau
        CREATE TABLE IF NOT EXISTS ai_learned_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workspace_id TEXT NOT NULL,
            rule_text TEXT NOT NULL,
            confidence REAL NOT NULL,
            sample_count INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        "#
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Échec initialisation schéma DB : {}", e))?;

    // Insérer un workspace par défaut si vide
    let _ = sqlx::query(
        "INSERT OR IGNORE INTO workspaces (id, name, icon, color) VALUES ('default', 'Personnel', 'user', '#6366f1')"
    )
    .execute(&pool)
    .await;

    Ok(pool)
}
